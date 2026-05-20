// Vercel deploys sync.
// Cron: */30 * * * * (every 30 minutes — configured in vercel.json)
// Pulls all projects + latest production deployments, upserts to deployments
// table, updates projects.last_deploy_state / last_deploy_at / vercel_project_id.

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { listVercelProjects, listProjectDeployments } from "@/lib/vercel-api";

// Vercel Cron sends GET with header `x-vercel-cron: 1`. We accept any GET if the
// caller knows the JH_INGEST_KEY query param (for ad-hoc manual triggers).
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
    projects_scanned: 0,
    deployments_upserted: 0,
    projects_touched: 0,
    errors: [] as string[],
  };

  try {
    // Load known slugs (longest-first to avoid prefix collisions)
    const { data: projects, error: pErr } = await sb.from("projects").select("slug, vercel_project_id");
    if (pErr) throw pErr;
    const slugs = (projects ?? []).map((p) => p.slug).sort((a, b) => b.length - a.length);

    function detectSlug(vercelName: string): string | null {
      const name = vercelName.toLowerCase();
      for (const s of slugs) {
        if (name === s || name.startsWith(`${s}-`) || name.endsWith(`-${s}`) || name.includes(s)) {
          return s;
        }
      }
      return null;
    }

    const vercelProjects = await listVercelProjects();
    summary.projects_scanned = vercelProjects.length;

    for (const vp of vercelProjects) {
      const slug = detectSlug(vp.name);
      try {
        const deps = await listProjectDeployments(vp.id, 5);
        if (deps.length === 0) continue;

        // Upsert deployments
        const rows = deps.map((d) => ({
          vercel_deployment_id: d.uid || d.id || "",
          project_slug: slug,
          state: d.readyState || d.state || null,
          url: d.url ? `https://${d.url}` : null,
          commit_sha: d.meta?.githubCommitSha || null,
          branch: d.meta?.githubCommitRef || null,
          created_at: new Date(d.createdAt).toISOString(),
          ready_at: d.readyAt ? new Date(d.readyAt).toISOString() : null,
          error_message: d.errorMessage || null,
        })).filter((r) => r.vercel_deployment_id);

        if (rows.length) {
          const { error: dErr } = await sb
            .from("deployments")
            .upsert(rows, { onConflict: "vercel_deployment_id" });
          if (dErr) {
            summary.errors.push(`${vp.name}: ${dErr.message}`);
            continue;
          }
          summary.deployments_upserted += rows.length;
        }

        // Update projects row with latest state + vercel_project_id linkage
        if (slug) {
          const latest = deps[0];
          await sb
            .from("projects")
            .update({
              vercel_project_id: vp.id,
              vercel_url: latest.url ? `https://${latest.url}` : null,
              last_deploy_state: latest.readyState || latest.state || null,
              last_deploy_at: new Date(latest.createdAt).toISOString(),
            })
            .eq("slug", slug);
          summary.projects_touched++;
        }
      } catch (e) {
        summary.errors.push(`${vp.name}: ${(e as Error).message}`);
      }
    }

    await sb.from("ingester_state").upsert(
      {
        id: "vercel",
        last_run_at: new Date().toISOString(),
        cursor: { projects_scanned: summary.projects_scanned, deployments_upserted: summary.deployments_upserted },
        notes: summary.errors.length ? summary.errors.slice(0, 3).join(" | ") : null,
      },
      { onConflict: "id" }
    );

    return NextResponse.json({
      ok: true,
      duration_ms: Date.now() - startedAt,
      ...summary,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message, duration_ms: Date.now() - startedAt, ...summary },
      { status: 500 }
    );
  }
}
