"use client";

// /content/dms TriggersPanel — manage the keyword -> auto-reply pairs the
// IG DM responder fires on. Edits hit /api/social/triggers and the next
// cron tick (every 5 min) picks them up.

import { useEffect, useState, useTransition } from "react";

type Trigger = {
  id: string;
  keyword: string;
  response: string;
  description: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.7rem",
  borderRadius: 6,
  border: "1px solid var(--border, #333)",
  background: "var(--input-bg, #1a1a1a)",
  color: "var(--text, #e8e6e1)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
};

export function TriggersPanel() {
  const [items, setItems] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ keyword: "", response: "", description: "" });
  const [pending, startTransition] = useTransition();

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/social/triggers");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "load failed");
      setItems(data.triggers as Trigger[]);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); }, []);

  async function add() {
    const k = draft.keyword.trim();
    const r = draft.response.trim();
    if (!k || !r) { setError("Keyword and response are required."); return; }
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/social/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: k, response: r, description: draft.description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || "create failed"); return; }
      setDraft({ keyword: "", response: "", description: "" });
      refresh();
    });
  }

  async function patch(id: string, partial: Partial<Trigger>) {
    startTransition(async () => {
      const res = await fetch("/api/social/triggers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...partial }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || "update failed"); return; }
      refresh();
    });
  }

  async function remove(id: string) {
    if (!confirm("Remove this keyword trigger?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/social/triggers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || "delete failed"); return; }
      refresh();
    });
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 24, borderRadius: 10 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: "1.05rem", margin: 0, fontWeight: 700 }}>Keyword triggers</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #999)", margin: "0.35rem 0 0" }}>
          When an inbound IG DM contains one of these keywords (short messages only — ≤ 5 words),
          the responder auto-sends the response immediately. Everything else is classified, drafted in
          your voice, and parked below for one-click review. Changes go live on the next cron tick (~5 min).
        </p>
      </div>

      {error && <div style={{ color: "var(--danger, #f87171)", fontSize: "0.85rem", marginBottom: 12 }}>{error}</div>}

      {/* Add new */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "start", marginBottom: 18 }}>
        <input
          style={{ ...inputStyle, width: 160 }}
          placeholder="keyword"
          value={draft.keyword}
          onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
        />
        <input
          style={inputStyle}
          placeholder="The auto-reply Josh sends back (plain text, no emojis)"
          value={draft.response}
          onChange={(e) => setDraft({ ...draft, response: e.target.value })}
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !draft.keyword.trim() || !draft.response.trim()}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--brand-accent, #ff8a2f)",
            color: "#111",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            opacity: pending || !draft.keyword.trim() || !draft.response.trim() ? 0.5 : 1,
          }}
        >
          Add trigger
        </button>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted, #999)", fontSize: "0.85rem" }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ color: "var(--text-muted, #999)", fontSize: "0.85rem" }}>No triggers yet. Add one above.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((t) => (
            <TriggerRow key={t.id} trigger={t} onPatch={patch} onRemove={remove} pending={pending} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TriggerRow({
  trigger,
  onPatch,
  onRemove,
  pending,
}: {
  trigger: Trigger;
  onPatch: (id: string, partial: Partial<Trigger>) => void;
  onRemove: (id: string) => void;
  pending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState({ keyword: trigger.keyword, response: trigger.response });
  return (
    <li
      style={{
        border: "1px solid var(--border, #333)",
        borderRadius: 8,
        padding: 12,
        opacity: trigger.enabled ? 1 : 0.55,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
        <code style={{ background: "rgba(255,138,47,0.12)", color: "var(--brand-accent, #ff8a2f)", padding: "0.18rem 0.5rem", borderRadius: 4, fontSize: "0.8rem", fontWeight: 700 }}>
          {trigger.keyword}
        </code>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => onPatch(trigger.id, { enabled: !trigger.enabled })}
            disabled={pending}
            style={{ fontSize: "0.78rem", background: "transparent", border: "1px solid var(--border, #333)", borderRadius: 5, padding: "0.3rem 0.6rem", color: "var(--text, #e8e6e1)", cursor: "pointer" }}
          >
            {trigger.enabled ? "Disable" : "Enable"}
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            disabled={pending}
            style={{ fontSize: "0.78rem", background: "transparent", border: "1px solid var(--border, #333)", borderRadius: 5, padding: "0.3rem 0.6rem", color: "var(--text, #e8e6e1)", cursor: "pointer" }}
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => onRemove(trigger.id)}
            disabled={pending}
            style={{ fontSize: "0.78rem", background: "transparent", border: "1px solid var(--danger, #f87171)", color: "var(--danger, #f87171)", borderRadius: 5, padding: "0.3rem 0.6rem", cursor: "pointer" }}
          >
            Remove
          </button>
        </div>
      </div>
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input style={inputStyle} value={val.keyword} onChange={(e) => setVal({ ...val, keyword: e.target.value })} />
          <textarea
            style={{ ...inputStyle, minHeight: 70, fontFamily: "inherit", lineHeight: 1.5 }}
            value={val.response}
            onChange={(e) => setVal({ ...val, response: e.target.value })}
          />
          <div>
            <button
              type="button"
              onClick={() => { onPatch(trigger.id, val); setEditing(false); }}
              disabled={pending}
              style={{ padding: "0.4rem 0.9rem", background: "var(--brand-accent, #ff8a2f)", color: "#111", border: "none", borderRadius: 6, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "0.88rem", color: "var(--text, #e8e6e1)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {trigger.response}
        </div>
      )}
      {trigger.description && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #999)", marginTop: 6 }}>{trigger.description}</div>
      )}
    </li>
  );
}
