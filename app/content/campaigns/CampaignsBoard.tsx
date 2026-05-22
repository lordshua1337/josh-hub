"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type CampaignRow = {
  id: string;
  slug: string;
  name: string;
  theme: string | null;
  pitch: string | null;
  status: string;
  brand: string;
  cadence: string | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  planning: { fg: "#a39888", bg: "rgba(163,152,136,0.14)" },
  active: { fg: "#34d399", bg: "rgba(52,211,153,0.14)" },
  paused: { fg: "#fbbf24", bg: "rgba(251,191,36,0.14)" },
  shipped: { fg: "#60a5fa", bg: "rgba(96,165,250,0.14)" },
  archived: { fg: "#64748b", bg: "rgba(100,116,139,0.14)" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CampaignsBoard({
  campaigns,
  postCounts,
}: {
  campaigns: CampaignRow[];
  postCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", theme: "", cadence: "weekly" });

  function flashFor(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 4000);
  }

  function slugify(s: string): string {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const slug = slugify(form.name);
      const res = await fetch("/api/campaigns/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: form.name.trim(),
          theme: form.theme.trim() || undefined,
          cadence: form.cadence,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; slug?: string; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Create failed: ${json.error}`);
        return;
      }
      router.push(`/content/campaigns/${json.slug}`);
    } finally {
      setCreating(false);
    }
  }

  const active = campaigns.filter((c) => c.status === "active");
  const planning = campaigns.filter((c) => c.status === "planning");
  const archived = campaigns.filter((c) => c.status === "shipped" || c.status === "archived");

  return (
    <div className="fl-reveal">
      <div className="stats-bar" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-num">{active.length}</div>
          <div className="stat-delta">In flight</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Planning</div>
          <div className="stat-num">{planning.length}</div>
          <div className="stat-delta">Not started</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Shipped</div>
          <div className="stat-num">{archived.length}</div>
          <div className="stat-delta">Completed runs</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-num">{campaigns.length}</div>
          <div className="stat-delta">All campaigns</div>
        </div>
      </div>

      {flash && <div className="inbox-flash">{flash}</div>}

      {/* New campaign hero */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="card"
          style={{
            width: "100%",
            padding: 22,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: 16,
            marginBottom: 18,
            background: "linear-gradient(90deg, rgba(255,138,47,0.10) 0%, rgba(255,138,47,0.02) 60%, transparent 100%)",
            border: "1px solid rgba(255,138,47,0.25)",
            textAlign: "left",
            cursor: "pointer",
            fontFamily: "inherit",
            color: "var(--text)",
          }}
        >
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>start a campaign</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
              Plan a series, batch-draft, ship as a sequence
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Group 3-10 posts under one theme. The Post Engine drafts them as a batch. Calendar holds the cadence.
            </div>
          </div>
          <div
            style={{
              padding: "10px 22px",
              background: "var(--accent)",
              color: "#15100e",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--mono)",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            + New Campaign
          </div>
        </button>
      ) : (
        <form onSubmit={onCreate} className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>new campaign</div>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-tertiary)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                // name
              </div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Q3 audit-keyword push"
                style={inputStyle}
                autoFocus
              />
              {form.name && (
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--mono)", marginTop: 4 }}>
                  slug: {slugify(form.name)}
                </div>
              )}
            </label>
            <label>
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-tertiary)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                // theme (one-liner)
              </div>
              <input
                type="text"
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                placeholder="Compliance GTM in regulated industries"
                style={inputStyle}
              />
            </label>
            <label>
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-tertiary)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                // cadence
              </div>
              <select
                value={form.cadence}
                onChange={(e) => setForm({ ...form, cadence: e.target.value })}
                style={inputStyle}
              >
                <option value="daily">daily (5-7 in a row)</option>
                <option value="mwf">M/W/F (3x weekly)</option>
                <option value="weekly">weekly (one a week)</option>
                <option value="biweekly">bi-weekly</option>
                <option value="ad-hoc">ad-hoc (no fixed cadence)</option>
              </select>
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "space-between" }}>
            <button type="button" onClick={() => setOpen(false)} className="act-btn" disabled={creating}>
              cancel
            </button>
            <button type="submit" className="act-btn act-btn-primary" disabled={!form.name.trim() || creating}>
              {creating ? "creating…" : "create campaign →"}
            </button>
          </div>
        </form>
      )}

      {campaigns.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
          No campaigns yet. Click <strong style={{ color: "var(--text)" }}>+ New Campaign</strong> above to start your first.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(180px,1.8fr) minmax(160px,2fr) 90px 100px 100px 80px",
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
            <div>Name</div>
            <div>Theme</div>
            <div>Status</div>
            <div>Posts</div>
            <div>Updated</div>
            <div style={{ textAlign: "right" }}>Open</div>
          </div>
          {campaigns.map((c) => {
            const count = postCounts[c.slug] ?? 0;
            return (
              <Link
                key={c.slug}
                href={`/content/campaigns/${c.slug}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(180px,1.8fr) minmax(160px,2fr) 90px 100px 100px 80px",
                  gap: 12,
                  padding: "12px 16px",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  textDecoration: "none",
                  color: "var(--text)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-tertiary)" }}>
                    {c.slug} · {c.cadence || "—"}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.theme || "—"}
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
                      background: STATUS_COLORS[c.status]?.bg || "var(--bg)",
                      color: STATUS_COLORS[c.status]?.fg || "var(--text-tertiary)",
                      borderRadius: 3,
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--mono)" }}>
                  {count} {count === 1 ? "post" : "posts"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
                  {timeAgo(c.updated_at)}
                </div>
                <div style={{ textAlign: "right", color: "var(--accent)", fontSize: 16 }}>→</div>
              </Link>
            );
          })}
        </div>
      )}
      {pending && <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-tertiary)" }}>refreshing…</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 3,
  color: "var(--text)",
  fontFamily: "inherit",
  fontSize: 13,
};
