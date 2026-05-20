// GitHub commits sync.
// Cron: 0 6 * * * (daily 6am UTC — configured in vercel.json)
// For every project with a repo_url, fetch the last 30 commits since the
// last sync (or 14 days back on first run) and upsert into public.commits.

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { listCommits, parseRepoUrl } from "@/lib/github-api";

function authorized(req: Request): boolean {
  const url = new URL(req.url);
  if (req.headers.get("x-vercel-cron")) return true;
  const provided = url.searchParams.get("key")?.trim();
  const expected = (process.env.JH_INGEST_KEY || "").replace(/\\n|\n|\r/g, "").trim();
  if (provided && expected && provided === expected) return true;
  return false;
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const startedAt = Date.now();
  const sb = supabaseServer();
  const summary = {
    repos_scanned: 0,
    commits_upserted: 0,
    errors: [] as string[],
  };

  try {
    const { data: projects, error: pErr } = await sb
      .from("projects")
      .select("slug, repo_url")
      .not("repo_url", "is", null);
    if (pErr) throw pErr;

    // Cursor: per-repo last_synced_at lives in commits.committed_at MAX
    for (const proj of projects ?? []) {
      const parsed = parseRepoUrl(proj.repo_url);
      if (!parsed) continue;
      summary.repos_scanned++;
      try {
        const { data: latest } = await sb
          .from("commits")
          .select("committed_at")
          .eq("project_slug", proj.slug)
          .order("committed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        // First-run: fetch latest 50 with no time filter. Subsequent runs: only new.
        const opts = latest?.committed_at
          ? { since: new Date(latest.committed_at).toISOString(), per_page: 100 }
          : { per_page: 50 };

        const commits = await listCommits(parsed.owner, parsed.repo, opts);
        const rows = commits.map((c) => ({
          sha: c.sha,
          project_slug: proj.slug,
          message: c.commit.message.split("\n")[0].slice(0, 500),
          author: c.commit.author?.name ?? null,
          committed_at: c.commit.author?.date ?? new Date().toISOString(),
          url: c.html_url,
          additions: c.stats?.additions ?? null,
          deletions: c.stats?.deletions ?? null,
        }));
        if (rows.length === 0) continue;
        const { error: cErr } = await sb.from("commits").upsert(rows, { onConflict: "sha" });
        if (cErr) {
          summary.errors.push(`${proj.slug}: ${cErr.message}`);
          continue;
        }
        summary.commits_upserted += rows.length;

        // touch project.last_touched_at to latest commit
        const newestCommitAt = rows[0]?.committed_at;
        if (newestCommitAt) {
          await sb.from("projects").update({ last_touched_at: newestCommitAt }).eq("slug", proj.slug);
        }
      } catch (e) {
        summary.errors.push(`${proj.slug}: ${(e as Error).message}`);
      }
    }

    await sb.from("ingester_state").upsert(
      {
        id: "github",
        last_run_at: new Date().toISOString(),
        cursor: { repos_scanned: summary.repos_scanned, commits_upserted: summary.commits_upserted },
        notes: summary.errors.length ? summary.errors.slice(0, 3).join(" | ") : null,
      },
      { onConflict: "id" }
    );

    return NextResponse.json({ ok: true, duration_ms: Date.now() - startedAt, ...summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message, duration_ms: Date.now() - startedAt, ...summary },
      { status: 500 }
    );
  }
}
