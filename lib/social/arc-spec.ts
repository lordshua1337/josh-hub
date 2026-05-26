// arc-spec.ts — turns a ContentTypeSpec (from content-types.ts) into a concrete
// per-count arc, and builds the TWO prompts that drive generation:
//   1. buildIdeatePrompt  — Sonnet plans the N body ideas, made specific + vetted
//   2. buildExpandPrompt  — Sonnet writes the final slide package from those ideas
// Plus enforceLimits, the defensive output clamp. Pure data + pure functions.

import {
  FIELD,
  getContentType,
  clampSlideCount,
  bodyCountFor,
  CAROUSEL_TYPES,
  type FieldLimit,
  type BodyMode,
  type ContentTypeSpec,
} from "./content-types";

export type { FieldLimit, BodyMode } from "./content-types";
export { clampSlideCount } from "./content-types";

// ── Per-slide + arc shape ────────────────────────────────────────────────────

export type SlideSpec = {
  position: number;             // 1-indexed
  composition: string;
  arcRole: string;              // role this slide plays, injected into expand prompt
  fields: FieldLimit[];
};

export type ArcSpec = {
  spec: ContentTypeSpec;
  postType: string;
  slideCount: number;
  bodyCount: number;
  bodyMode: BodyMode;
  bodyUnitPlural: string;
  arcGoal: string;
  slides: SlideSpec[];
  ideateBudget: number;         // max_tokens for stage 1
  expandBudget: number;         // max_tokens for stage 2
};

// Back-compat shim for the current wizard (replaced in the wizard rewrite).
// Shape: { min, max, default, bodyMode, bodyNoun } keyed by slug.
export const CAROUSEL_CONFIG: Record<string, { min: number; max: number; default: number; bodyMode: BodyMode; bodyNoun: string }> = {};
for (const t of CAROUSEL_TYPES) {
  if (t.slideRange && t.bodyMode && t.bodyUnit) {
    CAROUSEL_CONFIG[t.slug] = {
      min: t.slideRange.min,
      max: t.slideRange.max,
      default: t.slideRange.default,
      bodyMode: t.bodyMode,
      bodyNoun: t.bodyUnit.plural,
    };
  }
}

// ── Arc construction ───────────────────────────────────────────────────────

// Sequential story beats for a Teardown of n body slides.
function sequentialBeats(n: number): string[] {
  switch (n) {
    case 2:
      return ["The problem — what was bleeding (time / money / trust)", "What you built + the result, with the number"];
    case 3:
      return ["The problem — what was bleeding", "What you built — the approach + the tools", "The result — the number it moved"];
    case 4:
      return ["The problem — what was bleeding", "The approach — the plan in one move", "The tools — what you wired together", "The result — the number it moved"];
    default: {
      const out = ["The problem — what was bleeding"];
      for (let i = 1; i < n - 1; i++) out.push(`Build beat ${i} — a concrete step in the build`);
      out.push("The result — the number it moved");
      return out;
    }
  }
}

const ORDINAL = ["", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];

function bodyRole(mode: BodyMode, unit: string, k: number, total: number): string {
  if (mode === "sequential") return `Beat ${k} of ${total}: ${sequentialBeats(total)[k - 1]}.`;
  if (mode === "conceptual")
    return `Part ${k} of ${total}: a distinct part of the framework in logical order — it builds on the parts before it and must not repeat them.`;
  if (mode === "contrast")
    return k === total
      ? `Contrast ${k} of ${total}: the sharpest correction — save the most surprising belief-flip for last.`
      : `Contrast ${k} of ${total}: one belief stated fairly, then the specific truth that corrects it. Distinct from the others.`;
  // parallel
  const rank =
    k === 1
      ? "the most useful one — lead with what gives the reader something to act on immediately"
      : k === total
        ? "a less obvious one most people overlook"
        : `the ${ORDINAL[k] || `${k}th`}-most useful`;
  return `${unit} ${k} of ${total}: ${rank}. Stands alone, do-it-this-week, no overlap with the others.`;
}

export function buildArc(slug: string, requestedCount?: number): ArcSpec {
  const spec = getContentType(slug);
  if (!spec || spec.kind !== "carousel" || !spec.bodyMode || !spec.bodyUnit) {
    throw new Error(`buildArc: ${slug} is not a carousel content type`);
  }
  const slideCount = clampSlideCount(slug, requestedCount);
  const bodyCount = bodyCountFor(slug, slideCount);
  const unit = spec.bodyUnit.singular;

  const slides: SlideSpec[] = [];
  let pos = 1;

  slides.push({
    position: pos++,
    composition: spec.design.hook ?? "carousel_hook",
    arcRole: `The opening slide. Name the real tension or question this topic raises, in plain language — do not echo the topic verbatim and do not hype it. Sets up the ${bodyCount} ${spec.bodyUnit.plural} that follow.`,
    fields: [FIELD.hookHeadline, FIELD.hookSubtitle],
  });

  for (let k = 1; k <= bodyCount; k++) {
    slides.push({
      position: pos++,
      composition: spec.design.body,
      arcRole: bodyRole(spec.bodyMode, unit, k, bodyCount),
      fields: spec.bodyFields,
    });
  }

  slides.push({
    position: pos++,
    composition: spec.design.cta ?? "carousel_cta",
    arcRole: "The closing slide. One line that lands the point, plus one clear low-pressure next step. No hype, no rallying cry.",
    fields: [FIELD.ctaCloser, FIELD.ctaAction],
  });

  slides.push({ position: pos++, composition: "signoff", arcRole: "Brand-standard end slide (not generated).", fields: [] });

  return {
    spec,
    postType: slug,
    slideCount,
    bodyCount,
    bodyMode: spec.bodyMode,
    bodyUnitPlural: spec.bodyUnit.plural,
    arcGoal: spec.arcGoal,
    slides,
    ideateBudget: 1800 + bodyCount * 260,
    expandBudget: 3800 + bodyCount * 450,
  };
}

// ── Prompt helpers ───────────────────────────────────────────────────────────

function fieldLine(f: FieldLimit): string {
  const wordPart =
    f.maxWords > 0
      ? `${f.targetWords[0]}-${f.targetWords[1]} words, HARD MAX ${f.maxWords} words / ${f.maxChars} chars`
      : `HARD MAX ${f.maxChars} chars`;
  const opt = f.required ? "" : " (omit if nothing sharp fits)";
  return `    - ${f.key}: ${f.role}. ${wordPart}.${opt}`;
}

function groundingLines(spec: ContentTypeSpec, grounding: Record<string, string> | undefined): string {
  if (!grounding) return "";
  return spec.grounding
    .map((g) => {
      const v = (grounding[g.key] || "").trim();
      return v ? `- ${g.label}: ${v}` : null;
    })
    .filter(Boolean)
    .join("\n");
}

function modeGuidance(mode: BodyMode): string {
  switch (mode) {
    case "sequential":
      return "These are beats of ONE story in order: problem → approach → tools → result. Each moves the story forward; do not restate.";
    case "conceptual":
      return "These are the parts of one named framework in logical order; together they form the whole.";
    case "contrast":
      return "Each is one belief people genuinely hold (stated fairly, no strawman) paired with the specific truth that corrects it.";
    default:
      return "Each must stand alone — independent, do-it-this-week, with zero overlap between them.";
  }
}

// ── Stage 1: ideate the body (Sonnet) ────────────────────────────────────────
// Returns vetted idea seeds — NOT final copy. Each seed: { lead, detail }.
// For contrast types, lead = the belief, detail = the specific reality.

export function buildIdeatePrompt(arc: ArcSpec, voice: string, topic: string, grounding?: Record<string, string>): string {
  const { spec, bodyCount, bodyMode } = arc;
  const briefedTopic = topic.length > 240 ? topic.slice(0, 240).trim() + "…" : topic;
  const seedSkeleton =
    bodyMode === "contrast"
      ? `{ "lead": "the belief, stated fairly", "detail": "the specific reality + the concrete alternative" }`
      : `{ "lead": "the idea in a few words", "detail": "the concrete how — tool + mechanism + a real number, output, or artifact" }`;

  return `${voice}

You are PLANNING the body of an Instagram ${spec.label} carousel for Prometheus.
Do NOT write final slide copy yet. Plan the ideas, and make each one specific.

THE BRIEF
Topic: "${briefedTopic}"
${groundingLines(spec, grounding) || "(no extra grounding — infer sensibly, stay concrete)"}
Goal of the piece: ${spec.arcGoal}

YOUR JOB
Produce EXACTLY ${bodyCount} ${spec.bodyUnit!.plural}. ${modeGuidance(bodyMode)}

THE BAR (non-negotiable)
${spec.specificityBar}

GOOD — do this:
${spec.exemplars.good.map((e) => `  + ${e}`).join("\n")}
TOO GENERIC — never this:
${spec.exemplars.generic.map((e) => `  - ${e}`).join("\n")}

PROCESS
1. Draft ${bodyCount} candidates.
2. Self-critique each: "would a sharp operator say 'no shit'?" If yes, rewrite it specific or replace it. Kill duplicates and overlap.
3. Rank by leverage — best first (for a story, keep problem→result order).
4. Return only the final ${bodyCount}.

Return ONLY raw JSON, no prose, no fences:
{ "seeds": [ ${Array(bodyCount).fill(seedSkeleton).join(",\n    ")} ] }
The seeds array MUST have EXACTLY ${bodyCount} items.`;
}

export type IdeaSeed = { lead: string; detail: string };

// ── Stage 2: expand the vetted seeds into the slide package (Sonnet) ──────────

export function buildExpandPrompt(
  arc: ArcSpec,
  voice: string,
  topic: string,
  seeds: IdeaSeed[],
  grounding?: Record<string, string>,
): string {
  const { spec, bodyCount, bodyMode } = arc;
  const briefedTopic = topic.length > 240 ? topic.slice(0, 240).trim() + "…" : topic;

  const blocks = arc.slides
    .filter((s) => s.composition !== "signoff")
    .map((s) => {
      const head = `SLIDE ${s.position}/${arc.slideCount} · ${s.composition} · ${s.arcRole}`;
      const fields = s.fields.map(fieldLine).join("\n");
      const emph =
        s.composition === "carousel_hook" || s.composition === "numbered_step"
          ? "\n    - emphasize: ONE word copied verbatim from this slide's headline/title, or omit. Renders ember-gradient."
          : s.composition === "split_contrast"
            ? "\n    - emphasize: ONE word from the trueLine, or omit."
            : "";
      return `${head}\n${fields}${emph}`;
    })
    .join("\n\n");

  const bodyItem =
    bodyMode === "contrast"
      ? `{ "theySaid": "<=58 chars", "trueLine": "<=60 chars", "emphasize": "<one word from trueLine or omit>" }`
      : `{ "title": "<=8 words", "subtitle": "<optional clarifier or omit>", "body": "18-30 words", "emphasize": "<one word from title or omit>" }`;
  const bodyArr = `[ ${Array(bodyCount).fill(bodyItem).join(",\n    ")} ]`;

  const seedList = seeds
    .slice(0, bodyCount)
    .map((s, i) => `${i + 1}. ${s.lead} — ${s.detail}`)
    .join("\n");

  const skeleton = `{
  "hook": { "kicker": "${bodyCount} ${spec.bodyUnit!.plural}", "headline": "<=11 words, NOT the topic verbatim", "emphasize": "<one word from headline>", "subtitle": "<the second line, 8-14 words>", "swipeHint": "swipe to start ->" },
  "body": ${bodyArr},
  "cta": { "closer": "<=12 words", "emphasize": "<one word from closer or omit>", "cta": "the one action, <=50 chars", "link": "" },
  "caption": "600-800 chars, short paragraphs, ends with '- Josh' on its own line, NO link",
  "first_comment": "2-3 short lines, includes 'josh@prometheusconsulting.ai' and 'prometheusconsulting.ai'",
  "reel_script": { "duration": "45s", "beats": [
    { "t": "0:00", "label": "HOOK",   "script": "..." },
    { "t": "0:08", "label": "SETUP",  "script": "..." },
    { "t": "0:22", "label": "PAYOFF", "script": "..." },
    { "t": "0:40", "label": "CTA",    "script": "..." }
  ]}
}`;

  return `${voice}

Write the FINAL Instagram ${spec.label} carousel for Prometheus. The ideas are
already chosen and vetted — write them in voice and fit them to the layout.
Do NOT invent new ideas, drop any, or merge them.

Topic: "${briefedTopic}"
${groundingLines(spec, grounding)}

THE ${bodyCount} ${spec.bodyUnit!.plural.toUpperCase()} (expand each into one body slide, IN THIS ORDER):
${seedList}

Two fields people confuse:
  • emphasize = EXACTLY ONE word from that slide's headline/title. Renders ember-gradient. Omit if none pops. NEVER a phrase.
  • subtitle  = the multi-word second line.

THE SLIDES:

${blocks}

Return ONLY raw JSON, no prose, no fences:
${skeleton}

RULES:
- body array MUST have EXACTLY ${bodyCount} items — one per idea above, same order. Keep each item's specific tool/number/mechanism.
- Respect every per-field cap. When in doubt, write SHORTER.
- No emojis. No em dashes. No ALL-CAPS for emphasis. No "transform / leverage / synergize / 10x / game-changer". No rallying cries.
- reel_script: exactly 4 beats, 100-160 words total.`;
}

// ── Single-post prompt (Hot Take / Founder Story / declaration-style) ─────────

export function buildSinglePrompt(spec: ContentTypeSpec, voice: string, topic: string, grounding?: Record<string, string>): string {
  const briefedTopic = topic.length > 240 ? topic.slice(0, 240).trim() + "…" : topic;
  return `${voice}

Write ONE Instagram ${spec.label} post for Prometheus — typographic, dark forge background.

PURPOSE: ${spec.purpose}
GOAL: ${spec.arcGoal}
Topic: "${briefedTopic}"
${groundingLines(spec, grounding)}

THE BAR (non-negotiable)
${spec.specificityBar}

GOOD — do this:
${spec.exemplars.good.map((e) => `  + ${e}`).join("\n")}
TOO GENERIC — never this:
${spec.exemplars.generic.map((e) => `  - ${e}`).join("\n")}

Two fields people confuse:
  • emphasize = EXACTLY ONE word from the headline. Renders ember-gradient. Omit if none pops. NEVER a phrase.
  • subtitle  = the multi-word supporting line.

Return ONLY raw JSON, no prose, no fences:
{
  "kicker":   "small all-caps mono opener, <=6 words, OR empty string",
  "headline": "<=10 words, the belief rewritten punchy, NOT the topic verbatim",
  "emphasize": "ONE word from headline, OR empty string",
  "subtitle": "8-16 word line that earns the claim",
  "footer":   "optional small editorial line, <=18 words, OR empty string",
  "caption":  "2-4 short paragraphs, ends with a question, 4-6 hashtags on a new line at the bottom"
}

RULES: headline must NOT echo the topic verbatim. emphasize is one word from the headline or empty. No emojis, no em dashes, no hype, no ALL-CAPS.`;
}

// ── Output enforcement (defensive clamp + emphasis rescue) ───────────────────

// Trim to fit under maxChars without leaving a dangling mid-sentence fragment:
// prefer the last sentence boundary past ~55% of the cap; else cut at a word
// boundary and add an ellipsis so it reads intentional.
function clampToChars(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const slice = trimmed.slice(0, maxChars);
  let sentenceEnd = -1;
  for (let i = slice.length - 1; i >= 0; i--) {
    const ch = slice[i];
    if (ch === "." || ch === "!" || ch === "?") { sentenceEnd = i; break; }
  }
  if (sentenceEnd >= maxChars * 0.55) return slice.slice(0, sentenceEnd + 1).trim();
  const lastSpace = slice.lastIndexOf(" ");
  const base = (lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
  return base.replace(/[,;:\-\s]+$/, "") + "…";
}

function isValidEmphasis(emphasize: string | undefined, haystack: string | undefined): boolean {
  if (!emphasize || !haystack) return false;
  if (/\s/.test(emphasize.trim())) return false;
  return haystack.toLowerCase().includes(emphasize.trim().toLowerCase());
}

export type EnforceableSlide = {
  composition: string;
  headline?: string;
  title?: string;
  body?: string;
  subtitle?: string;
  closer?: string;
  cta?: string;
  theySaid?: string;
  trueLine?: string;
  caption?: string;
  stat?: string;
  emphasize?: string;
};

export function enforceLimits<T extends EnforceableSlide>(slide: T): T {
  const s: T = { ...slide };
  const caps: Record<string, number> = {};
  if (s.composition === "carousel_hook") {
    caps.headline = FIELD.hookHeadline.maxChars;
    caps.subtitle = FIELD.hookSubtitle.maxChars;
  } else if (s.composition === "numbered_step") {
    caps.title = FIELD.stepTitle.maxChars;
    caps.subtitle = FIELD.stepSubtitle.maxChars;
    caps.body = FIELD.stepBody.maxChars;
  } else if (s.composition === "carousel_cta") {
    caps.closer = FIELD.ctaCloser.maxChars;
    caps.cta = FIELD.ctaAction.maxChars;
  } else if (s.composition === "declaration") {
    caps.headline = FIELD.declHeadline.maxChars;
    caps.subtitle = FIELD.declSubtitle.maxChars;
  } else if (s.composition === "split_contrast") {
    caps.theySaid = FIELD.contrastSaid.maxChars;
    caps.trueLine = FIELD.contrastTrue.maxChars;
  } else if (s.composition === "big_stat") {
    caps.stat = 5;
    caps.caption = 95;
  } else if (s.composition === "panel_slide") {
    caps.caption = FIELD.panelCaption?.maxChars ?? 34;
  }

  for (const [key, cap] of Object.entries(caps)) {
    const val = (s as Record<string, unknown>)[key];
    if (typeof val === "string" && val.length > cap) {
      (s as Record<string, unknown>)[key] = clampToChars(val, cap);
    }
  }

  // Emphasis must be a single word from the slide's primary text line.
  const primary = s.headline || s.title || s.trueLine || s.closer || s.caption;
  if (s.emphasize && !isValidEmphasis(s.emphasize, primary)) {
    if ((s.composition === "carousel_hook" || s.composition === "numbered_step") && !s.subtitle) {
      s.subtitle = clampToChars(s.emphasize, s.composition === "carousel_hook" ? FIELD.hookSubtitle.maxChars : FIELD.stepSubtitle.maxChars);
    }
    s.emphasize = undefined;
  }

  return s;
}
