// /docs — document inbox. Every contract Josh has drafted, sent, or signed.
// Status pipeline: draft → sent → viewed → signed → completed.

import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/docs/templates";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  draft: { fg: "#a39888", bg: "rgba(163,152,136,0.12)" },
  sent: { fg: "#60a5fa", bg: "rgba(96,165,250,0.14)" },
  viewed: { fg: "#fbbf24", bg: "rgba(251,191,36,0.14)" },
  signed: { fg: "#34d399", bg: "rgba(52,211,153,0.14)" },
  completed: { fg: "#34d399", bg: "rgba(52,211,153,0.14)" },
  cancelled: { fg: "#f87171", bg: "rgba(248,113,113,0.14)" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function DocsPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("documents")
    .select(
      "id, template_id, title, status, recipient_name, recipient_email, recipient_company, sent_at, signed_at, created_at, updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Docs</h1>
          <p className="header-sub">Could not load documents.</p>
        </div>
        <div className="main">
          <pre style={{ color: "var(--danger)", fontSize: 12 }}>{error.message}</pre>
        </div>
      </>
    );
  }

  const rows = data ?? [];
  const drafts = rows.filter((r) => r.status === "draft");
  const inFlight = rows.filter((r) => r.status === "sent" || r.status === "viewed");
  const closed = rows.filter((r) => r.status === "signed" || r.status === "completed");

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">contracts</p>
        <h1>Docs</h1>
        <p className="header-sub">
          PandaDoc-style contract management built for a consultant. Pick a template, fill it in, send for signature.
          {rows.length} document{rows.length === 1 ? "" : "s"} on file.
        </p>
      </div>
      <div className="main">
        {/* Hero CTA */}
        <Link
          href="/docs/templates"
          className="card fl-reveal"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: 20,
            padding: 24,
            marginBottom: 18,
            textDecoration: "none",
            background: "linear-gradient(90deg, rgba(255,138,47,0.10) 0%, rgba(255,138,47,0.02) 60%, transparent 100%)",
            border: "1px solid rgba(255,138,47,0.25)",
            color: "var(--text)",
          }}
        >
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>
              start a new doc
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
              11 consultant-grade templates
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              MSA, SOW, retainer, NDAs (mutual + one-way), IP assignment, contractor + freelance + subcontractor agreements.
            </div>
          </div>
          <div
            style={{
              padding: "12px 22px",
              background: "var(--accent)",
              color: "#15100e",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--mono)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Browse Templates →
          </div>
        </Link>

        {/* Stats */}
        <div className="stats-bar" style={{ marginBottom: 18 }}>
          <div className="stat-card">
            <div className="stat-label">Drafts</div>
            <div className="stat-num">{drafts.length}</div>
            <div className="stat-delta">In progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Out for signature</div>
            <div className="stat-num">{inFlight.length}</div>
            <div className="stat-delta">Sent / viewed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Signed</div>
            <div className="stat-num">{closed.length}</div>
            <div className="stat-delta">Closed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-num">{rows.length}</div>
            <div className="stat-delta">All time</div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
              // no documents yet
            </div>
            <div style={{ fontSize: 14 }}>
              Click <strong style={{ color: "var(--text)" }}>Browse Templates</strong> above to draft your first contract.
            </div>
          </div>
        ) : (
          <DocList rows={rows} />
        )}
      </div>
    </>
  );
}

function DocList({ rows }: { rows: { id: string; template_id: string; title: string; status: string; recipient_name: string | null; recipient_email: string | null; recipient_company: string | null; sent_at: string | null; signed_at: string | null; updated_at: string }[] }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px,1.6fr) minmax(160px,1.2fr) 120px 100px 80px",
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
        <div>Title / Template</div>
        <div>Recipient</div>
        <div>Status</div>
        <div>Updated</div>
        <div style={{ textAlign: "right" }}>Open</div>
      </div>
      {rows.map((r) => {
        const tmpl = getTemplate(r.template_id);
        const status = r.status || "draft";
        return (
          <Link
            key={r.id}
            href={`/docs/${r.id}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px,1.6fr) minmax(160px,1.2fr) 120px 100px 80px",
              gap: 12,
              padding: "12px 16px",
              alignItems: "center",
              borderBottom: "1px solid var(--border)",
              textDecoration: "none",
              color: "var(--text)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
                {tmpl?.name || r.template_id}
              </div>
            </div>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.recipient_name ? (
                <>
                  <div style={{ fontSize: 12 }}>{r.recipient_name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>{r.recipient_email || "—"}</div>
                </>
              ) : (
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>—</span>
              )}
            </div>
            <div>
              <span
                style={{
                  display: "inline-flex",
                  padding: "3px 9px",
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: STATUS_COLORS[status]?.bg || "var(--bg)",
                  color: STATUS_COLORS[status]?.fg || "var(--text-tertiary)",
                  borderRadius: 3,
                }}
              >
                {status}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
              {timeAgo(r.updated_at)}
            </div>
            <div style={{ textAlign: "right", color: "var(--accent)", fontSize: 16 }}>→</div>
          </Link>
        );
      })}
    </div>
  );
}
