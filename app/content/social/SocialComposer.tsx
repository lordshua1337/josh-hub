"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type SocialRow = {
  id: string;
  brand: string;
  post_type: string;
  composition: string;
  topic: string | null;
  copy_blocks: {
    kicker?: string;
    headline?: string;
    emphasize?: string;
    footer?: string;
    caption?: string;
  } | null;
  image_url: string | null;
  status: string;
  platform: string;
  scheduled_for: string | null;
  posted_at: string | null;
  posted_id: string | null;
  error: string | null;
  created_at: string;
};

function renderUrl(row: SocialRow): string {
  const p = new URLSearchParams({ brand: row.brand, composition: row.composition, size: "1080" });
  if (row.copy_blocks?.kicker) p.set("kicker", row.copy_blocks.kicker);
  if (row.copy_blocks?.headline) p.set("headline", row.copy_blocks.headline);
  if (row.copy_blocks?.emphasize) p.set("emphasize", row.copy_blocks.emphasize);
  if (row.copy_blocks?.footer) p.set("footer", row.copy_blocks.footer);
  return `/api/social/render?${p}`;
}

export function SocialComposer({ rows }: { rows: SocialRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function flashFor(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 4000);
  }

  async function onDraft(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!topic.trim()) return;
    setDrafting(true);
    try {
      const res = await fetch("/api/social/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: "prometheus", post_type: "declaration", topic }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Draft failed: ${json.error}`);
        return;
      }
      flashFor("Drafted");
      setTopic("");
      startTransition(() => router.refresh());
    } catch (e) {
      flashFor(`Draft failed: ${(e as Error).message}`);
    } finally {
      setDrafting(false);
    }
  }

  async function onPublish(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/social/publish/${id}`, { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; queued?: boolean; reason?: string; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Publish failed: ${json.error}`);
      } else if (json.queued) {
        flashFor("Queued — IG credential not connected yet. Image is baked, ready to push.");
      } else {
        flashFor("Pushed to IG drafts — open Instagram to finish.");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      flashFor(`Publish failed: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  }

  async function onDiscard(id: string) {
    if (!confirm("Discard this draft?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/migrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": "" },
        // We don't actually have an admin path for soft-delete; do it via supabase REST via a delete endpoint.
        body: JSON.stringify({ sql: `update public.social_posts set status='discarded' where id='${id}';` }),
      });
      if (!res.ok) flashFor("Discard failed");
      else flashFor("Discarded");
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  const drafts = rows.filter((r) => r.status === "draft");
  const queued = rows.filter((r) => r.status === "queued_for_ig" || r.status === "draft_pushed");
  const history = rows.filter((r) => r.status === "discarded" || r.status === "failed" || r.status === "posted");

  return (
    <div className="fl-reveal">
      {/* Stats */}
      <div className="stats-bar" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Drafts</div>
          <div className="stat-num">{drafts.length}</div>
          <div className="stat-delta">Awaiting review</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Queued / Pushed</div>
          <div className="stat-num">{queued.length}</div>
          <div className="stat-delta">Ready for IG</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total this view</div>
          <div className="stat-num">{rows.length}</div>
          <div className="stat-delta">Last 50</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Brand</div>
          <div className="stat-num" style={{ fontSize: 18 }}>Prometheus</div>
          <div className="stat-delta">Only brand wired for now</div>
        </div>
      </div>

      {/* Composer */}
      <form onSubmit={onDraft} className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>
          Draft a new post
        </div>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic for the post. e.g. 'why most AI strategy decks are useless without an operating model'"
          rows={2}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 14,
            fontFamily: "'Inter', sans-serif",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text)",
            resize: "vertical",
            marginBottom: 10,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            Declaration · 1080×1080 · Prometheus voice
          </span>
          <button type="submit" className="act-btn act-btn-primary" disabled={drafting || !topic.trim() || pending}>
            {drafting ? "Drafting…" : "Draft post"}
          </button>
        </div>
      </form>

      {flash && <div className="inbox-flash">{flash}</div>}

      {/* Drafts */}
      {drafts.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)", marginBottom: 24 }}>
          No drafts yet. Drop a topic above and the engine will draft one.
        </div>
      ) : (
        drafts.map((r) => <PostCard key={r.id} row={r} onPublish={onPublish} onDiscard={onDiscard} busyId={busyId} pending={pending} />)
      )}

      {/* Queued / Pushed */}
      {queued.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 24 }}>
            <div className="section-label">Queued / Pushed to IG</div>
            <span className="log-count">{queued.length}</span>
          </div>
          {queued.map((r) => (
            <PostCard key={r.id} row={r} onPublish={onPublish} onDiscard={onDiscard} busyId={busyId} pending={pending} compact />
          ))}
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 24 }}>
            <div className="section-label">History</div>
            <span className="log-count">{history.length}</span>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {history.slice(0, 25).map((r) => (
              <div key={r.id} className="email-sent-row">
                <div>
                  <strong style={{ textTransform: "capitalize" }}>{r.status.replace(/_/g, " ")}</strong>
                  <span className="email-addr">{r.brand}</span>
                </div>
                <div className="email-subject-inline">
                  {r.copy_blocks?.headline?.slice(0, 80) || r.topic || "(no copy)"}
                </div>
                <div className="email-time">{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PostCard({
  row,
  onPublish,
  onDiscard,
  busyId,
  pending,
  compact,
}: {
  row: SocialRow;
  onPublish: (id: string) => void;
  onDiscard: (id: string) => void;
  busyId: string | null;
  pending: boolean;
  compact?: boolean;
}) {
  const preview = renderUrl(row);
  const caption = row.copy_blocks?.caption || "";
  return (
    <div className="card" style={{ padding: 20, marginBottom: 12, display: "grid", gridTemplateColumns: compact ? "200px 1fr" : "320px 1fr", gap: 20, alignItems: "start" }}>
      <div style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="post preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <span className="leads-source-pill">{row.brand}</span>
          <span className="leads-status leads-status-new">{row.status}</span>
          <span className="email-time">{new Date(row.created_at).toLocaleDateString()}</span>
        </div>
        {row.topic && (
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 10 }}>
            <strong>Topic:</strong> {row.topic}
          </div>
        )}
        {caption && (
          <pre
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              color: "var(--text-secondary)",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: 12,
              marginBottom: 10,
              maxHeight: 200,
              overflow: "auto",
            }}
          >
            {caption}
          </pre>
        )}
        {row.error && (
          <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8 }}>
            Error: {row.error}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <a className="act-btn" href={preview} target="_blank" rel="noreferrer">
            Open PNG
          </a>
          <button type="button" className="act-btn" onClick={() => onDiscard(row.id)} disabled={busyId === row.id || pending}>
            Discard
          </button>
          {row.status === "draft" && (
            <button
              type="button"
              className="act-btn act-btn-primary"
              onClick={() => onPublish(row.id)}
              disabled={busyId === row.id || pending}
            >
              {busyId === row.id ? "Pushing…" : "Push to IG drafts"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
