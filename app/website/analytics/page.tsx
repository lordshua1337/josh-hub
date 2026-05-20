import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = {
  site: string;
  path: string;
  referrer: string | null;
  country: string | null;
  device: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  session_id: string | null;
  ts: string;
};

const SCRIPT_TAG = `<script defer src="https://prometheus-hub.vercel.app/track.js" data-site="your-site-slug"></script>`;

async function loadRows(): Promise<Row[]> {
  const sb = supabaseServer();
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data, error } = await sb
    .from("pageviews")
    .select("site, path, referrer, country, device, utm_source, utm_medium, session_id, ts")
    .gte("ts", cutoff)
    .order("ts", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data as Row[]) ?? [];
}

function topN<T>(arr: T[], keyOf: (x: T) => string, n = 10): { key: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const x of arr) {
    const k = keyOf(x) || "—";
    map[k] = (map[k] || 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

function uniqueSessions(rows: Row[]): number {
  const set = new Set<string>();
  for (const r of rows) if (r.session_id) set.add(r.session_id);
  return set.size;
}

function refDomain(r: string | null): string {
  if (!r) return "(direct)";
  try {
    return new URL(r).hostname.replace(/^www\./, "");
  } catch {
    return r;
  }
}

export default async function AnalyticsPage() {
  let rows: Row[] = [];
  let err: string | null = null;
  try {
    rows = await loadRows();
  } catch (e) {
    err = (e as Error).message;
  }

  const now = Date.now();
  const last24h = rows.filter((r) => now - new Date(r.ts).getTime() < 86400_000);
  const last7d = rows.filter((r) => now - new Date(r.ts).getTime() < 7 * 86400_000);
  const last30d = rows;

  const sites = topN(rows, (r) => r.site, 8);
  const topPages = topN(rows, (r) => `${r.site}${r.path}`, 12);
  const topReferrers = topN(rows, (r) => refDomain(r.referrer), 10);
  const topUtm = topN(
    rows.filter((r) => r.utm_source),
    (r) => `${r.utm_source}/${r.utm_medium || "—"}`,
    8
  );
  const devices = topN(rows, (r) => r.device || "—", 4);
  const countries = topN(rows, (r) => r.country || "—", 8);

  const showEmptyState = rows.length === 0;

  return (
    <>
      <div className="header fl-reveal">
        <h1>Website Analytics</h1>
        <p className="header-sub">
          Self-hosted pageview tracking. Add the snippet below to any site to start collecting.
        </p>
      </div>
      <div className="main">
        {err && (
          <div className="card" style={{ padding: 20, color: "var(--danger)", marginBottom: 20 }}>
            {err}
          </div>
        )}

        <div className="stats-bar" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-label">Last 24h</div>
            <div className="stat-num">{last24h.length}</div>
            <div className="stat-delta">Pageviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Last 7 days</div>
            <div className="stat-num">{last7d.length}</div>
            <div className="stat-delta">{uniqueSessions(last7d)} unique sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Last 30 days</div>
            <div className="stat-num">{last30d.length}</div>
            <div className="stat-delta">{uniqueSessions(last30d)} unique sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sites tracked</div>
            <div className="stat-num">{sites.length}</div>
            <div className="stat-delta">{sites[0]?.key || "—"} top</div>
          </div>
        </div>

        {showEmptyState && (
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>
              No data yet — install the snippet
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
              Paste this once on every site you want to track. Replace{" "}
              <code style={{ background: "var(--accent-soft)", padding: "1px 6px", borderRadius: 4 }}>
                your-site-slug
              </code>{" "}
              with a short name (e.g. <code>prometheus</code>, <code>doodleforge</code>). Stats start
              flowing the next page load.
            </p>
            <pre
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 12,
                fontFamily: "var(--mono)",
                fontSize: 12,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {SCRIPT_TAG}
            </pre>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <RankCard title="Sites" rows={sites} />
          <RankCard title="Devices" rows={devices} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <RankCard title="Top Pages" rows={topPages} mono />
          <RankCard title="Top Referrers" rows={topReferrers} mono />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <RankCard title="UTM source/medium" rows={topUtm} mono />
          <RankCard title="Countries" rows={countries} />
        </div>

        {!showEmptyState && (
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>
              Snippet
            </div>
            <pre
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 12,
                fontFamily: "var(--mono)",
                fontSize: 12,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                margin: 0,
              }}
            >
              {SCRIPT_TAG}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}

function RankCard({
  title,
  rows,
  mono,
}: {
  title: string;
  rows: { key: string; count: number }[];
  mono?: boolean;
}) {
  const max = rows[0]?.count || 1;
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="section-label" style={{ marginBottom: 12 }}>
        {title}
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>No data.</div>
      ) : (
        rows.map((r) => (
          <div key={r.key} className="trend-row" style={{ marginBottom: 8 }}>
            <div
              className="trend-label"
              style={{
                width: 180,
                textAlign: "left",
                fontFamily: mono ? "var(--mono)" : "inherit",
                fontSize: 12,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={r.key}
            >
              {r.key}
            </div>
            <div className="trend-bar-track">
              <div
                className="trend-bar-fill trend-bar-fill-feat"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
            <div className="trend-val">{r.count}</div>
          </div>
        ))
      )}
    </div>
  );
}
