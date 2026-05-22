// /projects — live view of every Vercel deployment tied to Josh.
// Reads from public.projects (auto-synced by the /api/cron/vercel job
// every 30 min). Grouped by recency: Active (last 30d) / Recent (30-90d)
// / Stale (90d+). Each card links straight to the live URL.

import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProjectRow = {
  slug: string;
  name: string;
  description: string | null;
  live_url: string | null;
  vercel_url: string | null;
  repo_url: string | null;
  last_deploy_at: string | null;
  last_deploy_state: string | null;
  current_status: string | null;
  stack: string[] | null;
  notes: string | null;
};

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function timeAgo(iso: string | null): string {
  const d = daysSince(iso);
  if (d >= 9999) return "—";
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export default async function ProjectsPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("projects")
    .select(
      "slug, name, description, live_url, vercel_url, repo_url, last_deploy_at, last_deploy_state, current_status, stack, notes"
    )
    .in("current_status", ["active", "recent", "stale"])
    .order("last_deploy_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Projects</h1>
          <p className="header-sub">Could not load projects.</p>
        </div>
        <div className="main">
          <pre style={{ color: "var(--danger)", fontSize: 12 }}>{error.message}</pre>
        </div>
      </>
    );
  }

  const rows = (data ?? []) as ProjectRow[];
  const active = rows.filter((p) => daysSince(p.last_deploy_at) < 30);
  const recent = rows.filter((p) => {
    const d = daysSince(p.last_deploy_at);
    return d >= 30 && d < 90;
  });
  const stale = rows.filter((p) => daysSince(p.last_deploy_at) >= 90);

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">deployed</p>
        <h1>Projects</h1>
        <p className="header-sub">
          {rows.length} deployments under your Vercel team. {active.length} active in the last 30 days.
          Auto-synced from Vercel every 30 minutes.
        </p>
      </div>
      <div className="main">
        <div className="stats-bar" style={{ marginBottom: 18 }}>
          <div className="stat-card">
            <div className="stat-label">Active</div>
            <div className="stat-num">{active.length}</div>
            <div className="stat-delta">Updated in last 30d</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recent</div>
            <div className="stat-num">{recent.length}</div>
            <div className="stat-delta">30–90 days ago</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Stale</div>
            <div className="stat-num">{stale.length}</div>
            <div className="stat-delta">90+ days, candidates for archive</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">All deployments</div>
            <div className="stat-num">{rows.length}</div>
            <div className="stat-delta">From Supabase + Vercel API</div>
          </div>
        </div>

        {active.length > 0 && (
          <ProjectGroup title="Active" tagline="touched in the last 30 days" rows={active} />
        )}
        {recent.length > 0 && (
          <ProjectGroup title="Recent" tagline="touched 30–90 days ago" rows={recent} />
        )}
        {stale.length > 0 && (
          <ProjectGroup title="Stale" tagline="90+ days untouched — review and archive" rows={stale} muted />
        )}
      </div>
    </>
  );
}

function ProjectGroup({
  title,
  tagline,
  rows,
  muted,
}: {
  title: string;
  tagline: string;
  rows: ProjectRow[];
  muted?: boolean;
}) {
  return (
    <div className="fl-reveal" style={{ marginBottom: 28 }}>
      <div className="section-header" style={{ marginBottom: 12 }}>
        <div className="section-label">{title}</div>
        <span className="log-count">
          {rows.length} · {tagline}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
          opacity: muted ? 0.78 : 1,
        }}
      >
        {rows.map((p) => (
          <ProjectCard key={p.slug} p={p} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ p }: { p: ProjectRow }) {
  const stack = (p.stack || []).join(" · ");
  const url = p.live_url || p.vercel_url;
  return (
    <div
      className="card"
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {p.name}
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--text-tertiary)",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {timeAgo(p.last_deploy_at)}
        </div>
      </div>
      {p.description && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45 }}>
          {p.description}
        </div>
      )}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {stack && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "var(--accent)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "2px 7px",
              border: "1px solid rgba(255,138,47,0.25)",
              borderRadius: 3,
            }}
          >
            {stack}
          </span>
        )}
        {p.last_deploy_state && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: p.last_deploy_state === "READY" ? "#34d399" : "var(--text-tertiary)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "2px 7px",
              border: `1px solid ${
                p.last_deploy_state === "READY" ? "rgba(52,211,153,0.30)" : "var(--border)"
              }`,
              borderRadius: 3,
            }}
          >
            {p.last_deploy_state}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 4 }}>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "var(--accent)",
              color: "#15100e",
              border: "1px solid var(--accent)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderRadius: 3,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Visit ↗
          </a>
        )}
        {p.repo_url && (
          <a
            href={p.repo_url}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "8px 10px",
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderRadius: 3,
              textDecoration: "none",
            }}
          >
            repo
          </a>
        )}
      </div>
    </div>
  );
}
