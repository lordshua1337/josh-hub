// /lead-gen/sources — where leads come from.
// Server-aggregates public.leads by utm_source / utm_medium / utm_campaign,
// plus a channel heuristic (organic / direct / paid / social / referral).
// Conversion-to-client rate baked into every group.

import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: string;
  received_at: string;
};

type Group = {
  key: string;
  label: string;
  count: number;
  clients: number;
  latest: string | null;
};

// Heuristic — bucket a row into a high-level channel from its UTM data.
function channelOf(utm_source: string | null, utm_medium: string | null): string {
  const m = (utm_medium || "").toLowerCase();
  const s = (utm_source || "").toLowerCase();
  if (m === "cpc" || m === "paid" || m === "ppc" || s === "google_ads" || s === "fb_ads") return "paid";
  if (m === "social" || ["instagram", "twitter", "linkedin", "facebook", "tiktok"].includes(s)) return "social";
  if (m === "email" || m === "newsletter") return "email";
  if (m === "referral") return "referral";
  if (m === "organic" || s === "google" || s === "duckduckgo") return "organic";
  if (!utm_source && !utm_medium) return "direct";
  return "other";
}

function rollup<T extends LeadRow>(rows: T[], keyFn: (r: T) => string | null): Group[] {
  const m = new Map<string, Group>();
  for (const r of rows) {
    const k = keyFn(r);
    if (k === null || k === "") continue;
    const cur = m.get(k) ?? { key: k, label: k, count: 0, clients: 0, latest: null };
    cur.count += 1;
    if (r.status === "client") cur.clients += 1;
    if (!cur.latest || (r.received_at && r.received_at > cur.latest)) cur.latest = r.received_at;
    m.set(k, cur);
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function SourcesPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("leads")
    .select("id, source, utm_source, utm_medium, utm_campaign, status, received_at")
    .order("received_at", { ascending: false })
    .limit(2000);
  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Sources</h1>
          <p className="header-sub" style={{ color: "var(--danger)" }}>{error.message}</p>
        </div>
      </>
    );
  }
  const rows = (data ?? []) as LeadRow[];

  // Buckets
  const byChannel = rollup(rows, (r) => channelOf(r.utm_source, r.utm_medium));
  const byUtmSource = rollup(rows, (r) => r.utm_source);
  const byMedium = rollup(rows, (r) => r.utm_medium);
  const byCampaign = rollup(rows, (r) => r.utm_campaign);

  // Stats
  const clients = rows.filter((r) => r.status === "client").length;
  const last7d = rows.filter((r) => Date.now() - new Date(r.received_at).getTime() < 7 * 86_400_000).length;

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">attribution</p>
        <h1>Sources</h1>
        <p className="header-sub">
          {rows.length} leads on file. Where they came from — channel, UTM source, medium, campaign — and how many became clients.
        </p>
      </div>
      <div className="main">
        <div className="stats-bar" style={{ marginBottom: 18 }}>
          <div className="stat-card">
            <div className="stat-label">Total leads</div>
            <div className="stat-num">{rows.length}</div>
            <div className="stat-delta">All-time</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Last 7 days</div>
            <div className="stat-num">{last7d}</div>
            <div className="stat-delta">New inbound</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Channels</div>
            <div className="stat-num">{byChannel.length}</div>
            <div className="stat-delta">Distinct paths</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Converted</div>
            <div className="stat-num">{clients}</div>
            <div className="stat-delta">
              {rows.length > 0 ? `${Math.round((clients / rows.length) * 100)}% rate` : "—"}
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState message="No leads yet. Once form submissions land at /api/leads/ingest, you'll see channel breakdowns here." />
        ) : (
          <>
            <RollupCard
              title="By channel"
              tagline="Heuristic bucket — organic, paid, social, email, referral, direct"
              groups={byChannel}
              totalLeads={rows.length}
            />
            <RollupCard
              title="By UTM source"
              tagline="?utm_source= on the inbound URL"
              groups={byUtmSource}
              totalLeads={rows.length}
              emptyHint="No utm_source values yet — wire UTMs into your ad/email links to populate."
            />
            <RollupCard
              title="By UTM medium"
              tagline="?utm_medium= — cpc / organic / email / etc"
              groups={byMedium}
              totalLeads={rows.length}
              emptyHint="No utm_medium values yet."
            />
            <RollupCard
              title="By campaign"
              tagline="?utm_campaign= — specific launch / push"
              groups={byCampaign}
              totalLeads={rows.length}
              emptyHint="No utm_campaign values yet."
            />
          </>
        )}
      </div>
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
        // no data
      </div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}

function RollupCard({
  title,
  tagline,
  groups,
  totalLeads,
  emptyHint,
}: {
  title: string;
  tagline: string;
  groups: Group[];
  totalLeads: number;
  emptyHint?: string;
}) {
  return (
    <div className="fl-reveal" style={{ marginBottom: 22 }}>
      <div className="section-header" style={{ marginBottom: 10 }}>
        <div className="section-label">{title}</div>
        <span className="log-count">{groups.length} · {tagline}</span>
      </div>
      {groups.length === 0 ? (
        <div className="card" style={{ padding: 18, color: "var(--text-tertiary)", fontSize: 13, textAlign: "center" }}>
          {emptyHint || "No data yet."}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {groups.map((g) => {
            const pct = totalLeads > 0 ? Math.round((g.count / totalLeads) * 100) : 0;
            const convRate = g.count > 0 ? Math.round((g.clients / g.count) * 100) : 0;
            return (
              <div
                key={g.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(160px,1.4fr) 90px 110px 130px 110px",
                  gap: 12,
                  padding: "11px 16px",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 13,
                }}
              >
                <div style={{ fontFamily: "var(--mono)", color: "var(--text)" }}>{g.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "right" }}>
                  {g.count} <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 10 }}>leads</span>
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
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)", textAlign: "center" }}>
                  {g.clients > 0 ? (
                    <>
                      <span style={{ color: "#34d399" }}>{g.clients} client{g.clients === 1 ? "" : "s"}</span>
                      <span> · {convRate}%</span>
                    </>
                  ) : (
                    <span>0 clients</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)", textAlign: "right" }}>
                  {timeAgo(g.latest)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
