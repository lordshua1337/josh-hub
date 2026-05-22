// /website/pages — per-page traffic rollup from the existing public.pageviews
// table (the self-hosted /api/track ingest pipeline). Top pages by views,
// sessions, time windows. No Web Vitals here yet — that needs Vercel Speed
// Insights wired separately.

import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PV = {
  site: string | null;
  path: string;
  session_id: string | null;
  referrer: string | null;
  device: string | null;
  utm_source: string | null;
  ts: string;
};

type PageStat = {
  site: string;
  path: string;
  views: number;
  sessions: Set<string>;
  devices: Map<string, number>;
  referrers: Map<string, number>;
  latest: string;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function refOrigin(ref: string | null): string {
  if (!ref) return "(direct)";
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return ref.slice(0, 40);
  }
}

export default async function PagesAnalyticsPage() {
  const sb = supabaseServer();
  // 30-day window — keep query cheap, plenty for trend reading
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data, error } = await sb
    .from("pageviews")
    .select("site, path, session_id, referrer, device, utm_source, ts")
    .gte("ts", since)
    .order("ts", { ascending: false })
    .limit(20_000);

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Pages</h1>
          <p className="header-sub" style={{ color: "var(--danger)" }}>{error.message}</p>
        </div>
      </>
    );
  }
  const rows = (data ?? []) as PV[];

  // Bucket time windows
  const now = Date.now();
  const day = 86_400_000;
  const view24h = rows.filter((r) => now - new Date(r.ts).getTime() < day).length;
  const view7d = rows.filter((r) => now - new Date(r.ts).getTime() < 7 * day).length;

  // Aggregate per-page
  const pageMap = new Map<string, PageStat>();
  const overallSessions = new Set<string>();
  for (const r of rows) {
    if (!r.path) continue;
    const site = (r.site || "unknown").toLowerCase();
    const key = `${site}::${r.path}`;
    const cur = pageMap.get(key) ?? {
      site,
      path: r.path,
      views: 0,
      sessions: new Set<string>(),
      devices: new Map<string, number>(),
      referrers: new Map<string, number>(),
      latest: r.ts,
    };
    cur.views += 1;
    if (r.session_id) cur.sessions.add(r.session_id);
    if (r.session_id) overallSessions.add(r.session_id);
    if (r.device) cur.devices.set(r.device, (cur.devices.get(r.device) ?? 0) + 1);
    const refOri = refOrigin(r.referrer);
    cur.referrers.set(refOri, (cur.referrers.get(refOri) ?? 0) + 1);
    if (r.ts > cur.latest) cur.latest = r.ts;
    pageMap.set(key, cur);
  }
  const pages = [...pageMap.values()].sort((a, b) => b.views - a.views);

  // Top-line metrics
  const totalViews = rows.length;
  const totalSessions = overallSessions.size;
  const sites = new Map<string, number>();
  for (const p of pages) sites.set(p.site, (sites.get(p.site) ?? 0) + p.views);
  const distinctSites = sites.size;

  // Group pages by site for display
  const pagesBySite = new Map<string, PageStat[]>();
  for (const p of pages) {
    if (!pagesBySite.has(p.site)) pagesBySite.set(p.site, []);
    pagesBySite.get(p.site)!.push(p);
  }
  const sortedSites = [...pagesBySite.entries()].sort((a, b) => (sites.get(b[0]) ?? 0) - (sites.get(a[0]) ?? 0));

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">analytics</p>
        <h1>Pages</h1>
        <p className="header-sub">
          Per-page traffic from the self-hosted{" "}
          <code style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)" }}>/api/track</code> pipeline.
          {pages.length} unique paths across {distinctSites} {distinctSites === 1 ? "site" : "sites"} in the last 30 days.
        </p>
      </div>
      <div className="main">
        <div className="stats-bar" style={{ marginBottom: 18 }}>
          <div className="stat-card">
            <div className="stat-label">Page views (30d)</div>
            <div className="stat-num">{fmt(totalViews)}</div>
            <div className="stat-delta">{view24h} in last 24h · {view7d} last 7d</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sessions</div>
            <div className="stat-num">{fmt(totalSessions)}</div>
            <div className="stat-delta">
              {totalSessions > 0 ? `${(totalViews / totalSessions).toFixed(1)} pages / session` : "—"}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique paths</div>
            <div className="stat-num">{pages.length}</div>
            <div className="stat-delta">Across {distinctSites} {distinctSites === 1 ? "site" : "sites"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Top page</div>
            <div className="stat-num" style={{ fontSize: 16, fontFamily: "var(--mono)" }}>
              {pages[0] ? pages[0].path.slice(0, 18) : "—"}
            </div>
            <div className="stat-delta">{pages[0] ? `${pages[0].views} views` : "no data"}</div>
          </div>
        </div>

        {pages.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
              // no pageviews
            </div>
            <div style={{ fontSize: 14 }}>
              Drop <code style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>/track.js</code> on your sites and traffic shows up here.
            </div>
          </div>
        ) : (
          sortedSites.map(([siteName, sitePages]) => (
            <div key={siteName} className="fl-reveal" style={{ marginBottom: 26 }}>
              <div className="section-header" style={{ marginBottom: 10 }}>
                <div className="section-label">{siteName}</div>
                <span className="log-count">
                  {sitePages.length} pages · {sites.get(siteName)} views
                </span>
              </div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(160px,2.2fr) 80px 100px 130px 130px 100px",
                    gap: 12,
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--border)",
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <div>Path</div>
                  <div style={{ textAlign: "right" }}>Views</div>
                  <div>Share</div>
                  <div>Sessions</div>
                  <div>Top referrer</div>
                  <div style={{ textAlign: "right" }}>Latest hit</div>
                </div>
                {sitePages.slice(0, 50).map((p) => {
                  const siteTotal = sites.get(siteName) ?? 1;
                  const pct = Math.round((p.views / siteTotal) * 100);
                  const topRef = [...p.referrers.entries()].sort((a, b) => b[1] - a[1])[0];
                  return (
                    <div
                      key={`${p.site}::${p.path}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(160px,2.2fr) 80px 100px 130px 130px 100px",
                        gap: 12,
                        padding: "11px 16px",
                        alignItems: "center",
                        borderBottom: "1px solid var(--border)",
                        fontSize: 13,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          color: "var(--text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.path}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, textAlign: "right" }}>
                        {p.views}
                      </div>
                      <div style={{ position: "relative", height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: `${Math.max(2, pct)}%`,
                            background: "var(--accent)",
                            borderRadius: 3,
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
                        {p.sessions.size}{" "}
                        <span style={{ color: "var(--text-tertiary)", opacity: 0.6 }}>
                          ({(p.views / Math.max(1, p.sessions.size)).toFixed(1)}/s)
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {topRef ? `${topRef[0]} (${topRef[1]})` : "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)", textAlign: "right" }}>
                        {timeAgo(p.latest)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
