"use client";

// Ideas — simple notes board for pre-deploy projects.
// Same pattern as ClientsBoard: inline-editable notes with autosave-on-blur,
// status pills for promotion (idea → planned → future → deployed).

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type IdeaRow = {
  slug: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  notes: string | null;
  current_status: string | null;
  created_at: string;
  updated_at: string;
  last_touched_at: string | null;
};

type Status = "idea" | "planned" | "future" | "deployed" | "archived";

const STATUS_LABELS: Record<Status, string> = {
  idea: "Idea",
  planned: "Planned",
  future: "Future",
  deployed: "Deployed",
  archived: "Archived",
};

const STATUS_COLORS: Record<Status, { fg: string; bg: string }> = {
  idea: { fg: "#60a5fa", bg: "rgba(96,165,250,0.14)" },
  planned: { fg: "#f59e0b", bg: "rgba(245,158,11,0.14)" },
  future: { fg: "#a78bfa", bg: "rgba(167,139,250,0.14)" },
  deployed: { fg: "#34d399", bg: "rgba(52,211,153,0.14)" },
  archived: { fg: "#64748b", bg: "rgba(100,116,139,0.14)" },
};

function asStatus(s: string | null | undefined): Status {
  const v = (s || "idea").toLowerCase();
  if (["idea", "planned", "future", "deployed", "archived"].includes(v)) return v as Status;
  return "idea";
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function IdeasBoard({ rows }: { rows: IdeaRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftDesc, setDraftDesc] = useState<Record<string, string>>({});
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);

  function flashFor(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  }

  const stats = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        const s = asStatus(r.current_status);
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {} as Record<Status, number>
    );
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => asStatus(r.current_status) === filter);
  }, [rows, filter]);

  async function patchProject(slug: string, body: Record<string, unknown>): Promise<boolean> {
    setBusy(slug);
    try {
      const res = await fetch(`/api/projects/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Save failed: ${json.error}`);
        return false;
      }
      startTransition(() => router.refresh());
      return true;
    } catch (e) {
      flashFor(`Save failed: ${(e as Error).message}`);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function onCreateIdea(e: React.FormEvent) {
    e.preventDefault();
    const slug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: slug, current_status: "idea" }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Create failed: ${json.error}`);
        return;
      }
      flashFor(`Added ${slug}.`);
      setNewSlug("");
      startTransition(() => router.refresh());
    } finally {
      setCreating(false);
    }
  }

  const filters: { value: Status | "all"; label: string; count: number }[] = [
    { value: "all", label: "All", count: rows.length },
    { value: "idea", label: "Idea", count: stats.idea || 0 },
    { value: "planned", label: "Planned", count: stats.planned || 0 },
    { value: "future", label: "Future", count: stats.future || 0 },
    { value: "archived", label: "Archived", count: stats.archived || 0 },
  ];

  return (
    <div className="fl-reveal">
      <div className="stats-bar" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Total ideas</div>
          <div className="stat-num">{rows.length}</div>
          <div className="stat-delta">In the backlog</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Planned</div>
          <div className="stat-num">{stats.planned || 0}</div>
          <div className="stat-delta">Spec ready to build</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Idea / future</div>
          <div className="stat-num">{(stats.idea || 0) + (stats.future || 0)}</div>
          <div className="stat-delta">Not actively building</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Promote</div>
          <div className="stat-num" style={{ fontSize: 16 }}>
            <a href="/projects" style={{ color: "var(--accent)" }}>
              Projects →
            </a>
          </div>
          <div className="stat-delta">Deployed lives there</div>
        </div>
      </div>

      {/* New-idea quick add */}
      <form
        onSubmit={onCreateIdea}
        className="card"
        style={{
          padding: 14,
          marginBottom: 14,
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "rgba(255,138,47,0.04)",
          border: "1px solid rgba(255,138,47,0.18)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
          }}
        >
          // + add idea
        </span>
        <input
          type="text"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder="slug-of-the-idea (e.g. invoice-roast-bot)"
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            color: "var(--text)",
            fontFamily: "var(--mono)",
            fontSize: 12,
          }}
        />
        <button
          type="submit"
          disabled={!newSlug.trim() || creating}
          style={{
            padding: "8px 14px",
            background: "var(--accent)",
            color: "#15100e",
            border: "1px solid var(--accent)",
            fontFamily: "var(--mono)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            borderRadius: 4,
            cursor: creating ? "wait" : "pointer",
          }}
        >
          {creating ? "adding…" : "add"}
        </button>
      </form>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            style={{
              padding: "6px 11px",
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: filter === f.value ? "rgba(242,138,47,0.12)" : "transparent",
              border: `1px solid ${filter === f.value ? "var(--accent)" : "var(--border)"}`,
              color: filter === f.value ? "var(--ember-050)" : "var(--text-secondary)",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {f.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {flash && <div className="inbox-flash">{flash}</div>}

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
          Nothing here yet. Drop a slug in the box above to track an idea.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {filtered.map((r) => {
            const status = asStatus(r.current_status);
            const isExpanded = expandedSlug === r.slug;
            const notesValue = draftNotes[r.slug] !== undefined ? draftNotes[r.slug] : r.notes || "";
            const descValue = draftDesc[r.slug] !== undefined ? draftDesc[r.slug] : r.description || "";
            return (
              <div key={r.slug} style={{ borderBottom: "1px solid var(--border)" }}>
                <div
                  onClick={() => setExpandedSlug(isExpanded ? null : r.slug)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(180px,1fr) minmax(160px,2fr) 110px 110px 60px",
                    gap: 12,
                    padding: "12px 16px",
                    alignItems: "center",
                    cursor: "pointer",
                    background: isExpanded ? "rgba(242,138,47,0.04)" : "transparent",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
                      {r.slug}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.description || (r.notes ? r.notes.slice(0, 100) : "—")}
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
                        background: STATUS_COLORS[status].bg,
                        color: STATUS_COLORS[status].fg,
                        borderRadius: 3,
                      }}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
                    {timeAgo(r.updated_at)}
                  </div>
                  <div style={{ textAlign: "right", color: "var(--text-tertiary)", fontSize: 18 }}>
                    {isExpanded ? "−" : "+"}
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      padding: "0 16px 16px",
                      background: "rgba(242,138,47,0.02)",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          color: "var(--accent)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        // one-line description
                      </div>
                      <input
                        type="text"
                        value={descValue}
                        onChange={(e) =>
                          setDraftDesc((prev) => ({ ...prev, [r.slug]: e.target.value }))
                        }
                        onBlur={() => {
                          if ((draftDesc[r.slug] ?? "") !== (r.description || "")) {
                            patchProject(r.slug, { description: draftDesc[r.slug] });
                          }
                        }}
                        placeholder="what this is, one sentence"
                        style={{
                          width: "100%",
                          padding: 8,
                          fontSize: 13,
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          color: "var(--text)",
                          fontFamily: "inherit",
                          marginBottom: 10,
                        }}
                      />

                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          color: "var(--accent)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        // notes
                      </div>
                      <textarea
                        value={notesValue}
                        onChange={(e) =>
                          setDraftNotes((prev) => ({ ...prev, [r.slug]: e.target.value }))
                        }
                        onBlur={() => {
                          if ((draftNotes[r.slug] ?? "") !== (r.notes || "")) {
                            patchProject(r.slug, { notes: draftNotes[r.slug] });
                          }
                        }}
                        placeholder="What's the idea? What problem? Any sketches?"
                        rows={6}
                        style={{
                          width: "100%",
                          padding: 10,
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 13,
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          color: "var(--text)",
                          resize: "vertical",
                          lineHeight: 1.5,
                        }}
                      />
                      <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
                        Saves when you click away.
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          color: "var(--accent)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          marginBottom: 6,
                        }}
                      >
                        // status
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                        {(["idea", "planned", "future", "archived"] as Status[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => patchProject(r.slug, { current_status: s })}
                            disabled={status === s || busy === r.slug}
                            style={{
                              padding: "5px 10px",
                              fontFamily: "var(--mono)",
                              fontSize: 10,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              background: status === s ? STATUS_COLORS[s].bg : "transparent",
                              border: `1px solid ${
                                status === s ? STATUS_COLORS[s].fg : "var(--border)"
                              }`,
                              color: status === s ? STATUS_COLORS[s].fg : "var(--text-secondary)",
                              borderRadius: 3,
                              cursor: status === s ? "default" : "pointer",
                              opacity: busy === r.slug ? 0.6 : 1,
                            }}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => patchProject(r.slug, { current_status: "active", mode: "deployed" })}
                          disabled={busy === r.slug}
                          style={{
                            padding: "5px 10px",
                            fontFamily: "var(--mono)",
                            fontSize: 10,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            background: STATUS_COLORS.deployed.bg,
                            border: `1px solid ${STATUS_COLORS.deployed.fg}`,
                            color: STATUS_COLORS.deployed.fg,
                            borderRadius: 3,
                            cursor: "pointer",
                          }}
                        >
                          → Deployed
                        </button>
                      </div>

                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          color: "var(--accent)",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          marginBottom: 6,
                        }}
                      >
                        // links
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {r.repo_url && (
                          <a
                            href={r.repo_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "6px 12px",
                              fontFamily: "var(--mono)",
                              fontSize: 11,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              border: "1px solid var(--border)",
                              color: "var(--text-secondary)",
                              borderRadius: 3,
                              textDecoration: "none",
                            }}
                          >
                            repo ↗
                          </a>
                        )}
                        <code
                          style={{
                            padding: "6px 10px",
                            fontFamily: "var(--mono)",
                            fontSize: 11,
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            borderRadius: 3,
                            color: "var(--text-tertiary)",
                          }}
                        >
                          ~/projects/{r.slug}
                        </code>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 11, color: "var(--text-tertiary)", textAlign: "center" }}>
        {pending ? "Refreshing…" : `${filtered.length} of ${rows.length} shown`}
      </div>
    </div>
  );
}
