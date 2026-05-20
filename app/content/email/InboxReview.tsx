"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_COLORS } from "@/lib/email/categories";

export type InboxRow = {
  id: string;
  fastmail_id: string;
  from_address: string;
  from_name: string | null;
  to_address: string | null;
  subject: string | null;
  body_preview: string | null;
  body_full: string | null;
  received_at: string | null;
  category: string | null;
  category_confidence: number | null;
  category_reasoning: string | null;
  action_taken: string | null;
  draft_response: string | null;
  fastmail_draft_id: string | null;
  draft_status: "pending" | "sent" | "discarded" | "failed" | "no_draft";
  sent_at: string | null;
  send_error: string | null;
  created_at: string | null;
};

function timeAgo(date: string | null): string {
  if (!date) return "—";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function postJson(url: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: body && url.includes("/edit/") ? "PATCH" : "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function InboxReview({ rows }: { rows: InboxRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Record<string, string>>({});

  const drafts = useMemo(() => rows.filter((r) => r.draft_status === "pending"), [rows]);
  const sent = useMemo(() => rows.filter((r) => r.draft_status === "sent"), [rows]);
  const failed = useMemo(() => rows.filter((r) => r.draft_status === "failed"), [rows]);
  const triaged = useMemo(
    () => rows.filter((r) => r.draft_status === "no_draft" || r.draft_status === "discarded"),
    [rows]
  );

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setFlashMessage(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 4000);
  }

  async function onSend(id: string) {
    setBusyId(id);
    const res = await postJson(`/api/email/send/${id}`);
    setBusyId(null);
    setFlashMessage(res.ok ? "Sent" : `Send failed: ${res.error}`);
    if (res.ok) startTransition(() => router.refresh());
  }

  async function onDiscard(id: string) {
    if (!confirm("Discard this draft?")) return;
    setBusyId(id);
    const res = await postJson(`/api/email/discard/${id}`);
    setBusyId(null);
    setFlashMessage(res.ok ? "Discarded" : `Discard failed: ${res.error}`);
    if (res.ok) startTransition(() => router.refresh());
  }

  async function onSaveEdit(id: string) {
    const body = editing[id];
    if (!body) return;
    setBusyId(id);
    const res = await postJson(`/api/email/edit/${id}`, { body });
    setBusyId(null);
    setFlashMessage(res.ok ? "Draft updated in Fastmail" : `Edit failed: ${res.error}`);
    if (res.ok) {
      setEditing((e) => {
        const next = { ...e };
        delete next[id];
        return next;
      });
      startTransition(() => router.refresh());
    }
  }

  async function onSendAll() {
    if (drafts.length === 0) return;
    if (!confirm(`Send all ${drafts.length} pending drafts?`)) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/email/send-all", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        attempted?: number;
        sent?: number;
        failed?: number;
        error?: string;
      };
      if (res.ok && json.ok) {
        setFlashMessage(
          `Sent ${json.sent}/${json.attempted}${json.failed ? ` · ${json.failed} failed` : ""}`
        );
        startTransition(() => router.refresh());
      } else {
        setFlashMessage(`Bulk send failed: ${json.error || res.status}`);
      }
    } catch (e) {
      setFlashMessage(`Bulk send failed: ${(e as Error).message}`);
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="fl-reveal">
      {/* Stat strip */}
      <div className="stats-bar" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Drafts to Review</div>
          <div className="stat-num">{drafts.length}</div>
          <div className="stat-delta">Parked in Fastmail Drafts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sent (this view)</div>
          <div className="stat-num">{sent.length}</div>
          <div className="stat-delta">After your one-click</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">No-Draft Triage</div>
          <div className="stat-num">{triaged.length}</div>
          <div className="stat-delta">Spam, newsletters, no-action</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed Sends</div>
          <div className="stat-num">{failed.length}</div>
          <div className="stat-delta">{failed.length ? "Check error column" : "All clean"}</div>
        </div>
      </div>

      <div className="inbox-toolbar">
        <div className="inbox-toolbar-left">
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {drafts.length} draft{drafts.length === 1 ? "" : "s"} pending review · polling every 5 min
          </span>
        </div>
        <button
          type="button"
          className="act-btn act-btn-primary"
          disabled={drafts.length === 0 || bulkBusy || pending}
          onClick={onSendAll}
        >
          {bulkBusy ? "Sending…" : `Send all ${drafts.length}`}
        </button>
      </div>

      {flash && <div className="inbox-flash">{flash}</div>}

      {drafts.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
          No drafts pending review. The engine polls Fastmail every 5 min and parks drafts here when something needs your reply.
        </div>
      ) : (
        drafts.map((r) => {
          const cat = (r.category || "unclassifiable") as keyof typeof CATEGORY_COLORS;
          const cColor = CATEGORY_COLORS[cat] || "#888";
          const isEditing = editing[r.id] !== undefined;
          return (
            <div className="email-card" key={r.id}>
              <div className="email-head" onClick={() => toggle(r.id)}>
                <div className="email-from">
                  <strong>{r.from_name || r.from_address}</strong>
                  <span className="email-addr">{r.from_address}</span>
                </div>
                <div className="email-meta">
                  {r.category && (
                    <span
                      className="email-cat"
                      style={{ background: `${cColor}1a`, color: cColor }}
                      title={r.category_reasoning || undefined}
                    >
                      {r.category.replace(/_/g, " ")}
                    </span>
                  )}
                  {typeof r.category_confidence === "number" && (
                    <span className="email-conf">{Math.round(r.category_confidence * 100)}%</span>
                  )}
                  <span className="email-time">{timeAgo(r.received_at || r.created_at)}</span>
                </div>
              </div>
              <div className="email-subject">{r.subject || "(no subject)"}</div>
              <div className="email-preview">{r.body_preview?.slice(0, 280) || ""}</div>

              {expanded.has(r.id) && (
                <div className="email-draft">
                  <div className="email-draft-label">
                    Drafted reply (parked in Fastmail · click to edit)
                  </div>
                  {isEditing ? (
                    <textarea
                      className="email-draft-edit"
                      value={editing[r.id]}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      rows={10}
                    />
                  ) : (
                    <pre
                      className="email-draft-body"
                      onClick={() =>
                        setEditing((prev) => ({ ...prev, [r.id]: r.draft_response || "" }))
                      }
                    >
                      {r.draft_response || "(no draft body)"}
                    </pre>
                  )}
                  {isEditing && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        type="button"
                        className="act-btn act-btn-primary"
                        disabled={busyId === r.id}
                        onClick={() => onSaveEdit(r.id)}
                      >
                        {busyId === r.id ? "Saving…" : "Save edit"}
                      </button>
                      <button
                        type="button"
                        className="act-btn"
                        onClick={() =>
                          setEditing((prev) => {
                            const next = { ...prev };
                            delete next[r.id];
                            return next;
                          })
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="email-actions">
                <button type="button" className="act-btn" onClick={() => toggle(r.id)}>
                  {expanded.has(r.id) ? "Hide draft" : "View draft"}
                </button>
                <button
                  type="button"
                  className="act-btn"
                  onClick={() => onDiscard(r.id)}
                  disabled={busyId === r.id || pending}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="act-btn act-btn-primary"
                  onClick={() => onSend(r.id)}
                  disabled={busyId === r.id || pending}
                >
                  {busyId === r.id ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          );
        })
      )}

      {(sent.length > 0 || triaged.length > 0 || failed.length > 0) && (
        <>
          <div className="section-header" style={{ marginTop: 32 }}>
            <div className="section-label">History</div>
            <span className="log-count">
              {sent.length} sent · {triaged.length} triaged · {failed.length} failed
            </span>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {[...sent, ...failed, ...triaged].slice(0, 50).map((r) => (
              <div key={r.id} className="email-sent-row">
                <div>
                  <strong>{r.from_name || r.from_address}</strong>
                  <span className="email-addr">{r.from_address}</span>
                </div>
                <div className="email-subject-inline">{r.subject || "(no subject)"}</div>
                <div className="email-time">
                  {r.draft_status === "sent" ? "✓ " : r.draft_status === "failed" ? "× " : ""}
                  {timeAgo(r.sent_at || r.received_at || r.created_at)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
