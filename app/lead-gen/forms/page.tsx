// /lead-gen/forms — inventory of every form Josh's sites have ever submitted to
// the hub. Pulled from public.leads grouped by (source, source_url). Each row
// shows submission count, latest submission, and conversion-to-client rate.
// Clicking a form drills into /lead-gen/leads filtered to that source.

import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  source: string;
  source_url: string | null;
  status: string;
  received_at: string;
  email: string | null;
  name: string | null;
};

type FormRow = {
  source: string;
  source_url: string | null;
  count: number;
  clients: number;
  contacted: number;
  latest: string;
  unique_emails: number;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function FormsPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("leads")
    .select("id, source, source_url, status, received_at, email, name")
    .order("received_at", { ascending: false })
    .limit(2000);

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Forms</h1>
          <p className="header-sub" style={{ color: "var(--danger)" }}>{error.message}</p>
        </div>
      </>
    );
  }
  const rows = (data ?? []) as LeadRow[];

  // Group by (source, source_url)
  const map = new Map<string, FormRow & { emails: Set<string> }>();
  for (const r of rows) {
    const key = `${r.source}::${r.source_url || ""}`;
    const cur = map.get(key) ?? {
      source: r.source,
      source_url: r.source_url,
      count: 0,
      clients: 0,
      contacted: 0,
      latest: r.received_at,
      unique_emails: 0,
      emails: new Set<string>(),
    };
    cur.count += 1;
    if (r.status === "client") cur.clients += 1;
    if (r.status === "contacted" || r.status === "qualified" || r.status === "client" || r.status === "past") {
      cur.contacted += 1;
    }
    if (r.received_at && r.received_at > cur.latest) cur.latest = r.received_at;
    if (r.email) cur.emails.add(r.email.toLowerCase());
    map.set(key, cur);
  }
  const forms: FormRow[] = [...map.values()].map((g) => ({
    source: g.source,
    source_url: g.source_url,
    count: g.count,
    clients: g.clients,
    contacted: g.contacted,
    latest: g.latest,
    unique_emails: g.emails.size,
  }));
  forms.sort((a, b) => b.count - a.count);

  // Stats
  const totalSubs = forms.reduce((s, f) => s + f.count, 0);
  const totalClients = forms.reduce((s, f) => s + f.clients, 0);
  const distinctEmails = forms.reduce((s, f) => s + f.unique_emails, 0);
  const last7d = rows.filter((r) => Date.now() - new Date(r.received_at).getTime() < 7 * 86_400_000).length;

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">intake</p>
        <h1>Forms</h1>
        <p className="header-sub">
          Every form that&apos;s submitted to the hub via <code style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)" }}>/api/leads/ingest</code>.
          {forms.length} distinct {forms.length === 1 ? "form" : "forms"} captured, {totalSubs} total submissions.
        </p>
      </div>
      <div className="main">
        <div className="stats-bar" style={{ marginBottom: 18 }}>
          <div className="stat-card">
            <div className="stat-label">Live forms</div>
            <div className="stat-num">{forms.length}</div>
            <div className="stat-delta">Distinct source × URL</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Submissions</div>
            <div className="stat-num">{totalSubs}</div>
            <div className="stat-delta">{last7d} in last 7 days</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique people</div>
            <div className="stat-num">{distinctEmails}</div>
            <div className="stat-delta">Distinct emails</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Client conversions</div>
            <div className="stat-num">{totalClients}</div>
            <div className="stat-delta">
              {totalSubs > 0 ? `${Math.round((totalClients / totalSubs) * 100)}% rate` : "—"}
            </div>
          </div>
        </div>

        {forms.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
              // no forms yet
            </div>
            <div style={{ fontSize: 14 }}>
              Hit <code style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>/api/leads/ingest</code> with a form submission and it&apos;ll show up here.
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(160px,1.4fr) minmax(140px,1.8fr) 90px 130px 110px 100px",
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
              <div>Source</div>
              <div>URL</div>
              <div style={{ textAlign: "right" }}>Subs</div>
              <div>Funnel</div>
              <div>Conv → Client</div>
              <div style={{ textAlign: "right" }}>Latest</div>
            </div>
            {forms.map((f) => {
              const contactRate = f.count > 0 ? Math.round((f.contacted / f.count) * 100) : 0;
              const clientRate = f.count > 0 ? Math.round((f.clients / f.count) * 100) : 0;
              return (
                <Link
                  key={`${f.source}::${f.source_url}`}
                  href={`/lead-gen/leads?source=${encodeURIComponent(f.source)}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(160px,1.4fr) minmax(140px,1.8fr) 90px 130px 110px 100px",
                    gap: 12,
                    padding: "12px 16px",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border)",
                    textDecoration: "none",
                    color: "var(--text)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.source}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.source_url || "—"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text)", textAlign: "right", fontWeight: 600 }}>
                    {f.count}
                  </div>
                  <div style={{ position: "relative", height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: `${Math.max(2, contactRate)}%`,
                        background: "var(--accent)",
                        opacity: 0.45,
                        borderRadius: 3,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: `${Math.max(2, clientRate)}%`,
                        background: "#34d399",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
                    {f.clients > 0 ? (
                      <span style={{ color: "#34d399" }}>{f.clients} · {clientRate}%</span>
                    ) : (
                      <span>0 · 0%</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)", textAlign: "right" }}>
                    {timeAgo(f.latest)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 18, padding: 14, background: "rgba(255,138,47,0.05)", border: "1px solid rgba(255,138,47,0.20)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--text-secondary)" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
            // how to wire a new form
          </div>
          POST to <code style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>/api/leads/ingest</code> with{" "}
          <code style={{ fontFamily: "var(--mono)" }}>X-Lead-Key</code> header. Body: <code style={{ fontFamily: "var(--mono)" }}>{`{ source, source_url, name, email, message, utm_* }`}</code>. New submissions appear here within seconds.
        </div>
      </div>
    </>
  );
}
