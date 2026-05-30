// Read-only feed of recent IG comments captured from the webhook. The
// classifier + book-a-call replier pass will be wired into the cron next
// (mirrors the DM flow); for now this surfaces what's coming in so we can
// see the webhook is delivering.

export type CommentRow = {
  id: string;
  ig_comment_id: string;
  parent_media_id: string | null;
  sender_id: string | null;
  sender_username: string | null;
  body: string;
  received_at: string | null;
  category: string | null;
  draft_reply: string | null;
  reply_status: string | null;
  created_at: string | null;
};

function relTime(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

export function CommentsList({ rows }: { rows: CommentRow[] }) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 24, borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: "1.05rem", margin: 0, fontWeight: 700 }}>Recent comments</h2>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #999)" }}>
          {rows.length === 0 ? "Nothing yet" : `Showing ${rows.length}`}
        </span>
      </div>
      {rows.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #999)", margin: 0 }}>
          No comments captured yet. They&apos;ll show up here once the IG webhook is subscribed to the{" "}
          <code>comments</code> field for the GPTWhiz page → @builtbyprometheus.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((c) => (
            <li
              key={c.id}
              style={{
                border: "1px solid var(--border, #333)",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: "0.8rem", color: "var(--text-muted, #999)" }}>
                <span>
                  <strong style={{ color: "var(--text, #e8e6e1)" }}>
                    @{c.sender_username || c.sender_id || "unknown"}
                  </strong>
                  {c.parent_media_id && (
                    <span style={{ marginLeft: 8, opacity: 0.7 }}>
                      on post <code style={{ fontSize: "0.72rem" }}>{c.parent_media_id.slice(-8)}</code>
                    </span>
                  )}
                </span>
                <span>{relTime(c.received_at || c.created_at)}</span>
              </div>
              <div style={{ fontSize: "0.92rem", color: "var(--text, #e8e6e1)", lineHeight: 1.5 }}>{c.body || "(empty)"}</div>
              {c.draft_reply && (
                <div style={{ marginTop: 4, padding: 8, borderRadius: 6, background: "rgba(255,138,47,0.08)", fontSize: "0.85rem", color: "var(--text, #e8e6e1)", borderLeft: "2px solid var(--brand-accent, #ff8a2f)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--brand-accent, #ff8a2f)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Drafted reply</div>
                  {c.draft_reply}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
