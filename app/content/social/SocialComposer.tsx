"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { POST_TYPES } from "@/lib/social/post-types";

export type SocialRow = {
  id: string;
  brand: string;
  post_type: string;
  composition: string;
  topic: string | null;
  copy_blocks: {
    is_carousel?: boolean;
    slides?: {
      composition: string;
      kicker?: string;
      headline?: string;
      emphasize?: string;
      footer?: string;
      title?: string;
      body?: string;
      index?: number;
      total?: number;
      closer?: string;
      cta?: string;
      link?: string;
      theySaidLabel?: string;
      theySaid?: string;
      trueLabel?: string;
      trueLine?: string;
    }[];
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

function slidePreviewUrl(postId: string, idx: number, size = 540): string {
  const p = new URLSearchParams({ postId, slide: String(idx), size: String(size) });
  return `/api/social/render?${p}`;
}

export function SocialComposer({ rows }: { rows: SocialRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [postType, setPostType] = useState(POST_TYPES[0].slug);
  const [drafting, setDrafting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function flashFor(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 5000);
  }

  async function onDraft(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!topic.trim()) return;
    setDrafting(true);
    try {
      const res = await fetch("/api/social/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: "prometheus", post_type: postType, topic }),
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
      if (!res.ok || !json.ok) flashFor(`Publish failed: ${json.error}`);
      else if (json.queued) flashFor("Queued — IG creds not connected yet. Slide PNGs baked.");
      else flashFor("Pushed to IG drafts — open Instagram to finish.");
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
      await fetch(`/api/admin/migrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": "" },
        body: JSON.stringify({ sql: `update public.social_posts set status='discarded' where id='${id}';` }),
      });
      flashFor("Discarded");
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  const drafts = rows.filter((r) => r.status === "draft");
  const queued = rows.filter((r) => r.status === "queued_for_ig" || r.status === "draft_pushed");
  const history = rows.filter((r) => r.status === "discarded" || r.status === "failed" || r.status === "posted");

  const selectedDef = POST_TYPES.find((p) => p.slug === postType) || POST_TYPES[0];

  return (
    <div className="fl-reveal">
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
          <div className="stat-label">Post types</div>
          <div className="stat-num">{POST_TYPES.length}</div>
          <div className="stat-delta">Singles + carousels</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Brand</div>
          <div className="stat-num" style={{ fontSize: 18 }}>Prometheus</div>
          <div className="stat-delta">Only brand wired</div>
        </div>
      </div>

      {/* Composer */}
      <form onSubmit={onDraft} className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>
          Draft a new post
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12, marginBottom: 12 }}>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic. e.g. 'how AI shows up in a Head-of-Sales day' or 'why most AI strategy decks die in a drawer'"
            rows={3}
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
            }}
          />
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
            className="pivot-select"
            style={{ height: "100%", padding: "10px 12px" }}
          >
            {POST_TYPES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.kind === "carousel" ? "▦ " : "• "}
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {selectedDef.description}
          </span>
          <button type="submit" className="act-btn act-btn-primary" disabled={drafting || !topic.trim() || pending}>
            {drafting ? "Drafting…" : selectedDef.kind === "carousel" ? `Draft ${selectedDef.slideCount}-slide carousel` : "Draft post"}
          </button>
        </div>
      </form>

      {flash && <div className="inbox-flash">{flash}</div>}

      {drafts.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)", marginBottom: 24 }}>
          No drafts. Pick a post type and drop a topic.
        </div>
      ) : (
        drafts.map((r) => <PostCard key={r.id} row={r} onPublish={onPublish} onDiscard={onDiscard} busyId={busyId} pending={pending} />)
      )}

      {queued.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 24 }}>
            <div className="section-label">Queued / Pushed</div>
            <span className="log-count">{queued.length}</span>
          </div>
          {queued.map((r) => (
            <PostCard key={r.id} row={r} onPublish={onPublish} onDiscard={onDiscard} busyId={busyId} pending={pending} compact />
          ))}
        </>
      )}

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
                  <span className="email-addr">{r.post_type}</span>
                </div>
                <div className="email-subject-inline">
                  {r.copy_blocks?.slides?.[0]?.headline?.slice(0, 80) ||
                    r.copy_blocks?.slides?.[0]?.title?.slice(0, 80) ||
                    r.topic ||
                    "(no copy)"}
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
  const isCarousel = !!row.copy_blocks?.is_carousel;
  const slides = row.copy_blocks?.slides ?? [];
  const caption = row.copy_blocks?.caption || "";
  const pillar = POST_TYPES.find((p) => p.slug === row.post_type)?.label || row.post_type;

  return (
    <div className="card" style={{ padding: 20, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <span className="leads-source-pill">{row.brand}</span>
        <span className="booking-pill">{pillar}</span>
        <span className="leads-status leads-status-new">{row.status}</span>
        {isCarousel && <span className="booking-pill">{slides.length} slides</span>}
        <span className="email-time" style={{ marginLeft: "auto" }}>
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      </div>
      {row.topic && (
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 12 }}>
          <strong>Topic:</strong> {row.topic}
        </div>
      )}

      {/* Slide strip — horizontal scroll for carousels */}
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: caption ? 12 : 0,
        }}
      >
        {slides.map((_s, i) => (
          <a
            key={i}
            href={slidePreviewUrl(row.id, i, 1080)}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: "0 0 auto",
              width: compact ? 160 : 240,
              height: compact ? 160 : 240,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              overflow: "hidden",
              position: "relative",
              display: "block",
              textDecoration: "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slidePreviewUrl(row.id, i, 540)}
              alt={`slide ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontFamily: "var(--mono)",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              {i + 1}/{slides.length}
            </div>
          </a>
        ))}
      </div>

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
            marginBottom: 12,
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {caption}
        </pre>
      )}

      {row.error && (
        <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8 }}>Error: {row.error}</div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
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
            {busyId === row.id ? "Pushing…" : isCarousel ? `Push ${slides.length} slides to IG drafts` : "Push to IG drafts"}
          </button>
        )}
      </div>
    </div>
  );
}
