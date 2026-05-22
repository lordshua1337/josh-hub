"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type CampaignDetailRow = {
  id: string;
  slug: string;
  name: string;
  theme: string | null;
  pitch: string | null;
  status: string;
  brand: string;
  cadence: string | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignPostRow = {
  id: string;
  brand: string;
  post_type: string;
  composition: string;
  topic: string | null;
  status: string;
  platform: string;
  scheduled_for: string | null;
  posted_at: string | null;
  copy_blocks: {
    is_carousel?: boolean;
    slides?: { headline?: string; title?: string }[];
    caption?: string;
  } | null;
  campaign_order: number | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  draft: { fg: "#a39888", bg: "rgba(163,152,136,0.16)" },
  scheduled: { fg: "#60a5fa", bg: "rgba(96,165,250,0.16)" },
  queued_for_ig: { fg: "#fbbf24", bg: "rgba(251,191,36,0.16)" },
  draft_pushed: { fg: "#34d399", bg: "rgba(52,211,153,0.16)" },
  posted: { fg: "#34d399", bg: "rgba(52,211,153,0.16)" },
};

function postTitle(r: CampaignPostRow): string {
  const heroHeadline = r.copy_blocks?.slides?.[0]?.headline || r.copy_blocks?.slides?.[0]?.title;
  return heroHeadline || r.topic || r.post_type.replace(/_/g, " ");
}

function thumbUrl(postId: string): string {
  const p = new URLSearchParams({ postId, slide: "0", size: "540" });
  return `/api/social/render?${p.toString()}`;
}

export function CampaignDetail({
  campaign,
  posts,
  postTypes,
}: {
  campaign: CampaignDetailRow;
  posts: CampaignPostRow[];
  postTypes: { slug: string; label: string; kind: "single" | "carousel"; slideCount?: number }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drafting, setDrafting] = useState(false);
  const [postType, setPostType] = useState<string>(postTypes[0]?.slug || "");
  const [topicsText, setTopicsText] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [editingTheme, setEditingTheme] = useState(campaign.theme || "");
  const [editingPitch, setEditingPitch] = useState(campaign.pitch || "");
  const [editingName, setEditingName] = useState(campaign.name);

  function flashFor(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 4000);
  }

  async function patchCampaign(body: Record<string, unknown>) {
    const res = await fetch(`/api/campaigns/${campaign.slug}`, {
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
  }

  async function onDraftBatch() {
    const topics = topicsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3);
    if (topics.length === 0) {
      flashFor("Add at least one topic (one per line).");
      return;
    }
    if (topics.length > 10) {
      flashFor("Max 10 topics per batch. Trim the list.");
      return;
    }
    if (!postType) return;
    setDrafting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.slug}/draft-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, post_type: postType }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        created?: { id: string; topic: string }[];
        errors?: { topic: string; error: string }[];
        error?: string;
      };
      if (!res.ok || !json.ok) {
        flashFor(`Batch failed: ${json.error}`);
        return;
      }
      const okCount = json.created?.length ?? 0;
      const failCount = json.errors?.length ?? 0;
      flashFor(`Drafted ${okCount}/${topics.length}${failCount ? ` · ${failCount} failed` : ""}`);
      setTopicsText("");
      startTransition(() => router.refresh());
    } catch (e) {
      flashFor(`Batch failed: ${(e as Error).message}`);
    } finally {
      setDrafting(false);
    }
  }

  const topicLines = topicsText.split(/\r?\n/).filter((s) => s.trim().length >= 3).length;

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">campaign</p>
        <input
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onBlur={() => {
            if (editingName.trim() && editingName !== campaign.name) patchCampaign({ name: editingName.trim() });
          }}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid transparent",
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: "var(--text)",
            fontFamily: "inherit",
            padding: 0,
            marginBottom: 8,
          }}
        />
        <p className="header-sub">
          <span style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>{campaign.status}</span> ·{" "}
          {posts.length} {posts.length === 1 ? "post" : "posts"} attached · cadence: {campaign.cadence || "—"}
        </p>
        <div style={{ marginTop: 14 }}>
          <Link href="/content/campaigns" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-tertiary)", textDecoration: "none", letterSpacing: "0.08em" }}>
            ← all campaigns
          </Link>
        </div>
      </div>
      <div className="main">
        {flash && <div className="inbox-flash">{flash}</div>}

        {/* Theme + pitch */}
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>brief</div>
          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
              // theme (one line)
            </div>
            <input
              value={editingTheme}
              onChange={(e) => setEditingTheme(e.target.value)}
              onBlur={() => {
                if (editingTheme !== (campaign.theme || "")) patchCampaign({ theme: editingTheme });
              }}
              placeholder="e.g. Compliance GTM for regulated industries"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "block" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
              // pitch (what's the story this campaign tells, across all posts)
            </div>
            <textarea
              value={editingPitch}
              onChange={(e) => setEditingPitch(e.target.value)}
              onBlur={() => {
                if (editingPitch !== (campaign.pitch || "")) patchCampaign({ pitch: editingPitch });
              }}
              placeholder="What's the bet? What does the reader come away with?"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            />
          </label>

          {/* Status pills */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
              // status
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["planning", "active", "paused", "shipped", "archived"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => patchCampaign({ status: s })}
                  disabled={campaign.status === s}
                  style={{
                    padding: "5px 11px",
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    background: campaign.status === s ? "rgba(255,138,47,0.14)" : "transparent",
                    border: `1px solid ${campaign.status === s ? "var(--accent)" : "var(--border)"}`,
                    color: campaign.status === s ? "var(--accent)" : "var(--text-secondary)",
                    borderRadius: 3,
                    cursor: campaign.status === s ? "default" : "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Batch drafter */}
        <div className="card" style={{ padding: 18, marginBottom: 16, background: "rgba(255,138,47,0.04)", border: "1px solid rgba(255,138,47,0.20)" }}>
          <div className="section-label" style={{ marginBottom: 10 }}>batch-draft posts</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
            One topic per line (max 10). Each one runs through the Post Engine and lands as a draft tagged to this campaign.
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
                // post type — applies to every topic in this batch
              </div>
              <select value={postType} onChange={(e) => setPostType(e.target.value)} style={inputStyle}>
                {postTypes.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.kind === "carousel" ? "▦ " : "• "}
                    {t.label}
                    {t.slideCount ? ` (${t.slideCount} slides)` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
                // topics — one per line
              </div>
              <textarea
                value={topicsText}
                onChange={(e) => setTopicsText(e.target.value)}
                placeholder={`HIPAA-compliant AI workflows for hospital ops\nFedRAMP gates: what AI vendors must clear before federal pilots\nWhy compliance teams are the new growth team\n…`}
                rows={6}
                style={{ ...inputStyle, fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.6, resize: "vertical" }}
              />
              <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--mono)", marginTop: 4 }}>
                {topicLines}/10 topics · drafts run in series (~10-30s each)
              </div>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              type="button"
              onClick={onDraftBatch}
              disabled={drafting || topicLines === 0 || topicLines > 10}
              className="act-btn act-btn-primary"
            >
              {drafting ? `Drafting… (this can take a minute)` : `Draft ${topicLines || "—"} posts →`}
            </button>
          </div>
        </div>

        {/* Attached posts */}
        <div className="section-header" style={{ marginBottom: 10 }}>
          <div className="section-label">posts in this campaign</div>
          <span className="log-count">{posts.length} attached</span>
        </div>

        {posts.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
            No posts yet. Use the batch drafter above to generate the whole series at once.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {posts.map((p, idx) => (
              <Link
                key={p.id}
                href="/content/social"
                className="card"
                style={{ padding: 0, overflow: "hidden", textDecoration: "none", color: "var(--text)" }}
              >
                <div style={{ aspectRatio: "1 / 1", background: "var(--bg)", position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl(p.id)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 3,
                      letterSpacing: "0.08em",
                    }}
                  >
                    #{p.campaign_order ?? idx + 1}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: STATUS_COLORS[p.status]?.bg || "rgba(0,0,0,0.5)",
                      color: STATUS_COLORS[p.status]?.fg || "#fff",
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 3,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {p.status.replace(/_/g, " ")}
                  </div>
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--accent)", letterSpacing: "0.08em", marginBottom: 4 }}>
                    {p.post_type.replace(/_/g, " ")}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                    {postTitle(p).slice(0, 80)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pending && <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 10 }}>refreshing…</div>}
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 3,
  color: "var(--text)",
  fontFamily: "inherit",
  fontSize: 13,
};
