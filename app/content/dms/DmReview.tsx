"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type DmRow = {
  id: string;
  ig_message_id: string | null;
  sender_id: string | null;
  sender_username: string | null;
  sender_name: string | null;
  body: string;
  received_at: string | null;
  category: string | null;
  category_confidence: number | null;
  category_reasoning: string | null;
  draft_reply: string | null;
  reply_status: string;
  sent_at: string | null;
  send_error: string | null;
  created_at: string | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  lead_inquiry: "#ff8a2f",
  audit_request: "#facc15",
  support_question: "#60a5fa",
  compliment: "#34d399",
  complaint: "#f87171",
  personal: "#a78bfa",
  spam: "#64748b",
  unclassifiable: "#888",
};

function timeAgo(date: string | null): string {
  if (!date) return "—";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function postJson(url: string): Promise<{ ok: boolean; error?: string; data?: Record<string, unknown> }> {
  try {
    const res = await fetch(url, { method: "POST" });
    const json = (await res.json()) as { ok?: boolean; error?: string; [key: string]: unknown };
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function DmReview({ rows }: { rows: DmRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const pendingRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.draft_reply &&
          (r.reply_status === "pending" || r.reply_status === "ready_to_send")
      ),
    [rows]
  );
  const sent = useMemo(() => rows.filter((r) => r.reply_status === "sent"), [rows]);
  const failed = useMemo(() => rows.filter((r) => r.reply_status === "failed"), [rows]);
  const skipped = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.reply_status === "skipped" ||
          (r.category === "spam" && r.reply_status === "pending")
      ),
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
    setTimeout(() => setFlash(null), 5000);
  }

  async function onSend(id: string) {
    setBusyId(id);
    const res = await postJson(`/api/social/dm-send/${id}`);
    setBusyId(null);
    if (res.ok) {
      const queued = res.data?.queued === true;
      const reason = (res.data?.reason as string) || "";
      setFlashMessage(queued ? `Marked ready_to_send. ${reason}` : "Sent via IG Graph.");
      startTransition(() => router.refresh());
    } else {
      setFlashMessage(`Send failed: ${res.error}`);
    }
  }

  async function onSkip(id: string) {
    if (!confirm("Skip this DM (mark as handled without replying)?")) return;
    setBusyId(id);
    const res = await postJson(`/api/social/dm-skip/${id}`);
    setBusyId(null);
    setFlashMessage(res.ok ? "Skipped." : `Skip failed: ${res.error}`);
    if (res.ok) startTransition(() => router.refresh());
  }

  async function onCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFlashMessage("Copied draft to clipboard.");
    } catch {
      setFlashMessage("Copy failed.");
    }
  }

  return (
    <div className="fl-reveal">
      <div className="stats-bar" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Drafts to Review</div>
          <div className="stat-num">{pendingRows.length}</div>
          <div className="stat-delta">Classified + drafted</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sent</div>
          <div className="stat-num">{sent.length}</div>
          <div className="stat-delta">Shipped via IG Graph</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Skipped / Spam</div>
          <div className="stat-num">{skipped.length}</div>
          <div className="stat-delta">No reply needed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-num">{failed.length}</div>
          <div className="stat-delta">{failed.length ? "Check error" : "All clean"}</div>
        </div>
      </div>

      {flash && <div className="inbox-flash">{flash}</div>}

      {pendingRows.length === 0 ? (
        <div
          className="card"
          style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}
        >
          No DM drafts pending review. The cron classifies + drafts new IG DMs every 5 min.
        </div>
      ) : (
        pendingRows.map((r) => {
          const cat = r.category || "unclassifiable";
          const cColor = CATEGORY_COLORS[cat] || "#888";
          const isExpanded = expanded.has(r.id);
          const isReadyToSend = r.reply_status === "ready_to_send";
          return (
            <div className="email-card" key={r.id}>
              <div className="email-head" onClick={() => toggle(r.id)}>
                <div className="email-from">
                  <strong>{r.sender_username ? `@${r.sender_username}` : r.sender_name || "unknown sender"}</strong>
                  <span className="email-addr">{r.sender_id || "—"}</span>
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
                    <span className="email-conf">
                      {Math.round(r.category_confidence * 100)}%
                    </span>
                  )}
                  {isReadyToSend && (
                    <span
                      className="email-cat"
                      style={{ background: "#facc1522", color: "#facc15" }}
                      title="IG creds not connected — copy/paste for now"
                    >
                      ready_to_send
                    </span>
                  )}
                  <span className="email-time">{timeAgo(r.received_at || r.created_at)}</span>
                </div>
              </div>
              <div className="email-subject">DM from {r.sender_username ? `@${r.sender_username}` : r.sender_name || r.sender_id}</div>
              <div className="email-preview">{r.body.slice(0, 280)}</div>

              {isExpanded && (
                <div className="email-draft">
                  <div className="email-draft-label">Drafted reply (Josh voice)</div>
                  <pre className="email-draft-body">{r.draft_reply || "(no draft body)"}</pre>
                  {r.category_reasoning && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "var(--text-tertiary)",
                        fontStyle: "italic",
                      }}
                    >
                      Why: {r.category_reasoning}
                    </div>
                  )}
                </div>
              )}

              <div className="email-actions">
                <button type="button" className="act-btn" onClick={() => toggle(r.id)}>
                  {isExpanded ? "Hide draft" : "View draft"}
                </button>
                <button
                  type="button"
                  className="act-btn"
                  onClick={() => onCopy(r.draft_reply || "")}
                  disabled={!r.draft_reply}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="act-btn"
                  onClick={() => onSkip(r.id)}
                  disabled={busyId === r.id || pending}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className="act-btn act-btn-primary"
                  onClick={() => onSend(r.id)}
                  disabled={busyId === r.id || pending}
                >
                  {busyId === r.id ? "Sending…" : isReadyToSend ? "Mark sent" : "Send"}
                </button>
              </div>
            </div>
          );
        })
      )}

      {(sent.length > 0 || skipped.length > 0 || failed.length > 0) && (
        <>
          <div className="section-header" style={{ marginTop: 32 }}>
            <div className="section-label">History</div>
            <span className="log-count">
              {sent.length} sent · {skipped.length} skipped · {failed.length} failed
            </span>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {[...sent, ...failed, ...skipped].slice(0, 50).map((r) => (
              <div key={r.id} className="email-sent-row">
                <div>
                  <strong>{r.sender_username ? `@${r.sender_username}` : r.sender_name || "unknown"}</strong>
                  <span className="email-addr">{r.category || "—"}</span>
                </div>
                <div className="email-subject-inline">{r.body.slice(0, 80)}</div>
                <div className="email-time">
                  {r.reply_status === "sent"
                    ? "✓ "
                    : r.reply_status === "failed"
                    ? "× "
                    : ""}
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
