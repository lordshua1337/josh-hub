// arc-spec.ts — the engineered specification system for the social post engine.
//
// Single source of truth for: every carousel's valid slide-count range, the
// narrative arc for any count, each slide's role in that arc, and the HARD
// per-field length limits calibrated to the actual font/container geometry
// (see the calibration renders documented in the plan).
//
// Pure data + pure functions. No LLM, no React. Consumed by:
//   - lib/social/copy.ts (drafter builds its prompt from buildArcPrompt; clamps
//     output with enforceLimits)
//   - the verification script (asserts no field exceeds its cap)

// ── Field limits ────────────────────────────────────────────────────────────

export type FieldLimit = {
  key: string;
  role: string;                 // human description injected into the prompt
  targetWords: [number, number];
  maxWords: number;             // 0 = no word cap (use char cap only)
  maxChars: number;             // HARD overflow guard
  required: boolean;
};

// Canonical limits per field, calibrated from the worst-case renders.
const FL: Record<string, FieldLimit> = {
  hookHeadline: { key: "headline", role: "the opening line that makes someone stop, stated plainly (no hype)", targetWords: [5, 9], maxWords: 11, maxChars: 48, required: true },
  hookSubtitle: { key: "subtitle", role: "the second line that adds the real point under the headline", targetWords: [8, 14], maxWords: 18, maxChars: 95, required: false },
  stepTitle: { key: "title", role: "the action, named in plain words", targetWords: [4, 7], maxWords: 8, maxChars: 38, required: true },
  stepSubtitle: { key: "subtitle", role: "optional one-line clarifier under the title", targetWords: [5, 9], maxWords: 11, maxChars: 60, required: false },
  stepBody: { key: "body", role: "1-2 plain sentences that actually teach it: name one concrete tool and one real number or artifact, and be honest about the tradeoff", targetWords: [18, 30], maxWords: 38, maxChars: 200, required: true },
  ctaCloser: { key: "closer", role: "the closing line that lands the point, calm not salesy", targetWords: [6, 10], maxWords: 12, maxChars: 50, required: true },
  ctaAction: { key: "cta", role: "one clear, low-pressure next step (a question to sit with, or a simple way to reach out)", targetWords: [5, 9], maxWords: 12, maxChars: 50, required: true },
  panelCaption: { key: "caption", role: "one phrase of the panorama sentence", targetWords: [4, 8], maxWords: 9, maxChars: 34, required: true },
};

// ── Per-slide spec ──────────────────────────────────────────────────────────

export type SlideSpec = {
  position: number;             // 1-indexed
  composition: string;
  arcRole: string;              // explicit role this slide plays in the arc
  fields: FieldLimit[];
};

export type BodyMode = "parallel" | "sequential" | "panorama";

export type ArcSpec = {
  postType: string;
  slideCount: number;
  bodyCount: number;
  bodyMode: BodyMode;
  bodyNoun: string;
  arcGoal: string;
  slides: SlideSpec[];
  tokenBudget: number;          // max_tokens for the LLM call
};

// ── Per-type carousel config ──────────────────────────────────────────────────

type CarouselConfig = {
  min: number;
  max: number;
  default: number;
  bodyMode: BodyMode;
  bodyNoun: string;
  arcGoal: string;
};

export const CAROUSEL_CONFIG: Record<string, CarouselConfig> = {
  role_acceleration: { min: 5, max: 8, default: 7, bodyMode: "parallel", bodyNoun: "move", arcGoal: "one specific role's first useful AI moves, most useful first" },
  quick_wins: { min: 5, max: 9, default: 8, bodyMode: "parallel", bodyNoun: "tactic", arcGoal: "independent tactics a team can put in place this week, most useful first" },
  diagnostic: { min: 5, max: 7, default: 6, bodyMode: "parallel", bodyNoun: "question", arcGoal: "honest self-audit questions that surface where a business actually stands, sharpest one last" },
  behind_the_build: { min: 5, max: 7, default: 6, bodyMode: "sequential", bodyNoun: "step", arcGoal: "one real build story told straight: the problem, the approach, the tools, the result" },
  compliance_gtm: { min: 5, max: 7, default: 6, bodyMode: "parallel", bodyNoun: "guardrail", arcGoal: "named-framework guardrails for regulated AI (HIPAA / SOC2 / FedRAMP / FINRA)" },
  panel_panorama: { min: 4, max: 6, default: 5, bodyMode: "panorama", bodyNoun: "panel", arcGoal: "one statement broken into phrases across image panels" },
};

export function carouselConfig(slug: string): CarouselConfig | undefined {
  return CAROUSEL_CONFIG[slug];
}

// Clamp a requested slide count into the post type's valid range.
export function clampSlideCount(slug: string, requested: number | undefined): number {
  const cfg = CAROUSEL_CONFIG[slug];
  if (!cfg) return requested ?? 6;
  if (!requested || isNaN(requested)) return cfg.default;
  return Math.max(cfg.min, Math.min(cfg.max, Math.round(requested)));
}

// ── Arc construction ───────────────────────────────────────────────────────

// Sequential story beats for a given number of body slides (behind_the_build).
function sequentialBeats(n: number): string[] {
  switch (n) {
    case 2:
      return ["The problem — what was bleeding (time / money / trust)", "What we built + the result, with the number"];
    case 3:
      return ["The problem — what was bleeding", "What we built — the approach + the tools", "The result — the number it moved"];
    case 4:
      return ["The problem — what was bleeding", "The approach — the plan in one move", "The tools — what we wired together", "The result — the number it moved"];
    case 5:
      return ["The problem", "Why the obvious fix fails", "The approach we took", "The tools we wired", "The result — the number"];
    default: {
      // Fallback: problem, then n-2 build beats, then result
      const out = ["The problem — what was bleeding"];
      for (let i = 1; i < n - 1; i++) out.push(`Build beat ${i} — a concrete step in the build`);
      out.push("The result — the number it moved");
      return out;
    }
  }
}

function bodyRole(mode: BodyMode, noun: string, k: number, total: number): string {
  if (mode === "panorama") {
    return `Panel ${k} of ${total} — phrase ${k} of a single sentence. Reads continuous when swiped. Do NOT repeat the other panels.`;
  }
  if (mode === "sequential") {
    return `Slide ${k} of ${total} — ${sequentialBeats(total)[k - 1]}.`;
  }
  // parallel
  const rank =
    k === 1
      ? "the most useful one. Put it first so the reader gets something they can act on right away"
      : k === total
        ? "a less obvious one that people tend to overlook"
        : `the ${k === 2 ? "second" : k === 3 ? "third" : k === 4 ? "fourth" : k === 5 ? "fifth" : `${k}th`}-most useful`;
  return `${noun} ${k} of ${total}: ${rank}. A standalone thing the reader can do on their own this week. Must not overlap the other ${noun}s.`;
}

export function buildArc(slug: string, requestedCount?: number): ArcSpec {
  const cfg = CAROUSEL_CONFIG[slug];
  if (!cfg) {
    // Non-registered carousel — degrade gracefully to a 6-slide parallel arc.
    return buildArc("quick_wins", requestedCount);
  }
  const slideCount = clampSlideCount(slug, requestedCount);
  const isPanorama = cfg.bodyMode === "panorama";
  // hook + body + cta + signoff  (panorama: panels + cta + signoff, no hook)
  const bodyCount = isPanorama ? slideCount - 2 : slideCount - 3;

  const slides: SlideSpec[] = [];
  let pos = 1;

  if (!isPanorama) {
    slides.push({
      position: pos++,
      composition: "carousel_hook",
      arcRole: `The opening slide. Open with the real tension or question this topic raises, in plain language. Do not echo the topic verbatim, and do not hype it. Sets up the ${bodyCount} ${cfg.bodyNoun}s that follow.`,
      fields: [FL.hookHeadline, FL.hookSubtitle],
    });
  }

  for (let k = 1; k <= bodyCount; k++) {
    if (isPanorama) {
      slides.push({
        position: pos++,
        composition: "panel_slide",
        arcRole: bodyRole(cfg.bodyMode, cfg.bodyNoun, k, bodyCount),
        fields: [FL.panelCaption],
      });
    } else {
      slides.push({
        position: pos++,
        composition: "numbered_step",
        arcRole: bodyRole(cfg.bodyMode, cfg.bodyNoun, k, bodyCount),
        fields: [FL.stepTitle, FL.stepSubtitle, FL.stepBody],
      });
    }
  }

  slides.push({
    position: pos++,
    composition: "carousel_cta",
    arcRole: `The closing slide. One line that lands the point of the carousel, plus one clear, low-pressure next step. No hype, no rallying cry.`,
    fields: [FL.ctaCloser, FL.ctaAction],
  });

  slides.push({
    position: pos++,
    composition: "signoff",
    arcRole: "SIGNOFF — brand-standard end slide (not LLM-generated).",
    fields: [],
  });

  // Token budget: base + per-body-slide headroom. Heavier carousels get more.
  const tokenBudget = 3800 + bodyCount * 450;

  return {
    postType: slug,
    slideCount,
    bodyCount,
    bodyMode: cfg.bodyMode,
    bodyNoun: cfg.bodyNoun,
    arcGoal: cfg.arcGoal,
    slides,
    tokenBudget,
  };
}

// ── Prompt generation ───────────────────────────────────────────────────────

function fieldLine(f: FieldLimit): string {
  const wordPart =
    f.maxWords > 0
      ? `${f.targetWords[0]}-${f.targetWords[1]} words, HARD MAX ${f.maxWords} words / ${f.maxChars} chars`
      : `HARD MAX ${f.maxChars} chars`;
  const opt = f.required ? "" : " (omit if nothing sharp fits)";
  return `    - ${f.key}: ${f.role}. ${wordPart}.${opt}`;
}

// Build the exact JSON skeleton + per-slide instructions from an arc.
export function buildArcPrompt(arc: ArcSpec, voice: string, topic: string): string {
  const briefedTopic = topic.length > 220 ? topic.slice(0, 220).trim() + "…" : topic;
  const isPanorama = arc.bodyMode === "panorama";

  // Per-slide instruction blocks (skip the signoff — not LLM-authored).
  const blocks = arc.slides
    .filter((s) => s.composition !== "signoff")
    .map((s) => {
      const head = `SLIDE ${s.position}/${arc.slideCount} · ${s.composition} · ROLE: ${s.arcRole}`;
      const fields = s.fields.map(fieldLine).join("\n");
      const emph =
        s.composition === "carousel_hook" || s.composition === "numbered_step"
          ? "\n    - emphasize: ONE word copied verbatim from this slide's headline/title, or omit. Renders ember-gradient."
          : s.composition === "panel_slide"
            ? "\n    - emphasize: ONE word from this panel's caption, or omit."
            : "";
      return `${head}\n${fields}${emph}`;
    })
    .join("\n\n");

  // JSON skeleton matching the drafter's mapping.
  const bodyKey = isPanorama ? "panels" : "body";
  const bodyItem = isPanorama
    ? `{ "caption": "4-8 words", "emphasize": "<one word from caption or omit>" }`
    : `{ "title": "<=8 words", "subtitle": "<optional tagline or omit>", "body": "18-30 words", "emphasize": "<one word from title or omit>" }`;
  const bodyArr = `[ ${Array(arc.bodyCount).fill(bodyItem).join(",\n    ")} ]`;

  const hookBlock = isPanorama
    ? ""
    : `"hook": { "kicker": "${arc.bodyCount} ${arc.bodyNoun}s", "headline": "<=11 words, NOT the topic verbatim", "emphasize": "<one word from headline>", "subtitle": "<the second line, 8-14 words>", "swipeHint": "swipe to start ->" },\n  `;

  const skeleton = `{
  ${hookBlock}"${bodyKey}": ${bodyArr},
  "cta": { "closer": "<=12 words", "emphasize": "<one word from closer or omit>", "cta": "the one action, <=50 chars", "link": "" },
  "caption": "${isPanorama ? "400-700" : "600-800"} chars, short paragraphs, ends with '- Josh' on its own line, NO link",
  "first_comment": "2-3 short lines, includes 'josh@prometheusconsulting.ai' and 'prometheusconsulting.ai'",
  "reel_script": { "duration": "${isPanorama ? "30s" : "45s"}", "beats": [
    { "t": "0:00", "label": "HOOK",   "script": "..." },
    { "t": "0:08", "label": "SETUP",  "script": "..." },
    { "t": "0:22", "label": "PAYOFF", "script": "..." },
    { "t": "0:40", "label": "CTA",    "script": "..." }
  ]}
}`;

  return `${voice}

Write an Instagram ${isPanorama ? "PANORAMA carousel" : "CAROUSEL"} package for Prometheus.
ARC GOAL: ${arc.arcGoal}.
TOTAL SLIDES: ${arc.slideCount} (= ${isPanorama ? `${arc.bodyCount} panels` : `1 hook + ${arc.bodyCount} ${arc.bodyNoun}s`} + CTA + signoff).
TOPIC (distill — do NOT echo verbatim): "${briefedTopic}"

Each slide has a SPECIFIC role and HARD limits. Stay within every cap — text that
exceeds a cap overflows the slide and breaks the post. Two text fields people confuse:
  • "emphasize" = EXACTLY ONE word that appears in that slide's headline/title. Renders ember-gradient. Omit if none pops. NEVER a phrase.
  • "subtitle"  = the multi-word tagline / 2nd-line copy. Multi-word OK.

THE SLIDES:

${blocks}

Return ONLY raw JSON, no prose, no markdown fences:
${skeleton}

GLOBAL RULES:
- ${bodyKey} array MUST have EXACTLY ${arc.bodyCount} items.
- Respect every per-field word/char cap above. When in doubt, write SHORTER.
- No emojis. No em dashes. No "transform / leverage / synergize" corporate slop.
- reel_script: exactly 4 beats, 100-160 words total.`;
}

// ── Output enforcement ─────────────────────────────────────────────────────

// Trim a string to the last whole word that fits under maxChars.
function clampToChars(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
}

// Is `emphasize` a single word that appears verbatim in `haystack`?
function isValidEmphasis(emphasize: string | undefined, haystack: string | undefined): boolean {
  if (!emphasize || !haystack) return false;
  if (/\s/.test(emphasize.trim())) return false; // more than one word
  return haystack.toLowerCase().includes(emphasize.trim().toLowerCase());
}

// A minimal slide shape the enforcer can operate on (matches SlideContent's
// relevant fields without importing it — avoids a circular dep).
export type EnforceableSlide = {
  composition: string;
  headline?: string;
  title?: string;
  body?: string;
  subtitle?: string;
  closer?: string;
  cta?: string;
  trueLine?: string;
  caption?: string;
  stat?: string;
  emphasize?: string;
};

// Enforce hard limits on a slide's text + rescue bad emphasis. Mutates a copy.
export function enforceLimits<T extends EnforceableSlide>(slide: T): T {
  const s: T = { ...slide };

  // Field-specific char caps by composition.
  const caps: Record<string, number> = {};
  if (s.composition === "carousel_hook") {
    caps.headline = FL.hookHeadline.maxChars;
    caps.subtitle = FL.hookSubtitle.maxChars;
  } else if (s.composition === "numbered_step") {
    caps.title = FL.stepTitle.maxChars;
    caps.subtitle = FL.stepSubtitle.maxChars;
    caps.body = FL.stepBody.maxChars;
  } else if (s.composition === "carousel_cta") {
    caps.closer = FL.ctaCloser.maxChars;
    caps.cta = FL.ctaAction.maxChars;
  } else if (s.composition === "declaration") {
    caps.headline = 42;
    caps.subtitle = 100;
  } else if (s.composition === "split_contrast") {
    caps.trueLine = 44;
  } else if (s.composition === "big_stat") {
    caps.stat = 5;
    caps.caption = 95;
  } else if (s.composition === "panel_slide") {
    caps.caption = FL.panelCaption.maxChars;
  }

  for (const [key, cap] of Object.entries(caps)) {
    const val = (s as Record<string, unknown>)[key];
    if (typeof val === "string" && val.length > cap) {
      (s as Record<string, unknown>)[key] = clampToChars(val, cap);
    }
  }

  // Rescue emphasis: must be a word (or contiguous phrase) from the slide's
  // primary text line. Primary text differs per composition.
  const primary = s.headline || s.title || s.closer || s.trueLine || s.caption;
  if (s.emphasize && !isValidEmphasis(s.emphasize, primary)) {
    // If a subtitle slot exists and is empty, move the stray phrase there.
    if ((s.composition === "carousel_hook" || s.composition === "numbered_step") && !s.subtitle) {
      s.subtitle = clampToChars(s.emphasize, s.composition === "carousel_hook" ? FL.hookSubtitle.maxChars : FL.stepSubtitle.maxChars);
    }
    s.emphasize = undefined;
  }

  return s;
}
