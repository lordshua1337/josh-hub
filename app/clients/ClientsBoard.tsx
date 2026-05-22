"use client";

// CRM workspace — single table, status pills, inline notes. Optimized for
// "I just got off a call, drop a note + bump the stage" speed.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type ClientStatus = "new" | "contacted" | "qualified" | "client" | "past" | "cold";

export type ClientRow = {
  id: string;
  source: string;
  source_url: string | null;
  name: string | null;
  email: string | null;
  company: string | null;
  need: string | null;
  message: string | null;
  notes: string | null;
  status: string;
  received_at: string;
  contacted_at: string | null;
  qualified_at: string | null;
  closed_at: string | null;
  updated_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

const STATUS_ORDER: ClientStatus[] = ["new", "contacted", "qualified", "client", "past", "cold"];

const STATUS_LABELS: Record<ClientStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  client: "Client",
  past: "Past",
  cold: "Cold",
};

const STATUS_COLORS: Record<ClientStatus, { fg: string; bg: string }> = {
  new: { fg: "#60a5fa", bg: "rgba(96,165,250,0.14)" },         // blue
  contacted: { fg: "#f59e0b", bg: "rgba(245,158,11,0.14)" },   // amber
  qualified: { fg: "#fbbf24", bg: "rgba(251,191,36,0.14)" },   // gold
  client: { fg: "#34d399", bg: "rgba(52,211,153,0.14)" },      // green
  past: { fg: "#a78bfa", bg: "rgba(167,139,250,0.14)" },       // purple
  cold: { fg: "#64748b", bg: "rgba(100,116,139,0.14)" },       // slate
};

function asStatus(s: string | null | undefined): ClientStatus {
  const v = (s || "new").toLowerCase();
  if (STATUS_ORDER.includes(v as ClientStatus)) return v as ClientStatus;
  return "new";
}

function timeAgo(date: string | null): string {
  if (!date) return "—";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

type FilterValue = "active" | "all" | ClientStatus;

export function ClientsBoard({ rows }: { rows: ClientRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterValue>("active");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  // Local edits — keep notes responsive while typing without round-tripping
  // to the server on every keystroke.
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  function flashFor(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  }

  const stats = useMemo(() => {
    const byStatus = STATUS_ORDER.reduce(
      (acc, s) => ({ ...acc, [s]: 0 }),
      {} as Record<ClientStatus, number>
    );
    for (const r of rows) byStatus[asStatus(r.status)] += 1;
    return byStatus;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const status = asStatus(r.status);
      if (filter === "active" && (status === "past" || status === "cold")) return false;
      if (filter !== "active" && filter !== "all" && status !== filter) return false;
      if (!q) return true;
      const blob = `${r.name || ""} ${r.email || ""} ${r.company || ""} ${r.message || ""} ${r.notes || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [rows, filter, query]);

  async function patchClient(id: string, body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Save failed: ${json.error}`);
        return { ok: false, error: json.error };
      }
      startTransition(() => router.refresh());
      return { ok: true };
    } catch (e) {
      flashFor(`Save failed: ${(e as Error).message}`);
      return { ok: false, error: (e as Error).message };
    } finally {
      setBusyId(null);
    }
  }

  async function onChangeStatus(id: string, nextStatus: ClientStatus) {
    const res = await patchClient(id, { status: nextStatus });
    if (res.ok) flashFor(`Moved to ${STATUS_LABELS[nextStatus]}.`);
  }

  async function onSaveNotes(id: string) {
    const notes = draftNotes[id];
    if (notes === undefined) return;
    const res = await patchClient(id, { notes });
    if (res.ok) flashFor("Notes saved.");
  }

  const activeCount = STATUS_ORDER
    .filter((s) => s !== "past" && s !== "cold")
    .reduce((sum, s) => sum + stats[s], 0);
  const filters: { value: FilterValue; label: string; count: number }[] = [
    { value: "active", label: "Active", count: activeCount },
    { value: "new", label: "New", count: stats.new },
    { value: "contacted", label: "Contacted", count: stats.contacted },
    { value: "qualified", label: "Qualified", count: stats.qualified },
    { value: "client", label: "Clients", count: stats.client },
    { value: "past", label: "Past", count: stats.past },
    { value: "cold", label: "Cold", count: stats.cold },
    { value: "all", label: "All", count: rows.length },
  ];

  return (
    <div className="fl-reveal">
      {/* Top stats — at-a-glance pipeline */}
      <div className="stats-bar" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Clients</div>
          <div className="stat-num">{stats.client}</div>
          <div className="stat-delta">Active engagements</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In pipeline</div>
          <div className="stat-num">{stats.contacted + stats.qualified}</div>
          <div className="stat-delta">Contacted + qualified</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">New leads</div>
          <div className="stat-num">{stats.new}</div>
          <div className="stat-delta">Awaiting first touch</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Past</div>
          <div className="stat-num">{stats.past}</div>
          <div className="stat-delta">Closed engagements</div>
        </div>
      </div>

      {/* Filter pills + search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, company, email, notes…"
          style={{
            flex: 1,
            minWidth: 200,
            padding: "7px 10px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            color: "var(--text)",
            fontFamily: "inherit",
            fontSize: 12,
          }}
        />
      </div>

      {flash && <div className="inbox-flash">{flash}</div>}

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
          {rows.length === 0
            ? "No form fills yet. They'll land here automatically as soon as someone submits a form."
            : "Nothing matches that filter. Try Active or All."}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(180px,1.4fr) minmax(120px,1fr) minmax(140px,1fr) 130px 110px 80px",
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
            <div>Name / Email</div>
            <div>Company</div>
            <div>Source / Need</div>
            <div>Status</div>
            <div>Last Touch</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>

          {filtered.map((r) => {
            const status = asStatus(r.status);
            const isExpanded = expandedId === r.id;
            const lastTouch = r.contacted_at || r.received_at;
            const notesValue = draftNotes[r.id] !== undefined ? draftNotes[r.id] : r.notes || "";

            return (
              <div key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(180px,1.4fr) minmax(120px,1fr) minmax(140px,1fr) 130px 110px 80px",
                    gap: 12,
                    padding: "12px 16px",
                    alignItems: "center",
                    cursor: "pointer",
                    background: isExpanded ? "rgba(242,138,47,0.04)" : "transparent",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>
                      {r.name || "(no name)"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.email || "—"}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.company || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <div>{r.source}</div>
                    {r.need && <div style={{ fontStyle: "italic", marginTop: 2 }}>{r.need}</div>}
                  </div>
                  <div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
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
                    {timeAgo(lastTouch)}
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
                    {/* Left: message + notes */}
                    <div>
                      {r.message && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
                            // their message
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "var(--text-secondary)",
                              padding: 10,
                              background: "var(--bg)",
                              border: "1px solid var(--border)",
                              borderRadius: 4,
                              lineHeight: 1.5,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {r.message}
                          </div>
                        </div>
                      )}
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
                        // your notes
                      </div>
                      <textarea
                        value={notesValue}
                        onChange={(e) =>
                          setDraftNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                        onBlur={() => {
                          if ((draftNotes[r.id] ?? "") !== (r.notes || "")) {
                            onSaveNotes(r.id);
                          }
                        }}
                        placeholder="What did you talk about? What's the next step?"
                        rows={4}
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
                        Saves when you click away. Last updated {timeAgo(r.updated_at)}.
                      </div>
                    </div>

                    {/* Right: actions + meta */}
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                        // move stage
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                        {STATUS_ORDER.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => onChangeStatus(r.id, s)}
                            disabled={status === s || busyId === r.id}
                            style={{
                              padding: "5px 10px",
                              fontFamily: "var(--mono)",
                              fontSize: 10,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              background: status === s ? STATUS_COLORS[s].bg : "transparent",
                              border: `1px solid ${status === s ? STATUS_COLORS[s].fg : "var(--border)"}`,
                              color: status === s ? STATUS_COLORS[s].fg : "var(--text-secondary)",
                              borderRadius: 3,
                              cursor: status === s ? "default" : "pointer",
                              opacity: busyId === r.id ? 0.6 : 1,
                            }}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>

                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                        // quick actions
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                        {r.email && (
                          <a
                            href={`mailto:${r.email}`}
                            style={{
                              padding: "6px 12px",
                              fontFamily: "var(--mono)",
                              fontSize: 11,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              background: "transparent",
                              border: "1px solid var(--accent)",
                              color: "var(--accent)",
                              borderRadius: 3,
                              textDecoration: "none",
                            }}
                          >
                            email →
                          </a>
                        )}
                        <a
                          href="https://cal.com/prometheus-consulting/15min"
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "6px 12px",
                            fontFamily: "var(--mono)",
                            fontSize: 11,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            background: "transparent",
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            borderRadius: 3,
                            textDecoration: "none",
                          }}
                        >
                          cal.com ↗
                        </a>
                      </div>

                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                        // meta
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.8 }}>
                        <div>Received: {timeAgo(r.received_at)}</div>
                        {r.contacted_at && <div>First contact: {timeAgo(r.contacted_at)}</div>}
                        {r.qualified_at && <div>Qualified: {timeAgo(r.qualified_at)}</div>}
                        {r.closed_at && <div>Closed: {timeAgo(r.closed_at)}</div>}
                        {(r.utm_source || r.utm_campaign) && (
                          <div>
                            UTM: {[r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(" / ")}
                          </div>
                        )}
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
        {pending ? "Refreshing…" : `${filtered.length} of ${rows.length} shown · pulled from public.leads`}
      </div>
    </div>
  );
}
