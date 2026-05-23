"use client";

// 5-step composer wizard:
//   1. Post Type      single vs carousel
//   2. Customize      pick specific post type from registry
//   3. Image          pick a forge background or skip (typographic only)
//   4. Build Copy     topic input + draft via Haiku
//   5. Review         preview slides, surface caption / first_comment / reel_script,
//                     push to IG drafts when ready.
//
// State lives entirely client-side until step 4 hits /api/social/draft. Every
// step has a Back button so Josh can tweak earlier choices before committing.

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { POST_TYPES, type PostKind } from "@/lib/social/post-types";
import { FORGE_IMAGES } from "@/lib/social/forge-images";
import { CAROUSEL_CONFIG, clampSlideCount } from "@/lib/social/arc-spec";

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
      imageUrl?: string;
    }[];
    caption?: string;
    first_comment?: string;
    reel_script?: {
      duration: string;
      beats: { t: string; label: string; script: string }[];
    };
  } | null;
  image_url: string | null;
  metadata: {
    first_comment?: string;
    reel_script?: {
      duration: string;
      beats: { t: string; label: string; script: string }[];
    };
  } | null;
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

// 3-step wizard, image-first:
//   1. Image     pick a forge background, customize focal/overlay
//   2. Compose   kind toggle + post-type pick + topic input (all one screen)
//   3. Generate  render, surface caption + first_comment + reel script with
//                a regenerate button, push to IG drafts when ready
type Step = 1 | 2 | 3;

export function SocialComposer({ rows }: { rows: SocialRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Wizard is closed by default — landing view shows drafts + a big start CTA.
  // Opens when Josh clicks "+ New Post" or "Edit a draft".
  const [wizardOpen, setWizardOpen] = useState(false);

  // Wizard state
  const [step, setStep] = useState<Step>(1);
  const [kind, setKind] = useState<PostKind | null>(null);
  const [postType, setPostType] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState<number | null>(null);
  const [imageSlug, setImageSlug] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [focalX, setFocalX] = useState<number>(50);
  const [focalY, setFocalY] = useState<number>(50);
  const [zoom, setZoom] = useState<number>(1);
  const [overlay, setOverlay] = useState<"subtle" | "strong" | "fade-bottom" | "wordmark" | "none">("subtle");
  const [topic, setTopic] = useState("");

  // Async state
  const [drafting, setDrafting] = useState(false);
  const [regenning, setRegenning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [draftedId, setDraftedId] = useState<string | null>(null);

  // Ideation state — suggested topics chips in Step 2.
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<{ title: string; topic: string }[]>([]);

  function flashFor(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 5000);
  }

  function resetWizard() {
    setStep(1);
    setKind(null);
    setPostType(null);
    setSlideCount(null);
    setImageSlug(null);
    setCustomImageUrl(null);
    setFocalX(50);
    setFocalY(50);
    setZoom(1);
    setOverlay("subtle");
    setTopic("");
    setDraftedId(null);
  }

  function openWizard() {
    resetWizard();
    setWizardOpen(true);
  }

  // Listen for forge round-trip postMessage. When Josh hits "Use in wizard"
  // from the Image Forge, we get the public URL back here and auto-fill it
  // into step 3 so he doesn't have to copy-paste anything.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; url?: string };
      if (data?.type === "forge:image-ready" && data.url) {
        setCustomImageUrl(data.url);
        setImageSlug(null);
        setWizardOpen(true);
        setStep(1);
        setFlash("Forge image attached — review and continue.");
        setTimeout(() => setFlash(null), 4000);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const eligibleTypes = useMemo(
    () => (kind ? POST_TYPES.filter((p) => p.kind === kind) : []),
    [kind]
  );
  const selectedDef = postType ? POST_TYPES.find((p) => p.slug === postType) : null;
  const selectedImage = imageSlug ? FORGE_IMAGES.find((f) => f.slug === imageSlug) : null;
  const activeImageUrl = customImageUrl || selectedImage?.url || null;

  async function onDraft() {
    if (!postType || !topic.trim()) return;
    setDrafting(true);
    try {
      const res = await fetch("/api/social/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "prometheus",
          post_type: postType,
          topic,
          slide_count: slideCount ?? undefined,
          image_url: activeImageUrl || undefined,
          focal_x: activeImageUrl ? focalX : undefined,
          focal_y: activeImageUrl ? focalY : undefined,
          focal_zoom: activeImageUrl ? zoom : undefined,
          overlay: activeImageUrl ? overlay : undefined,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok || !json.id) {
        flashFor(`Draft failed: ${json.error}`);
        return;
      }
      flashFor("Drafted");
      setDraftedId(json.id);
      setStep(3);
      startTransition(() => router.refresh());
    } catch (e) {
      flashFor(`Draft failed: ${(e as Error).message}`);
    } finally {
      setDrafting(false);
    }
  }

  async function onSuggestTopics() {
    if (!postType) {
      flashFor("Pick a post type first.");
      return;
    }
    setSuggesting(true);
    try {
      const res = await fetch("/api/social/suggest-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_type: postType, brand: "prometheus", count: 5 }),
      });
      const json = (await res.json()) as { ok?: boolean; topics?: { title: string; topic: string }[]; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Suggest failed: ${json.error}`);
        return;
      }
      setSuggestions(json.topics || []);
    } catch (e) {
      flashFor(`Suggest failed: ${(e as Error).message}`);
    } finally {
      setSuggesting(false);
    }
  }

  async function onRegenCaption() {
    if (!draftedId) return;
    setRegenning(true);
    try {
      const res = await fetch(`/api/social/regen-caption/${draftedId}`, { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Regen failed: ${json.error}`);
        return;
      }
      flashFor("Caption regenerated.");
      startTransition(() => router.refresh());
    } catch (e) {
      flashFor(`Regen failed: ${(e as Error).message}`);
    } finally {
      setRegenning(false);
    }
  }

  async function onPublish(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/social/publish/${id}`, { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; queued?: boolean; error?: string };
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
      await fetch(`/api/social/discard/${id}`, { method: "POST" }).catch(() => undefined);
      flashFor("Discarded");
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
      {/* Hero CTA — the obvious "start here" affordance when the wizard's closed. */}
      {!wizardOpen && (
        <div
          className="card"
          style={{
            padding: 28,
            marginBottom: 18,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 20,
            alignItems: "center",
            background: "linear-gradient(90deg, rgba(255,138,47,0.10) 0%, rgba(255,138,47,0.02) 60%, transparent 100%)",
            border: "1px solid rgba(255,138,47,0.25)",
          }}
        >
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>start a new post</div>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 6 }}>
              What are you shipping today?
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Single declaration, carousel, or panorama. Pick a forge background or go pure typographic. Voice-aligned copy and ready-to-post package every time.
            </div>
          </div>
          <button
            type="button"
            onClick={openWizard}
            style={{
              padding: "14px 28px",
              background: "var(--accent)",
              color: "#15100e",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--mono)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            + New Post
          </button>
        </div>
      )}

      {/* Stats — small bar, always visible */}
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
          <div className="stat-delta">{POST_TYPES.filter((p) => p.kind === "single").length} singles · {POST_TYPES.filter((p) => p.kind === "carousel").length} carousels</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Forge images</div>
          <div className="stat-num">{FORGE_IMAGES.length}</div>
          <div className="stat-delta">
            <a href="/forge/index.html" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
              Open Forge ↗
            </a>
          </div>
        </div>
      </div>

      {/* Wizard — only when open */}
      {wizardOpen && (
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-label">new post wizard</div>
          <button
            type="button"
            onClick={() => setWizardOpen(false)}
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            close ✕
          </button>
        </div>
        <StepHeader step={step} setStep={setStep} imageSlug={imageSlug} customImageUrl={customImageUrl} kind={kind} postType={postType} topic={topic} draftedId={draftedId} />

        {step === 1 && (
          <Step1ImagePick
            imageSlug={imageSlug}
            customImageUrl={customImageUrl}
            focalX={focalX}
            focalY={focalY}
            zoom={zoom}
            overlay={overlay}
            setImageSlug={(slug) => {
              setImageSlug(slug);
              setCustomImageUrl(null);
              const hint = FORGE_IMAGES.find((f) => f.slug === slug)?.focalHint;
              if (hint) {
                setFocalX(Math.round(hint.x * 100));
                setFocalY(Math.round(hint.y * 100));
              }
              setZoom(1);
            }}
            setCustomImageUrl={(url) => {
              setCustomImageUrl(url);
              setImageSlug(null);
            }}
            setFocalX={setFocalX}
            setFocalY={setFocalY}
            setZoom={setZoom}
            setOverlay={setOverlay}
            onNext={() => setStep(2)}
            onSkip={() => {
              setImageSlug(null);
              setCustomImageUrl(null);
              setStep(2);
            }}
            onCancel={() => setWizardOpen(false)}
          />
        )}

        {step === 2 && (
          <Step2Compose
            kind={kind}
            postType={postType}
            slideCount={slideCount}
            topic={topic}
            selectedImageName={selectedImage?.name || (customImageUrl ? "custom upload" : null)}
            options={eligibleTypes}
            allTypes={POST_TYPES}
            drafting={drafting}
            suggesting={suggesting}
            suggestions={suggestions}
            setKind={(k) => {
              setKind(k);
              setPostType(null);
              setSlideCount(null);
              setSuggestions([]);
            }}
            setPostType={(slug) => {
              setPostType(slug);
              // Default the slide count to the type's default (carousel only).
              setSlideCount(CAROUSEL_CONFIG[slug]?.default ?? null);
              setSuggestions([]);
            }}
            setSlideCount={setSlideCount}
            setTopic={setTopic}
            onSuggestTopics={onSuggestTopics}
            onDraft={onDraft}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && draftedId && (
          <Step3Generate
            row={rows.find((r) => r.id === draftedId)}
            busy={busyId === draftedId}
            pending={pending}
            regenning={regenning}
            onPublish={() => onPublish(draftedId)}
            onDiscard={() => onDiscard(draftedId)}
            onRegenCaption={onRegenCaption}
            onStartOver={resetWizard}
            onBackToCompose={() => setStep(2)}
          />
        )}
      </div>
      )}

      {flash && <div className="inbox-flash">{flash}</div>}

      {/* Drafts list — primary home view content */}
      {drafts.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 24 }}>
            <div className="section-label">drafts</div>
            <span className="log-count">{drafts.length} awaiting review</span>
          </div>
          {drafts.map((r) => (
            <PostCard key={r.id} row={r} onPublish={onPublish} onDiscard={onDiscard} busyId={busyId} pending={pending} />
          ))}
        </>
      )}

      {drafts.length === 0 && !wizardOpen && (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
            // no drafts yet
          </div>
          <div style={{ fontSize: 14 }}>
            Click <strong style={{ color: "var(--text)" }}>+ New Post</strong> above to start the wizard.
          </div>
        </div>
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

// ─────────────────────────────────────────────────────────────────────────
// Step header — clickable breadcrumb so Josh can jump back to any step he
// already completed. Future steps stay greyed out.
// ─────────────────────────────────────────────────────────────────────────
function StepHeader({
  step,
  setStep,
  imageSlug,
  customImageUrl,
  kind,
  postType,
  topic,
  draftedId,
}: {
  step: Step;
  setStep: (s: Step) => void;
  imageSlug: string | null;
  customImageUrl: string | null;
  kind: PostKind | null;
  postType: string | null;
  topic: string;
  draftedId: string | null;
}) {
  const imageLabel = customImageUrl
    ? "custom"
    : imageSlug || (step > 1 ? "typographic" : "—");
  const composeLabel = postType
    ? `${postType.replace(/_/g, " ")}${kind ? ` (${kind})` : ""}`
    : kind
    ? `${kind}`
    : "—";
  const steps = [
    { n: 1, label: "Image", done: step > 1, value: imageLabel },
    { n: 2, label: "Compose", done: !!draftedId, value: composeLabel + (topic ? " · topic ✓" : "") },
    { n: 3, label: "Generate", done: false, value: draftedId ? "ready" : "—" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
      {steps.map((s) => {
        const active = step === s.n;
        const reachable = s.n <= step || s.done;
        return (
          <button
            key={s.n}
            type="button"
            onClick={() => {
              if (reachable) setStep(s.n as Step);
            }}
            disabled={!reachable}
            style={{
              flex: "1 1 200px",
              minWidth: 180,
              textAlign: "left",
              padding: "12px 14px",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              background: active ? "rgba(242,138,47,0.10)" : "transparent",
              color: reachable ? "var(--text)" : "var(--text-tertiary)",
              cursor: reachable ? "pointer" : "not-allowed",
              borderRadius: "var(--radius-sm)",
              fontFamily: "inherit",
              borderLeft: active ? "3px solid var(--accent)" : `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: active ? "var(--accent)" : "var(--text-tertiary)" }}>
              0{s.n} · {s.label}
            </div>
            <div style={{ fontSize: 13, marginTop: 4, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.value}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 2 — Compose. Kind toggle + post-type pick + topic input in one screen.
// This is where Josh picks "what's the post" after he's already locked in
// the image in step 1. All controls visible at once, no sub-steps.
// ─────────────────────────────────────────────────────────────────────────
function Step2Compose({
  kind,
  postType,
  slideCount,
  topic,
  selectedImageName,
  options,
  allTypes,
  drafting,
  suggesting,
  suggestions,
  setKind,
  setPostType,
  setSlideCount,
  setTopic,
  onSuggestTopics,
  onDraft,
  onBack,
}: {
  kind: PostKind | null;
  postType: string | null;
  slideCount: number | null;
  topic: string;
  selectedImageName: string | null;
  options: typeof POST_TYPES;
  allTypes: typeof POST_TYPES;
  drafting: boolean;
  suggesting: boolean;
  suggestions: { title: string; topic: string }[];
  setKind: (k: PostKind) => void;
  setPostType: (slug: string) => void;
  setSlideCount: (n: number) => void;
  setTopic: (s: string) => void;
  onSuggestTopics: () => void;
  onDraft: () => void;
  onBack: () => void;
}) {
  const def = postType ? allTypes.find((p) => p.slug === postType) : null;
  // Slide-count control only applies to carousels with a registered range.
  const cfg = postType ? CAROUSEL_CONFIG[postType] : undefined;
  const effectiveCount = cfg ? clampSlideCount(postType!, slideCount ?? cfg.default) : null;
  // Arc preview string for the chosen count.
  const arcPreview = (() => {
    if (!cfg || !effectiveCount) return null;
    if (cfg.bodyMode === "panorama") {
      return `${effectiveCount - 2} panels + CTA + signoff`;
    }
    return `hook + ${effectiveCount - 3} ${cfg.bodyNoun}s + CTA + signoff`;
  })();
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 12 }}>Step 2 · Compose</div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 14 }}>
        Image locked: <strong style={{ color: "var(--text)" }}>{selectedImageName || "typographic only"}</strong>.
        Now choose the format + tell me what it&apos;s about. AI fills the copy.
      </div>

      {/* Kind toggle — single / carousel */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["single", "carousel"] as PostKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            style={{
              flex: 1,
              padding: "10px 14px",
              fontFamily: "var(--mono)",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: kind === k ? "rgba(242,138,47,0.12)" : "transparent",
              border: `1px solid ${kind === k ? "var(--accent)" : "var(--border)"}`,
              color: kind === k ? "var(--ember-050)" : "var(--text-secondary)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            {k === "single" ? "single image" : "multi-slide carousel"}
          </button>
        ))}
      </div>

      {/* Post-type grid — filtered by kind */}
      {kind && (
        <>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
            // post type
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {options.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setPostType(p.slug)}
                style={{
                  textAlign: "left",
                  padding: 12,
                  background: postType === p.slug ? "rgba(242,138,47,0.10)" : "transparent",
                  border: `1px solid ${postType === p.slug ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  color: "var(--text)",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</div>
                  <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-tertiary)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    {p.kind === "carousel" ? `${p.slideCount} slides` : "single"}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 2, fontFamily: "var(--mono)" }}>
                  {p.pillar}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.4 }}>
                  {p.description}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Slide-count selector — carousels only, range from the arc spec */}
      {cfg && effectiveCount && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              // slides
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
              {arcPreview}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Array.from({ length: cfg.max - cfg.min + 1 }, (_, i) => cfg.min + i).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSlideCount(n)}
                style={{
                  width: 44,
                  padding: "8px 0",
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  background: effectiveCount === n ? "rgba(242,138,47,0.14)" : "transparent",
                  border: `1px solid ${effectiveCount === n ? "var(--accent)" : "var(--border)"}`,
                  color: effectiveCount === n ? "var(--ember-050)" : "var(--text-secondary)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topic — only enabled once a post type is picked */}
      {def && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              // topic — what&apos;s the post about
            </div>
            <button
              type="button"
              onClick={onSuggestTopics}
              disabled={suggesting || drafting}
              style={{
                background: "transparent",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                padding: "4px 10px",
                borderRadius: 4,
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: suggesting ? "wait" : "pointer",
              }}
            >
              {suggesting ? "thinking…" : "↻ suggest topics"}
            </button>
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={`Topic for "${def.label}". e.g. ${def.voiceHint.split(".")[0].toLowerCase()}`}
            rows={4}
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
              marginBottom: 8,
            }}
          />
          {/* Suggested topic chips — click to drop into the textarea */}
          {suggestions.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 6 }}>
                Click any suggestion to use it. Edit freely after.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTopic(s.topic)}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      background: "rgba(242,138,47,0.04)",
                      border: "1px solid rgba(255,138,47,0.16)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: "var(--text)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>
                      // {s.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45 }}>
                      {s.topic}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <button type="button" className="act-btn" onClick={onBack} disabled={drafting}>← Back</button>
        <button
          type="button"
          className="act-btn act-btn-primary"
          onClick={onDraft}
          disabled={drafting || !def || !topic.trim()}
        >
          {drafting ? "Generating…" : "Generate post →"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 1 — Image pick. Forge background + focal/overlay tweaks.
// (This is the START of the flow now. Image-first per Josh's redesign.)
// ─────────────────────────────────────────────────────────────────────────
function Step1ImagePick({
  imageSlug,
  customImageUrl,
  focalX,
  focalY,
  zoom,
  overlay,
  setImageSlug,
  setCustomImageUrl,
  setFocalX,
  setFocalY,
  setZoom,
  setOverlay,
  onNext,
  onSkip,
  onCancel,
}: {
  imageSlug: string | null;
  customImageUrl: string | null;
  focalX: number;
  focalY: number;
  zoom: number;
  overlay: "subtle" | "strong" | "fade-bottom" | "wordmark" | "none";
  setImageSlug: (slug: string) => void;
  setCustomImageUrl: (url: string | null) => void;
  setFocalX: (n: number) => void;
  setFocalY: (n: number) => void;
  setZoom: (n: number) => void;
  setOverlay: (o: "subtle" | "strong" | "fade-bottom" | "wordmark" | "none") => void;
  onNext: () => void;
  onSkip: () => void;
  onCancel: () => void;
}) {
  const activeImageUrl = customImageUrl || (imageSlug ? FORGE_IMAGES.find((f) => f.slug === imageSlug)?.url : null);
  const hasImage = !!activeImageUrl;

  // Server-rendered preview — debounced. Only re-fetches when the user
  // stops adjusting for ~500ms. Drag updates the canvas client-side
  // instantly via CSS; this fires for the high-fidelity check on release.
  const [debouncedFocal, setDebouncedFocal] = useState({ x: focalX, y: focalY, z: zoom, o: overlay });
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFocal({ x: focalX, y: focalY, z: zoom, o: overlay }), 500);
    return () => clearTimeout(t);
  }, [focalX, focalY, zoom, overlay]);
  const previewUrl = useMemo(() => {
    if (!activeImageUrl) return null;
    const p = new URLSearchParams({
      composition: "declaration",
      headline: "your headline lives here",
      emphasize: "here",
      imageUrl: activeImageUrl,
      focalX: String(debouncedFocal.x),
      focalY: String(debouncedFocal.y),
      zoom: String(debouncedFocal.z),
      overlay: debouncedFocal.o,
      size: "540",
    });
    return `/api/social/render?${p}`;
  }, [activeImageUrl, debouncedFocal]);

  // ── Drag-to-focus on the live canvas ────────────────────────────────────
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const updateFocalFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      setFocalX(Math.round(x));
      setFocalY(Math.round(y));
    },
    [setFocalX, setFocalY]
  );
  function onCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!hasImage) return;
    e.preventDefault();
    setIsDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateFocalFromEvent(e.clientX, e.clientY);
  }
  function onCanvasPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    updateFocalFromEvent(e.clientX, e.clientY);
  }
  function onCanvasPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }
  // Scroll-wheel zoom (desktop) — Ctrl/Cmd+wheel for quick zoom in/out.
  function onCanvasWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!hasImage) return;
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const next = Math.max(0.5, Math.min(2, zoom + (e.deltaY < 0 ? 0.05 : -0.05)));
    setZoom(Number(next.toFixed(2)));
  }

  // The visible image inside the canvas — applies focal + zoom client-side.
  // scaled width/height: if zoom=2, image is 200% of canvas, cover-fits
  // the larger box, then objectPosition slides to the focal point.
  const scaledPct = Math.round(zoom * 100);
  const canvasImgStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: `${scaledPct}%`,
    height: `${scaledPct}%`,
    objectFit: "cover",
    objectPosition: `${focalX}% ${focalY}%`,
    transform: `translate(${(100 - scaledPct) * (focalX / 100)}%, ${(100 - scaledPct) * (focalY / 100)}%)`,
    pointerEvents: "none",
    userSelect: "none",
  };

  return (
    <div>
      <div className="section-label" style={{ marginBottom: 12 }}>
        Step 1 · Pick your image
      </div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 12 }}>
        Start by picking a forge background for the hero slide. Slide the focal points to frame the subject. Choose an overlay treatment. Or skip and go pure-typographic.
        Need wider control (cropping, panels, batch)? Open the <a href="/forge/index.html?return=wizard" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Image Forge ↗</a> — when you hit &quot;Use in wizard&quot; there, the image comes back here automatically.
      </div>

      {/* Gallery */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 16 }}>
        {FORGE_IMAGES.map((f) => (
          <button
            key={f.slug}
            type="button"
            onClick={() => setImageSlug(f.slug)}
            style={{
              padding: 0,
              border: `2px solid ${imageSlug === f.slug ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              cursor: "pointer",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              textAlign: "left",
              fontFamily: "inherit",
              color: "var(--text)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt={f.name} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            <div style={{ padding: "6px 8px" }}>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{f.name}</div>
              <div style={{ fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>{f.tag}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Custom URL — pasted from the forge round-trip or anywhere */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
          // or paste a custom image URL
        </div>
        <input
          type="text"
          placeholder="https://... (e.g. a render uploaded from the Image Forge)"
          value={customImageUrl || ""}
          onChange={(e) => setCustomImageUrl(e.target.value || null)}
          style={{
            width: "100%",
            padding: "8px 10px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text)",
            fontFamily: "var(--mono)",
            fontSize: 12,
          }}
        />
      </div>

      {/* Customization panel — only shown when an image is selected */}
      {hasImage && activeImageUrl && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 16,
            marginBottom: 16,
            padding: 14,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {/* Interactive canvas — drag the pin to focus. Scroll-wheel + ctrl/cmd to zoom. */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                // drag to focus
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
                {focalX}% · {focalY}% · {zoom.toFixed(2)}x
              </div>
            </div>

            <div
              ref={canvasRef}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerCancel={onCanvasPointerUp}
              onWheel={onCanvasWheel}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                overflow: "hidden",
                background: "#15100e",
                border: `1px solid ${isDragging ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius-sm)",
                cursor: isDragging ? "grabbing" : "crosshair",
                userSelect: "none",
                touchAction: "none",
              }}
            >
              {/* The image at scaled %, positioned by focal */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeImageUrl} alt="" style={canvasImgStyle} draggable={false} />

              {/* Dark readability overlay preview (matches selected overlay variant — only horizontal/bottom modes shown) */}
              {overlay !== "none" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      overlay === "fade-bottom"
                        ? "linear-gradient(180deg, rgba(15,11,9,0) 55%, rgba(15,11,9,0.7) 100%)"
                        : overlay === "strong"
                        ? "linear-gradient(90deg, rgba(15,11,9,0.92), rgba(15,11,9,0.78) 50%, rgba(15,11,9,0.62))"
                        : overlay === "wordmark"
                        ? "linear-gradient(90deg, rgba(15,11,9,0.55), rgba(15,11,9,0.3) 60%, rgba(15,11,9,0.2))"
                        : "linear-gradient(90deg, rgba(15,11,9,0.78), rgba(15,11,9,0.55) 60%, rgba(15,11,9,0.35))",
                  }}
                />
              )}

              {/* Focal pin */}
              <div
                style={{
                  position: "absolute",
                  left: `${focalX}%`,
                  top: `${focalY}%`,
                  width: 26,
                  height: 26,
                  marginLeft: -13,
                  marginTop: -13,
                  borderRadius: "50%",
                  border: "2px solid #15100e",
                  outline: "2px solid var(--accent)",
                  background: "rgba(255,138,47,0.45)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.6)",
                  pointerEvents: "none",
                  transition: isDragging ? "none" : "left 80ms, top 80ms",
                }}
              />

              {/* Tiny instruction footer */}
              <div
                style={{
                  position: "absolute",
                  left: 8,
                  bottom: 8,
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.06em",
                  background: "rgba(0,0,0,0.5)",
                  padding: "2px 6px",
                  borderRadius: 2,
                  pointerEvents: "none",
                }}
              >
                drag to focus · ⌘+scroll to zoom
              </div>
            </div>

            {/* Zoom slider */}
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 4,
                }}
              >
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  // zoom
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0.6, 1, 1.4, 1.8].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZoom(z)}
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 9,
                        padding: "2px 6px",
                        border: `1px solid ${zoom === z ? "var(--accent)" : "var(--border)"}`,
                        background: zoom === z ? "rgba(242,138,47,0.12)" : "transparent",
                        color: zoom === z ? "var(--accent)" : "var(--text-tertiary)",
                        borderRadius: 2,
                        cursor: "pointer",
                      }}
                    >
                      {z}x
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent)" }}
              />
            </div>
          </div>

          {/* Right column — focal presets + overlay buttons + server-rendered actual-output preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                // focal presets
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(
                  [
                    ["text-left", 75, 50],
                    ["subject-right", 25, 50],
                    ["center", 50, 50],
                    ["skyline", 50, 25],
                  ] as [string, number, number][]
                ).map(([label, x, y]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setFocalX(x);
                      setFocalY(y);
                    }}
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--mono)",
                      padding: "4px 8px",
                      border: "1px solid var(--border)",
                      background: focalX === x && focalY === y ? "rgba(242,138,47,0.12)" : "transparent",
                      color: focalX === x && focalY === y ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                      borderRadius: 3,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                // overlay
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(["subtle", "strong", "fade-bottom", "wordmark", "none"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOverlay(o)}
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--mono)",
                      padding: "4px 8px",
                      border: "1px solid var(--border)",
                      background: overlay === o ? "rgba(242,138,47,0.12)" : "transparent",
                      color: overlay === o ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                      borderRadius: 3,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                // rendered hero slide (debounced)
              </div>
              <div
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  aspectRatio: "1 / 1",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                }}
              >
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                )}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-tertiary)", marginTop: 4, fontFamily: "var(--mono)" }}>
                updates 500ms after you stop adjusting
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" className="act-btn" onClick={onCancel}>Cancel</button>
        <div style={{ display: "flex", gap: 8 }}>
          {!hasImage && (
            <button type="button" className="act-btn" onClick={onSkip}>
              Skip image (typographic only) →
            </button>
          )}
          {hasImage && (
            <button type="button" className="act-btn act-btn-primary" onClick={onNext}>
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 3 — Generate & Review. Slides rendered, caption + first_comment +
// reel script shown, each with a regenerate button. Push to IG drafts CTA.
// ─────────────────────────────────────────────────────────────────────────
function Step3Generate({
  row,
  busy,
  pending,
  regenning,
  onPublish,
  onDiscard,
  onRegenCaption,
  onStartOver,
  onBackToCompose,
}: {
  row: SocialRow | undefined;
  busy: boolean;
  pending: boolean;
  regenning: boolean;
  onPublish: () => void;
  onDiscard: () => void;
  onRegenCaption: () => void;
  onStartOver: () => void;
  onBackToCompose: () => void;
}) {
  if (!row) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
        Loading drafted post… If this hangs, click any earlier step in the header to recover.
      </div>
    );
  }
  // Post has already been pushed to IG (or queued if no creds). Show the
  // "next steps in IG" guidance panel at the top so Josh knows what to do.
  const isPushed = row.status === "draft_pushed";
  const isQueued = row.status === "queued_for_ig";
  const firstComment = row.metadata?.first_comment || row.copy_blocks?.first_comment || "";

  return (
    <div>
      <div className="section-label" style={{ marginBottom: 12 }}>
        Step 3 · {isPushed ? "Pushed to IG drafts" : isQueued ? "Queued (no IG creds)" : "Generated post — review and ship"}
      </div>

      {/* Post-publish guidance — shown only after the push lands. */}
      {(isPushed || isQueued) && (
        <PostPublishPanel pushed={isPushed} firstComment={firstComment} />
      )}

      {!isPushed && !isQueued && (
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 14 }}>
          Visuals are locked. Caption + first comment + reel script auto-generated below.
          Don&apos;t love them? Hit <strong style={{ color: "var(--accent)" }}>↻ Regenerate caption</strong> for a different angle. When you&apos;re happy, push to IG drafts.
        </div>
      )}

      <PostCard
        row={row}
        onPublish={onPublish}
        onDiscard={onDiscard}
        busyId={busy ? row.id : null}
        pending={pending}
        embedded
        showRegen={!isPushed && !isQueued}
        regenning={regenning}
        onRegenCaption={onRegenCaption}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "space-between" }}>
        <button type="button" className="act-btn" onClick={onBackToCompose} disabled={regenning}>
          ← Back to compose
        </button>
        <button type="button" className="act-btn" onClick={onStartOver} disabled={regenning}>
          {isPushed || isQueued ? "Start a new post →" : "Start over"}
        </button>
      </div>
    </div>
  );
}

// Post-publish guidance — sits at the top of Step 3 after a push.
// Surfaces the "now do this in IG" steps so Josh has a real handoff.
function PostPublishPanel({ pushed, firstComment }: { pushed: boolean; firstComment: string }) {
  const [copied, setCopied] = useState(false);
  async function copyFirstComment() {
    if (!firstComment) return;
    try {
      await navigator.clipboard.writeText(firstComment);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }
  return (
    <div
      style={{
        marginBottom: 16,
        padding: 18,
        background: pushed ? "rgba(52, 211, 153, 0.06)" : "rgba(245, 158, 11, 0.06)",
        border: `1px solid ${pushed ? "rgba(52, 211, 153, 0.30)" : "rgba(245, 158, 11, 0.30)"}`,
        borderRadius: "var(--radius-sm)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: pushed ? "#34d399" : "#f59e0b",
          marginBottom: 8,
          fontWeight: 700,
        }}
      >
        // {pushed ? "draft live on instagram" : "queued — IG creds not connected"}
      </div>
      <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 14, lineHeight: 1.5 }}>
        {pushed
          ? "Your post is sitting in Instagram drafts. Open the IG app to finish: add music if it's a reel-style post, then publish."
          : "The slide PNGs are baked and ready. When you wire IG_GRAPH_TOKEN + IG_USER_ID in Vercel env, hitting Push again will ship to drafts. For now, manually screenshot the slide URLs from the card below."}
      </div>

      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: pushed ? "#34d399" : "#f59e0b", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
        // next steps
      </div>
      <ol style={{ margin: 0, paddingLeft: 22, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
        <li>Open Instagram → Drafts → find this post</li>
        <li>Add music or effects if you want them (the carousel hook slide reads as a still feed post; the panorama hits harder with music)</li>
        <li>Publish</li>
        <li>Immediately post the first comment below as your own reply (that&apos;s where the link goes — IG penalizes links in the caption itself)</li>
      </ol>

      {firstComment && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              // first comment — paste as your own reply
            </div>
            <button
              type="button"
              onClick={copyFirstComment}
              style={{
                background: "transparent",
                border: `1px solid ${copied ? "var(--accent)" : "var(--border)"}`,
                color: copied ? "var(--accent)" : "var(--text-secondary)",
                padding: "3px 10px",
                fontSize: 10,
                fontFamily: "var(--mono)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: 3,
                cursor: "pointer",
              }}
            >
              {copied ? "✓ copied" : "copy"}
            </button>
          </div>
          <pre
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              color: "var(--text)",
              margin: 0,
              maxHeight: 180,
              overflow: "auto",
            }}
          >
            {firstComment}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PostCard — shared between Step 5 review + the historical lists
// ─────────────────────────────────────────────────────────────────────────
function PostCard({
  row,
  onPublish,
  onDiscard,
  busyId,
  pending,
  compact,
  embedded,
  showRegen,
  regenning,
  onRegenCaption,
}: {
  row: SocialRow;
  onPublish: (id: string) => void;
  onDiscard: (id: string) => void;
  busyId: string | null;
  pending: boolean;
  compact?: boolean;
  embedded?: boolean;
  showRegen?: boolean;
  regenning?: boolean;
  onRegenCaption?: () => void;
}) {
  const [showCopy, setShowCopy] = useState<"caption" | "first_comment" | "reel" | null>(null);
  const isCarousel = !!row.copy_blocks?.is_carousel;
  const slides = row.copy_blocks?.slides ?? [];
  const caption = row.copy_blocks?.caption || "";
  const firstComment = row.metadata?.first_comment || row.copy_blocks?.first_comment || "";
  const reel = row.metadata?.reel_script || row.copy_blocks?.reel_script;
  const pillar = POST_TYPES.find((p) => p.slug === row.post_type)?.label || row.post_type;

  async function copyToClipboard(text: string, kind: "caption" | "first_comment" | "reel") {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopy(kind);
      setTimeout(() => setShowCopy(null), 1400);
    } catch {
      // ignore
    }
  }

  const reelText = reel
    ? `// reel · ${reel.duration}\n\n` + reel.beats.map((b) => `[${b.t}] ${b.label}\n${b.script}`).join("\n\n")
    : "";

  return (
    <div className={embedded ? "" : "card"} style={{ padding: embedded ? 0 : 20, marginBottom: embedded ? 0 : 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <span className="leads-source-pill">{row.brand}</span>
        <span className="booking-pill">{pillar}</span>
        <span className="leads-status leads-status-new">{row.status}</span>
        {isCarousel && <span className="booking-pill">{slides.length} slides</span>}
        {row.image_url && <span className="booking-pill" title={row.image_url}>image</span>}
        <span className="email-time" style={{ marginLeft: "auto" }}>
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      </div>

      {row.topic && (
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 12 }}>
          <strong>Topic:</strong> {row.topic}
        </div>
      )}

      {/* Slide strip */}
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 12,
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

      {/* Caption / first_comment / reel — three columns when there's room */}
      {/* Regenerate toolbar — only in Step 3 review */}
      {showRegen && onRegenCaption && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
            padding: "10px 12px",
            background: "rgba(242,138,47,0.06)",
            border: "1px solid rgba(255,138,47,0.20)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Don&apos;t love the caption? Roll a different angle. Slides stay the same.
          </div>
          <button
            type="button"
            onClick={onRegenCaption}
            disabled={regenning}
            style={{
              background: "transparent",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              padding: "6px 12px",
              borderRadius: 4,
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: regenning ? "wait" : "pointer",
            }}
          >
            {regenning ? "rolling…" : "↻ regenerate caption"}
          </button>
        </div>
      )}

      {(caption || firstComment || reel) && !compact && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: reel ? "1fr 1fr 1fr" : firstComment ? "1fr 1fr" : "1fr",
            gap: 10,
            marginBottom: 12,
          }}
        >
          {caption && (
            <CopyBlock
              title="Caption"
              text={caption}
              onCopy={() => copyToClipboard(caption, "caption")}
              copied={showCopy === "caption"}
            />
          )}
          {firstComment && (
            <CopyBlock
              title="First comment"
              text={firstComment}
              onCopy={() => copyToClipboard(firstComment, "first_comment")}
              copied={showCopy === "first_comment"}
            />
          )}
          {reel && (
            <CopyBlock
              title={`Reel script · ${reel.duration}`}
              text={reelText}
              onCopy={() => copyToClipboard(reelText, "reel")}
              copied={showCopy === "reel"}
              mono
            />
          )}
        </div>
      )}

      {row.error && (
        <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8 }}>Error: {row.error}</div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="act-btn"
          onClick={() => onDiscard(row.id)}
          disabled={busyId === row.id || pending}
        >
          Discard
        </button>
        {row.status === "draft" && (
          <button
            type="button"
            className="act-btn act-btn-primary"
            onClick={() => onPublish(row.id)}
            disabled={busyId === row.id || pending}
          >
            {busyId === row.id
              ? "Pushing…"
              : isCarousel
              ? `Push ${slides.length} slides to IG drafts`
              : "Push to IG drafts"}
          </button>
        )}
      </div>
    </div>
  );
}

function CopyBlock({
  title,
  text,
  onCopy,
  copied,
  mono,
}: {
  title: string;
  text: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
}) {
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {title}
        </div>
        <button
          type="button"
          onClick={onCopy}
          style={{
            background: "transparent",
            border: `1px solid ${copied ? "var(--accent)" : "var(--border)"}`,
            color: copied ? "var(--accent)" : "var(--text-secondary)",
            padding: "3px 8px",
            fontSize: 10,
            fontFamily: "var(--mono)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "pointer",
            borderRadius: 3,
          }}
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <pre
        style={{
          fontFamily: mono ? "var(--mono)" : "'Inter', sans-serif",
          fontSize: mono ? 11 : 12,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          color: "var(--text-secondary)",
          margin: 0,
          maxHeight: 220,
          overflow: "auto",
        }}
      >
        {text}
      </pre>
    </div>
  );
}
