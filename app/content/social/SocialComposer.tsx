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

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { POST_TYPES, type PostKind } from "@/lib/social/post-types";
import { FORGE_IMAGES } from "@/lib/social/forge-images";

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

type Step = 1 | 2 | 3 | 4 | 5;

export function SocialComposer({ rows }: { rows: SocialRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Wizard state
  const [step, setStep] = useState<Step>(1);
  const [kind, setKind] = useState<PostKind | null>(null);
  const [postType, setPostType] = useState<string | null>(null);
  const [imageSlug, setImageSlug] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [focalX, setFocalX] = useState<number>(50);
  const [focalY, setFocalY] = useState<number>(50);
  const [overlay, setOverlay] = useState<"subtle" | "strong" | "fade-bottom" | "wordmark" | "none">("subtle");
  const [topic, setTopic] = useState("");

  // Async state
  const [drafting, setDrafting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [draftedId, setDraftedId] = useState<string | null>(null);

  function flashFor(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 5000);
  }

  function resetWizard() {
    setStep(1);
    setKind(null);
    setPostType(null);
    setImageSlug(null);
    setCustomImageUrl(null);
    setFocalX(50);
    setFocalY(50);
    setOverlay("subtle");
    setTopic("");
    setDraftedId(null);
  }

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
          image_url: activeImageUrl || undefined,
          focal_x: activeImageUrl ? focalX : undefined,
          focal_y: activeImageUrl ? focalY : undefined,
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
      setStep(5);
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
          <div className="stat-delta"><a href="/forge/index.html" target="_blank" rel="noreferrer">Open Forge ↗</a></div>
        </div>
      </div>

      {/* Wizard */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <StepHeader step={step} setStep={setStep} kind={kind} postType={postType} imageSlug={imageSlug} draftedId={draftedId} />

        {step === 1 && (
          <Step1Kind
            kind={kind}
            onPick={(k) => {
              setKind(k);
              setPostType(null);
              setStep(2);
            }}
          />
        )}

        {step === 2 && kind && (
          <Step2PostType
            kind={kind}
            postType={postType}
            options={eligibleTypes}
            onPick={(slug) => {
              setPostType(slug);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step3Image
            imageSlug={imageSlug}
            customImageUrl={customImageUrl}
            focalX={focalX}
            focalY={focalY}
            overlay={overlay}
            setImageSlug={(slug) => {
              setImageSlug(slug);
              setCustomImageUrl(null);
              // Reset focal to image's hint if defined
              const hint = FORGE_IMAGES.find((f) => f.slug === slug)?.focalHint;
              if (hint) {
                setFocalX(Math.round(hint.x * 100));
                setFocalY(Math.round(hint.y * 100));
              }
            }}
            setCustomImageUrl={(url) => {
              setCustomImageUrl(url);
              setImageSlug(null);
            }}
            setFocalX={setFocalX}
            setFocalY={setFocalY}
            setOverlay={setOverlay}
            onNext={() => setStep(4)}
            onSkip={() => {
              setImageSlug(null);
              setCustomImageUrl(null);
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && selectedDef && (
          <Step4Copy
            def={selectedDef}
            topic={topic}
            setTopic={setTopic}
            selectedImageName={selectedImage?.name || null}
            drafting={drafting}
            onDraft={onDraft}
            onBack={() => setStep(3)}
          />
        )}

        {step === 5 && draftedId && (
          <Step5Review
            row={rows.find((r) => r.id === draftedId)}
            busy={busyId === draftedId}
            pending={pending}
            onPublish={() => onPublish(draftedId)}
            onDiscard={() => onDiscard(draftedId)}
            onStartOver={resetWizard}
          />
        )}
      </div>

      {flash && <div className="inbox-flash">{flash}</div>}

      {/* Pending drafts (other than the one we just made) */}
      {drafts.length > 0 && drafts.some((r) => r.id !== draftedId) && (
        <>
          <div className="section-header" style={{ marginTop: 24 }}>
            <div className="section-label">Other drafts</div>
            <span className="log-count">{drafts.filter((r) => r.id !== draftedId).length}</span>
          </div>
          {drafts
            .filter((r) => r.id !== draftedId)
            .map((r) => (
              <PostCard key={r.id} row={r} onPublish={onPublish} onDiscard={onDiscard} busyId={busyId} pending={pending} />
            ))}
        </>
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
  kind,
  postType,
  imageSlug,
  draftedId,
}: {
  step: Step;
  setStep: (s: Step) => void;
  kind: PostKind | null;
  postType: string | null;
  imageSlug: string | null;
  draftedId: string | null;
}) {
  const steps = [
    { n: 1, label: "Post Type", done: !!kind, value: kind ? kind : "—" },
    { n: 2, label: "Customize", done: !!postType, value: postType || "—" },
    {
      n: 3,
      label: "Image",
      done: imageSlug !== null || step > 3,
      value: imageSlug || (step > 3 ? "typographic" : "—"),
    },
    { n: 4, label: "Build Copy", done: !!draftedId, value: draftedId ? "drafted" : "—" },
    { n: 5, label: "Review", done: false, value: draftedId ? "ready" : "—" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
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
              flex: "1 1 140px",
              minWidth: 130,
              textAlign: "left",
              padding: "10px 12px",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              background: active ? "rgba(242,138,47,0.08)" : "transparent",
              color: reachable ? "var(--text)" : "var(--text-tertiary)",
              cursor: reachable ? "pointer" : "not-allowed",
              borderRadius: "var(--radius-sm)",
              fontFamily: "inherit",
            }}
          >
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
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
// Step 1 — single vs carousel
// ─────────────────────────────────────────────────────────────────────────
function Step1Kind({ kind, onPick }: { kind: PostKind | null; onPick: (k: PostKind) => void }) {
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 12 }}>Step 1 · Post type</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {(["single", "carousel"] as PostKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onPick(k)}
            style={{
              textAlign: "left",
              padding: 20,
              background: kind === k ? "rgba(242,138,47,0.08)" : "transparent",
              border: `1px solid ${kind === k ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--text)",
              fontFamily: "inherit",
            }}
          >
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              {k === "single" ? "// single" : "// carousel"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
              {k === "single" ? "Single image post" : "Multi-slide carousel"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>
              {k === "single"
                ? "One typography-led slide. Use for declarations, hot takes, reframes, founder lens."
                : "6-8 slides: hook + plays + CTA + signoff. Use for role guides, quick wins, diagnostics, behind-the-build, compliance plays."}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 2 — pick the specific post type from the registry
// ─────────────────────────────────────────────────────────────────────────
function Step2PostType({
  kind,
  postType,
  options,
  onPick,
  onBack,
}: {
  kind: PostKind;
  postType: string | null;
  options: typeof POST_TYPES;
  onPick: (slug: string) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 12 }}>
        Step 2 · Customize ({kind})
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {options.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => onPick(p.slug)}
            style={{
              textAlign: "left",
              padding: 16,
              background: postType === p.slug ? "rgba(242,138,47,0.08)" : "transparent",
              border: `1px solid ${postType === p.slug ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--text)",
              fontFamily: "inherit",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{p.label}</div>
              <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-tertiary)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                {p.kind === "carousel" ? `${p.slideCount} slides` : "single"}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4, fontFamily: "var(--mono)" }}>
              {p.pillar}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.45 }}>
              {p.description}
            </div>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="act-btn" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 3 — pick a forge background, set focal point, choose overlay
// ─────────────────────────────────────────────────────────────────────────
function Step3Image({
  imageSlug,
  customImageUrl,
  focalX,
  focalY,
  overlay,
  setImageSlug,
  setCustomImageUrl,
  setFocalX,
  setFocalY,
  setOverlay,
  onNext,
  onSkip,
  onBack,
}: {
  imageSlug: string | null;
  customImageUrl: string | null;
  focalX: number;
  focalY: number;
  overlay: "subtle" | "strong" | "fade-bottom" | "wordmark" | "none";
  setImageSlug: (slug: string) => void;
  setCustomImageUrl: (url: string | null) => void;
  setFocalX: (n: number) => void;
  setFocalY: (n: number) => void;
  setOverlay: (o: "subtle" | "strong" | "fade-bottom" | "wordmark" | "none") => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const activeImageUrl = customImageUrl || (imageSlug ? FORGE_IMAGES.find((f) => f.slug === imageSlug)?.url : null);
  const hasImage = !!activeImageUrl;

  // Live preview URL — rebuilds on every state change. Cheap since the renderer caches by params.
  const previewUrl = useMemo(() => {
    if (!activeImageUrl) return null;
    const p = new URLSearchParams({
      composition: "declaration",
      headline: "your headline lives here",
      emphasize: "here",
      imageUrl: activeImageUrl,
      focalX: String(focalX),
      focalY: String(focalY),
      overlay,
      size: "540",
    });
    return `/api/social/render?${p}`;
  }, [activeImageUrl, focalX, focalY, overlay]);

  return (
    <div>
      <div className="section-label" style={{ marginBottom: 12 }}>
        Step 3 · Image (background)
      </div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 12 }}>
        Pick a forge background for the hero slide. Slide the focal points to frame the subject. Choose an overlay treatment. Or skip for pure-typographic.
        Need wider control (cropping, panels, batch)? Open the <a href="/forge/index.html" target="_blank" rel="noreferrer">Image Forge ↗</a>.
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
      {hasImage && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 16,
            padding: 12,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {/* Live preview */}
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
              // live preview
            </div>
            <div style={{ position: "relative", borderRadius: "var(--radius-sm)", overflow: "hidden", aspectRatio: "1 / 1", border: "1px solid var(--border)" }}>
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                // focal point — horizontal {focalX}%
              </div>
              <input type="range" min={0} max={100} value={focalX} onChange={(e) => setFocalX(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                // focal point — vertical {focalY}%
              </div>
              <input type="range" min={0} max={100} value={focalY} onChange={(e) => setFocalY(Number(e.target.value))} style={{ width: "100%" }} />
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

            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                // overlay — readability layer
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
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" className="act-btn" onClick={onBack}>← Back</button>
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
// Step 4 — topic input + draft
// ─────────────────────────────────────────────────────────────────────────
function Step4Copy({
  def,
  topic,
  setTopic,
  selectedImageName,
  drafting,
  onDraft,
  onBack,
}: {
  def: (typeof POST_TYPES)[number];
  topic: string;
  setTopic: (s: string) => void;
  selectedImageName: string | null;
  drafting: boolean;
  onDraft: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 12 }}>
        Step 4 · Build copy
      </div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 12 }}>
        Type: <strong style={{ color: "var(--text)" }}>{def.label}</strong> · {def.kind === "carousel" ? `${def.slideCount} slides` : "single"} · Image: <strong style={{ color: "var(--text)" }}>{selectedImageName || "typographic"}</strong>
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
          marginBottom: 12,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <button type="button" className="act-btn" onClick={onBack} disabled={drafting}>← Back</button>
        <button
          type="button"
          className="act-btn act-btn-primary"
          onClick={onDraft}
          disabled={drafting || !topic.trim()}
        >
          {drafting ? "Drafting…" : "Generate copy →"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 5 — review + push
// ─────────────────────────────────────────────────────────────────────────
function Step5Review({
  row,
  busy,
  pending,
  onPublish,
  onDiscard,
  onStartOver,
}: {
  row: SocialRow | undefined;
  busy: boolean;
  pending: boolean;
  onPublish: () => void;
  onDiscard: () => void;
  onStartOver: () => void;
}) {
  if (!row) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
        Loading drafted post… If this hangs, click any earlier step in the header to recover.
      </div>
    );
  }
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 12 }}>
        Step 5 · Review and ship
      </div>
      <PostCard
        row={row}
        onPublish={onPublish}
        onDiscard={onDiscard}
        busyId={busy ? row.id : null}
        pending={pending}
        embedded
      />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" className="act-btn" onClick={onStartOver}>
          ← Start over
        </button>
      </div>
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
}: {
  row: SocialRow;
  onPublish: (id: string) => void;
  onDiscard: (id: string) => void;
  busyId: string | null;
  pending: boolean;
  compact?: boolean;
  embedded?: boolean;
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
