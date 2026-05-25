"use client";

// The Instagram handoff view. Everything Josh needs to post manually:
//   - every slide, downloadable individually or as one .zip
//   - caption (trailing hashtags split off), hashtags, first comment, reel
//   - the exact in-app steps (this is where music gets added — the API can't)

import Link from "next/link";
import { useState } from "react";
import {
  extractHashtags,
  FALLBACK_HASHTAGS,
  captionWithoutTrailingTags,
  reelToText,
  type ReelLike,
} from "@/lib/social/handoff";

function slideRenderUrl(postId: string, idx: number, size: number): string {
  const p = new URLSearchParams({ postId, slide: String(idx), size: String(size) });
  return `/api/social/render?${p}`;
}

export function DeployView({
  postId,
  typeLabel,
  topic,
  slideCount,
  isCarousel,
  caption,
  firstComment,
  reel,
}: {
  postId: string;
  typeLabel: string;
  topic: string | null;
  slideCount: number;
  isCarousel: boolean;
  caption: string;
  firstComment: string;
  reel: ReelLike | null;
}) {
  const captionBody = captionWithoutTrailingTags(caption) || caption;
  const own = Array.from(new Set([...extractHashtags(caption), ...extractHashtags(firstComment)]));
  const hashtags = own.length ? own : FALLBACK_HASHTAGS;
  const usingFallbackTags = own.length === 0;
  const reelText = reelToText(reel);

  return (
    <>
      <div className="header fl-reveal">
        <h1>Deploy to Instagram</h1>
        <p className="header-sub">
          Instagram&apos;s API can&apos;t save drafts or attach catalog music, so this is the manual handoff.
          Download the slides, copy the caption, then finish in the IG app (that&apos;s where you add a sound).
        </p>
      </div>

      <div className="main fl-reveal">
        {/* Top bar — back + meta + download all */}
        <div
          className="card"
          style={{
            padding: 18,
            marginBottom: 16,
            display: "flex",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <Link
              href="/content/social"
              style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", textDecoration: "none", letterSpacing: "0.08em" }}
            >
              ← back to posts
            </Link>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 }}>
              {typeLabel}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
              {slideCount} {slideCount === 1 ? "slide" : "slides"}{isCarousel ? " · carousel" : ""}
            </div>
          </div>
          <a
            href={`/api/social/export/${postId}`}
            download
            style={{
              padding: "12px 22px",
              background: "var(--accent)",
              color: "#15100e",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--mono)",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            ↓ Download all (.zip)
          </a>
        </div>

        {topic && (
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 14 }}>
            <strong>Topic:</strong> {topic}
          </div>
        )}

        {/* Slides grid — each downloadable on its own */}
        <div className="section-header">
          <div className="section-label">slides — download each, in order</div>
          <span className="log-count">{slideCount}</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {Array.from({ length: slideCount }, (_, i) => (
            <div
              key={i}
              className="card"
              style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div style={{ position: "relative", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)", aspectRatio: "1 / 1" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slideRenderUrl(postId, i, 540)}
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
                  {i + 1}/{slideCount}
                </div>
              </div>
              <a
                href={slideRenderUrl(postId, i, 1080)}
                download={`prometheus-slide-${String(i + 1).padStart(2, "0")}.png`}
                className="act-btn"
                style={{ textAlign: "center", textDecoration: "none", fontSize: 12 }}
              >
                ↓ Slide {i + 1}
              </a>
            </div>
          ))}
        </div>

        {/* Copy blocks */}
        <div className="section-header">
          <div className="section-label">caption + copy</div>
        </div>
        <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
          <CopyCard title="Caption" text={captionBody} />
          <CopyCard
            title={usingFallbackTags ? "Hashtags (suggested — none in caption)" : "Hashtags"}
            text={hashtags.join(" ")}
            mono
          />
          {firstComment && (
            <CopyCard
              title="First comment — post as your own reply (link goes here, not in the caption)"
              text={firstComment}
            />
          )}
          {reelText && <CopyCard title={`Reel script · ${reel?.duration || ""}`} text={reelText} mono />}
        </div>

        {/* Finish-in-IG steps */}
        <div
          className="card"
          style={{
            padding: 18,
            background: "rgba(242,138,47,0.06)",
            border: "1px solid rgba(255,138,47,0.22)",
          }}
        >
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 10, fontWeight: 700 }}>
            // finish in the Instagram app
          </div>
          <ol style={{ margin: 0, paddingLeft: 22, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li>Download the slides above (one zip, or one at a time — order matters for a carousel).</li>
            <li>In Instagram, create a new post and add the slides in order.</li>
            <li>Paste the caption. If you want a trending sound, add it here — this is the only place catalog music works.</li>
            <li>Publish (or save as a draft in-app).</li>
            <li>Immediately post the first comment as your own reply — that&apos;s where the link lives, since IG buries captions with links.</li>
          </ol>
        </div>
      </div>
    </>
  );
}

function CopyCard({ title, text, mono }: { title: string; text: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — ignore, text is selectable in the box below
    }
  }
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
          {title}
        </div>
        <button
          type="button"
          onClick={copy}
          style={{
            background: "transparent",
            border: `1px solid ${copied ? "var(--accent)" : "var(--border)"}`,
            color: copied ? "var(--accent)" : "var(--text-secondary)",
            padding: "4px 12px",
            fontSize: 10,
            fontFamily: "var(--mono)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
            borderRadius: 3,
            whiteSpace: "nowrap",
          }}
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <pre
        style={{
          fontFamily: mono ? "var(--mono)" : "'Inter', sans-serif",
          fontSize: mono ? 12 : 13,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          color: "var(--text)",
          margin: 0,
          maxHeight: 260,
          overflow: "auto",
        }}
      >
        {text}
      </pre>
    </div>
  );
}
