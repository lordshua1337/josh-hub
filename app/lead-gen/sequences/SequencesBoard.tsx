"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type SequenceRow = {
  id: string;
  slug: string;
  name: string;
  goal: string | null;
  brand: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SequenceWithSteps = SequenceRow & {
  steps: {
    id: string;
    sequence_id: string;
    step_order: number;
    wait_days: number;
    subject: string | null;
    body: string;
  }[];
};

export type EnrolledLeadRow = {
  progressId: string;
  leadId: string;
  sequenceId: string;
  sequenceName: string;
  currentStep: number;
  totalSteps: number;
  status: string;
  nextDueAt: string | null;
  lastSentAt: string | null;
  enrolledAt: string;
  leadName: string | null;
  leadEmail: string | null;
  leadCompany: string | null;
  leadStatus: string | null;
  stalled: boolean;
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

function timeUntil(iso: string | null): string {
  if (!iso) return "—";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) {
    const overdue = Math.abs(ms);
    if (overdue < 3600_000) return `overdue ${Math.floor(overdue / 60_000)}m`;
    if (overdue < 86_400_000) return `overdue ${Math.floor(overdue / 3600_000)}h`;
    return `overdue ${Math.floor(overdue / 86_400_000)}d`;
  }
  if (ms < 3600_000) return `in ${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `in ${Math.floor(ms / 3600_000)}h`;
  return `in ${Math.floor(ms / 86_400_000)}d`;
}

export function SequencesBoard({
  sequences,
  enrolled,
}: {
  sequences: SequenceWithSteps[];
  enrolled: EnrolledLeadRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creatingSeq, setCreatingSeq] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [expandedSeq, setExpandedSeq] = useState<string | null>(sequences[0]?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);

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

  async function createSequence(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreatingSeq(true);
    try {
      const res = await fetch("/api/sequences/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slugify(newName), name: newName.trim(), goal: newGoal.trim() || undefined }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Create failed: ${json.error}`);
        return;
      }
      setNewName("");
      setNewGoal("");
      setShowCreate(false);
      flashFor("Sequence created.");
      startTransition(() => router.refresh());
    } finally {
      setCreatingSeq(false);
    }
  }

  // Stats
  const stalled = useMemo(() => enrolled.filter((e) => e.stalled), [enrolled]);
  const dueSoon = useMemo(
    () =>
      enrolled.filter(
        (e) =>
          e.status === "active" &&
          e.nextDueAt &&
          new Date(e.nextDueAt).getTime() <= Date.now() + 24 * 3600_000
      ),
    [enrolled]
  );
  const completed = enrolled.filter((e) => e.status === "completed").length;

  return (
    <div className="fl-reveal">
      <div className="stats-bar" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-label">Sequences</div>
          <div className="stat-num">{sequences.length}</div>
          <div className="stat-delta">Active playbooks</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Enrolled leads</div>
          <div className="stat-num">{enrolled.length}</div>
          <div className="stat-delta">{completed} completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Due in 24h</div>
          <div className="stat-num">{dueSoon.length}</div>
          <div className="stat-delta">Next step pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Stalled</div>
          <div className="stat-num" style={{ color: stalled.length > 0 ? "#f87171" : "var(--text)" }}>
            {stalled.length}
          </div>
          <div className="stat-delta">7+ days overdue</div>
        </div>
      </div>

      {flash && <div className="inbox-flash">{flash}</div>}

      {/* + new sequence */}
      {!showCreate ? (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="card"
          style={{
            width: "100%",
            padding: 16,
            marginBottom: 18,
            background: "linear-gradient(90deg, rgba(255,138,47,0.08), transparent 60%)",
            border: "1px solid rgba(255,138,47,0.22)",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
            color: "var(--text)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
          }}
        >
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>start a sequence</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Build a multi-step outreach playbook. Steps run on a wait-days cadence per lead.
            </div>
          </div>
          <div style={{ padding: "8px 18px", background: "var(--accent)", color: "#15100e", borderRadius: "var(--radius-sm)", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            + New
          </div>
        </button>
      ) : (
        <form onSubmit={createSequence} className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>new sequence</div>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              <div style={inputLabel}>// name</div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Cold outreach · audit prospects"
                style={inputStyle}
                autoFocus
              />
            </label>
            <label>
              <div style={inputLabel}>// goal — what does success look like</div>
              <input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Reply rate &gt; 5% on 100 sends"
                style={inputStyle}
              />
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <button type="button" onClick={() => setShowCreate(false)} className="act-btn" disabled={creatingSeq}>
              cancel
            </button>
            <button type="submit" className="act-btn act-btn-primary" disabled={!newName.trim() || creatingSeq}>
              {creatingSeq ? "creating…" : "create →"}
            </button>
          </div>
        </form>
      )}

      {/* Sequences list */}
      {sequences.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div className="section-header" style={{ marginBottom: 10 }}>
            <div className="section-label">playbooks</div>
            <span className="log-count">{sequences.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sequences.map((seq) => {
              const open = expandedSeq === seq.id;
              const enrolledInSeq = enrolled.filter((e) => e.sequenceId === seq.id);
              return (
                <div
                  key={seq.id}
                  className="card"
                  style={{ padding: 0, overflow: "hidden" }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSeq(open ? null : seq.id)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      background: open ? "rgba(255,138,47,0.05)" : "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: "var(--text)",
                      display: "grid",
                      gridTemplateColumns: "1fr 110px 110px 100px 50px",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{seq.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
                        {seq.slug} · {seq.goal || "no goal set"}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {seq.steps.length} {seq.steps.length === 1 ? "step" : "steps"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {enrolledInSeq.length} enrolled
                    </div>
                    <div>
                      <span style={{ padding: "3px 9px", fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(52,211,153,0.14)", color: "#34d399", borderRadius: 3 }}>
                        {seq.status}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", color: "var(--accent)", fontSize: 16 }}>
                      {open ? "−" : "+"}
                    </div>
                  </button>
                  {open && (
                    <div style={{ padding: "0 16px 16px" }}>
                      <SequenceSteps seq={seq} onChange={() => startTransition(() => router.refresh())} flashFor={flashFor} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stalled leads — needs follow-up */}
      {stalled.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="section-header" style={{ marginBottom: 10 }}>
            <div className="section-label" style={{ color: "#f87171" }}>stalled · needs follow-up</div>
            <span className="log-count">{stalled.length}</span>
          </div>
          <EnrolledTable rows={stalled} highlight="stalled" />
        </div>
      )}

      {/* All enrolled */}
      {enrolled.length > 0 && (
        <div>
          <div className="section-header" style={{ marginBottom: 10 }}>
            <div className="section-label">all enrolled leads</div>
            <span className="log-count">{enrolled.length}</span>
          </div>
          <EnrolledTable rows={enrolled} />
        </div>
      )}

      {enrolled.length === 0 && sequences.length > 0 && (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
          No leads enrolled yet. From{" "}
          <a href="/clients" style={{ color: "var(--accent)" }}>Clients</a> or{" "}
          <a href="/lead-gen/leads" style={{ color: "var(--accent)" }}>Leads</a>, you can enroll someone via the API (UI button coming soon).
        </div>
      )}

      {sequences.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
          No sequences yet. Click <strong style={{ color: "var(--text)" }}>+ New</strong> above to start your first playbook.
        </div>
      )}

      {pending && <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 10 }}>refreshing…</div>}
    </div>
  );
}

function SequenceSteps({
  seq,
  onChange,
  flashFor,
}: {
  seq: SequenceWithSteps;
  onChange: () => void;
  flashFor: (msg: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [wait, setWait] = useState("0");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  async function addStep() {
    const waitN = parseInt(wait, 10);
    if (isNaN(waitN) || !body.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/sequences/${seq.slug}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wait_days: waitN, subject: subject.trim() || undefined, body: body.trim() }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Add step failed: ${json.error}`);
        return;
      }
      setSubject("");
      setBody("");
      setWait("3");
      onChange();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
        // steps
      </div>
      {seq.steps.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "8px 0", fontStyle: "italic" }}>
          No steps yet. Add the first below.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {seq.steps.map((s, idx) => (
            <div
              key={s.id}
              style={{
                padding: 10,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                display: "grid",
                gridTemplateColumns: "60px 80px 1fr",
                gap: 10,
                alignItems: "start",
              }}
            >
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em" }}>
                #{idx + 1}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
                wait {s.wait_days}d
              </div>
              <div>
                {s.subject && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                    {s.subject}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                  }}
                >
                  {s.body.length > 220 ? s.body.slice(0, 220) + "…" : s.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          padding: 12,
          background: "rgba(255,138,47,0.04)",
          border: "1px solid rgba(255,138,47,0.16)",
          borderRadius: 4,
        }}
      >
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>
          // add step
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 8, marginBottom: 8 }}>
          <input
            type="number"
            value={wait}
            onChange={(e) => setWait(e.target.value)}
            placeholder="wait days"
            style={inputStyle}
            min={0}
            max={365}
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional — leave blank to continue thread)"
            style={inputStyle}
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Email body. Use {{name}}, {{company}}, {{first_name}} for personalization.`}
          rows={4}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            onClick={addStep}
            disabled={adding || !body.trim()}
            className="act-btn act-btn-primary"
          >
            {adding ? "adding…" : "add step"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EnrolledTable({ rows, highlight }: { rows: EnrolledLeadRow[]; highlight?: "stalled" }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(180px,1.4fr) minmax(160px,1.4fr) 100px 120px 110px 110px",
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
        <div>Lead</div>
        <div>Sequence</div>
        <div>Step</div>
        <div>Status</div>
        <div>Next due</div>
        <div>Last sent</div>
      </div>
      {rows.map((r) => (
        <div
          key={r.progressId}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(180px,1.4fr) minmax(160px,1.4fr) 100px 120px 110px 110px",
            gap: 12,
            padding: "11px 16px",
            alignItems: "center",
            borderBottom: "1px solid var(--border)",
            background: highlight === "stalled" ? "rgba(248,113,113,0.04)" : "transparent",
            fontSize: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.leadName || "(no name)"}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
              {r.leadEmail || "—"}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {r.sequenceName}
          </div>
          <div style={{ fontFamily: "var(--mono)", color: "var(--text)" }}>
            {r.currentStep + 1}/{r.totalSteps || "?"}
          </div>
          <div>
            <span
              style={{
                padding: "3px 9px",
                fontFamily: "var(--mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: r.status === "completed" ? "rgba(52,211,153,0.14)" : r.status === "active" ? "rgba(96,165,250,0.14)" : "var(--bg)",
                color: r.status === "completed" ? "#34d399" : r.status === "active" ? "#60a5fa" : "var(--text-tertiary)",
                borderRadius: 3,
              }}
            >
              {r.status}
            </span>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: r.stalled ? "#f87171" : "var(--text-tertiary)" }}>
            {timeUntil(r.nextDueAt)}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
            {timeAgo(r.lastSentAt)}
          </div>
        </div>
      ))}
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

const inputLabel: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 10,
  color: "var(--text-tertiary)",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  marginBottom: 4,
};
