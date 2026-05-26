// Copy generators per post type. Single + carousel.
// Each generator emits JSON matching the composition's slot shape.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import PROMETHEUS_VOICE from "./voices/prometheus";
import type { Brand } from "./brands";
import { getPostType, type PostTypeDef } from "./post-types";
import { getContentType } from "./content-types";
import { buildArc, buildIdeatePrompt, buildExpandPrompt, buildSinglePrompt, enforceLimits, type IdeaSeed } from "./arc-spec";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Model routing: Sonnet does the thinking (ideating real ideas + writing slide
// copy), Haiku does the cheap mechanical work (caption regen, classification,
// topic suggestions). The depth of carousel content lives in MODEL_BODY.
const MODEL_BODY = "claude-sonnet-4-5-20250929";
const MODEL_FAST = "claude-haiku-4-5-20251001";

const VOICES: Record<string, string> = { prometheus: PROMETHEUS_VOICE };

// ----- shared types -----
export type SlideContent = {
  composition: string;
  // declaration / carousel_hook
  kicker?: string;
  eyebrow?: string;     // overline tag for numbered_step (e.g. "tactic 1 of 8")
  headline?: string;
  emphasize?: string;   // ONE word that appears verbatim in headline → ember gradient
  subtitle?: string;    // supporting tagline rendered below the headline — multi-word OK
  footer?: string;
  swipeHint?: string;
  // numbered_step
  index?: number;
  total?: number;
  title?: string;
  body?: string;
  // carousel_cta
  closer?: string;
  cta?: string;
  link?: string;
  // split_contrast
  theySaidLabel?: string;
  theySaid?: string;
  trueLabel?: string;
  trueLine?: string;
  // field_report
  frLines?: { tag?: string; text: string }[];
  // big_stat
  stat?: string;
  unit?: string;
  source?: string;
  // background image (only set on hero slide — declaration / carousel_hook)
  imageUrl?: string;
  focalX?: number;       // 0..100, horizontal focal point (default 50)
  focalY?: number;       // 0..100, vertical focal point (default 50)
  zoom?: number;         // 0.5 = pulled back, 1.0 = cover (default), 2.0 = zoomed in
  overlay?: "subtle" | "strong" | "fade-bottom" | "wordmark" | "none";
  // panel_panorama (one image split across N slides)
  panelIndex?: number;   // 0..N-1 — which panel of the panorama this slide shows
  panelTotal?: number;   // total panels in the panorama
};

// AUTO-RESCUE — given a slide whose `emphasize` came back from the LLM,
// ensure it's a single word that actually appears in the headline (or
// title for numbered_step). If not, move the text into `subtitle` so no
// copy is lost, and clear emphasize.
//
// This is belt-and-suspenders for the new prompts. The new prompts ask
// the LLM to split emphasize/subtitle cleanly, but if it regresses we
// catch the violation instead of silently dropping the tagline content.
export function rescueSlideEmphasis(slide: SlideContent): SlideContent {
  const e = slide.emphasize?.trim();
  if (!e) return slide;
  // Check every text field that the composition might use as the "headline"
  // surface for ember-gradient: headline / title / trueLine.
  const haystack = `${slide.headline || ""} ${slide.title || ""} ${slide.trueLine || ""}`.toLowerCase();
  const isSingleWord = !/\s/.test(e);
  const isSubstring = haystack.includes(e.toLowerCase());
  if (isSingleWord && isSubstring) return slide; // valid
  // Bad emphasize — rescue the content into subtitle (if subtitle is empty)
  return {
    ...slide,
    emphasize: undefined,
    subtitle: slide.subtitle && slide.subtitle.trim().length > 0 ? slide.subtitle : e,
  };
}


export type ReelBeat = {
  t: string;       // timestamp marker, e.g. "0:00"
  label: string;   // HOOK / SETUP / PAYOFF / CTA
  script: string;  // the line Josh reads
};

export type ReelScript = {
  duration: string; // "45s" / "50s"
  beats: ReelBeat[];
};

export type PostCopy = {
  is_carousel: boolean;
  slides: SlideContent[];
  caption: string;          // paste into IG caption field
  first_comment?: string;   // planted first reply where links live (IG penalizes links in captions)
  reel_script?: ReelScript; // 45-50s talking-head script for the companion reel
};

// kept for back-compat with /api/social/draft callers from phase 1
export type DeclarationCopy = {
  kicker?: string;
  headline: string;
  emphasize?: string;
  footer?: string;
  caption: string;
};

function voiceFor(brand: Brand): string {
  const v = VOICES[brand.slug];
  if (!v) throw new Error(`No voice for brand ${brand.slug}`);
  return v;
}
async function ask(prompt: string, maxTokens = 1500, model: string = MODEL_FAST): Promise<string> {
  const res = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.content[0].type === "text" ? res.content[0].text : "";
  return text.trim().replace(/^```json\n?|\n?```$/g, "");
}

// Try to parse JSON; if it fails (truncated, malformed), attempt to repair
// by trimming everything after the last close-brace. Returns the parsed
// object or null. We log when this happens so silent failures are visible.
function tryParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    // Attempt repair: find the last balanced "}" position from the end
    // and try slicing the string there. Handles mid-string truncation.
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i] === "}") {
        try {
          return JSON.parse(s.slice(0, i + 1)) as T;
        } catch {
          continue;
        }
      }
    }
    console.warn("[social/copy] JSON parse failed; falling back. First 300 chars:", s.slice(0, 300));
    return null;
  }
}

function safeParse<T>(s: string, fallback: T): T {
  return tryParse<T>(s) ?? fallback;
}

// askWithRetry — call the LLM, parse to JSON. If parse fails entirely
// (not even partial repair worked), retry ONCE with a stricter, shorter
// reminder to return raw JSON only. This catches the case where Haiku
// returned prose / Markdown / a truncated payload.
async function askForJson<T>(prompt: string, maxTokens: number, model: string = MODEL_FAST): Promise<T | null> {
  const first = await ask(prompt, maxTokens, model);
  const parsed = tryParse<T>(first);
  if (parsed) return parsed;
  // One retry with an injected sternness header. We don't want to loop
  // forever — one shot then give up.
  const stricter =
    `CRITICAL: Your previous response could not be parsed. Return ONLY raw, complete, well-formed JSON. No prose, no markdown fences, no commentary. The JSON must be a single complete object that fits within the response budget. Be terse if you must.\n\n` +
    prompt;
  const second = await ask(stricter, maxTokens, model);
  return tryParse<T>(second);
}

// ----- single posts (Hot Take / Founder Story) -----
// One-pass Sonnet with the type's specificity bar + good/generic exemplars.
async function draftSingle(brand: Brand, def: PostTypeDef, topic: string, grounding?: Record<string, string>): Promise<PostCopy> {
  const spec = getContentType(def.slug);
  const briefedTopic = topic.length > 240 ? topic.slice(0, 240).trim() + "…" : topic;
  type Raw = { kicker?: string; headline?: string; emphasize?: string; subtitle?: string; footer?: string; caption?: string };
  const prompt = spec
    ? buildSinglePrompt(spec, voiceFor(brand), topic, grounding)
    : `${voiceFor(brand)}\n\nWrite ONE Instagram declaration post about: "${briefedTopic}". Return raw JSON {"kicker","headline","emphasize","subtitle","footer","caption"}. No emojis, no em dashes.`;
  const p = (await askForJson<Raw>(prompt, 2000, MODEL_BODY)) ?? { headline: briefedTopic, caption: "" };
  const heroSlide = rescueSlideEmphasis({
    composition: spec?.design.single ?? "declaration",
    kicker: p.kicker,
    headline: p.headline,
    emphasize: p.emphasize,
    subtitle: p.subtitle,
    footer: p.footer,
  });
  return { is_carousel: false, slides: [heroSlide], caption: p.caption || "" };
}

// Normalize a raw reel_script from the LLM into a typed ReelScript (or undefined).
function normalizeReel(
  raw: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] } | undefined,
  fallbackDuration: string
): ReelScript | undefined {
  if (!raw?.beats || raw.beats.length === 0) return undefined;
  const beats: ReelBeat[] = raw.beats
    .filter((b): b is { t: string; label: string; script: string } => Boolean(b?.t && b?.label && b?.script))
    .slice(0, 4);
  if (beats.length !== 4) return undefined;
  return { duration: raw.duration || fallbackDuration, beats };
}

// ----- carousels: two-stage (ideate -> expand), Sonnet -----
// Stage 1 plans the N body ideas and forces them specific (buildIdeatePrompt),
// with an in-prompt self-critique. Stage 2 writes the full slide package from
// those vetted ideas (buildExpandPrompt). enforceLimits clamps as a backstop.
async function draftCarousel(brand: Brand, def: PostTypeDef, topic: string, slideCount?: number, grounding?: Record<string, string>): Promise<PostCopy> {
  const arc = buildArc(def.slug, slideCount ?? def.slideCount);
  const bodyCount = arc.bodyCount;
  const voice = voiceFor(brand);
  const isContrast = arc.bodyMode === "contrast";
  const eyebrowLabel = arc.spec.bodyUnit!.eyebrowLabel;

  // Stage 1 — ideate the body (Sonnet). Returns vetted idea seeds, not copy.
  const ideated = await askForJson<{ seeds?: IdeaSeed[] }>(
    buildIdeatePrompt(arc, voice, topic, grounding),
    arc.ideateBudget,
    MODEL_BODY,
  );
  const seeds: IdeaSeed[] = (ideated?.seeds ?? [])
    .filter((s): s is IdeaSeed => Boolean(s && (s.lead || s.detail)))
    .slice(0, bodyCount);
  while (seeds.length < bodyCount) seeds.push({ lead: "", detail: "" });

  // Stage 2 — expand the vetted seeds into the slide package (Sonnet).
  type Raw = {
    hook?: { kicker?: string; headline?: string; emphasize?: string; subtitle?: string; swipeHint?: string };
    body?: { title?: string; subtitle?: string; body?: string; theySaid?: string; trueLine?: string; emphasize?: string }[];
    cta?: { closer?: string; emphasize?: string; cta?: string; link?: string };
    caption?: string;
    first_comment?: string;
    reel_script?: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] };
  };
  const raw = (await askForJson<Raw>(buildExpandPrompt(arc, voice, topic, seeds, grounding), arc.expandBudget, MODEL_BODY)) ?? {};
  const body = (raw.body ?? []).slice(0, bodyCount);

  const slides: SlideContent[] = [
    enforceLimits({
      composition: "carousel_hook",
      kicker: raw.hook?.kicker || `${bodyCount} ${arc.bodyUnitPlural}`,
      headline: raw.hook?.headline || topic,
      emphasize: raw.hook?.emphasize,
      subtitle: raw.hook?.subtitle,
      swipeHint: raw.hook?.swipeHint || "swipe →",
    } as SlideContent),
  ];

  for (let i = 0; i < bodyCount; i++) {
    const s = body[i] || {};
    const seed = seeds[i];
    if (isContrast) {
      slides.push(
        enforceLimits({
          composition: "split_contrast",
          theySaidLabel: "what they say",
          theySaid: s.theySaid || seed?.lead || "",
          trueLabel: "what's true",
          trueLine: s.trueLine || seed?.detail || "",
          emphasize: s.emphasize,
        } as SlideContent),
      );
    } else {
      slides.push(
        enforceLimits({
          composition: "numbered_step",
          index: i + 1,
          total: bodyCount,
          eyebrow: eyebrowLabel, // a real label ("tactic"), never "i of N"
          title: s.title || seed?.lead || "",
          subtitle: s.subtitle,
          body: s.body || seed?.detail || "",
          emphasize: s.emphasize,
        } as SlideContent),
      );
    }
  }

  slides.push(
    enforceLimits({
      composition: "carousel_cta",
      closer: raw.cta?.closer || "Start with the one that fits your week.",
      emphasize: raw.cta?.emphasize,
      cta: raw.cta?.cta || "Questions? josh@prometheusconsulting.ai",
      link: raw.cta?.link || brand.schedulingLink || "",
    } as SlideContent),
  );

  // Brand-standard final slide — never generated, always appended.
  slides.push({
    composition: "signoff",
    link: "josh@prometheusconsulting.ai",
    headline: "If this was useful, do one of these.",
    emphasize: "do one of these",
    footer: def.signoffNote,
  });

  return {
    is_carousel: true,
    slides,
    caption: raw.caption || "",
    first_comment: raw.first_comment || undefined,
    reel_script: normalizeReel(raw.reel_script, "45s"),
  };
}

// ----- caption regenerator -----
// Re-rolls just the caption + first_comment + reel_script for an already-
// drafted post. Reuses the post's existing slides as context so the new
// caption stays consistent with the visuals.
export type RegenPackage = {
  caption: string;
  first_comment?: string;
  reel_script?: ReelScript;
};

export async function regenCopyPackage(
  brand: Brand,
  postTypeSlug: string,
  topic: string,
  existing: { caption?: string; slides: SlideContent[] }
): Promise<RegenPackage> {
  const def = getPostType(postTypeSlug);
  // Pull the headline / steps so the new caption stays grounded in what
  // the slides actually say.
  const slideSummary = existing.slides
    .map((s, i) => {
      const head = s.headline || s.title || s.body || s.cta || s.trueLine || "";
      return head ? `${i + 1}. [${s.composition}] ${head}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const isCarousel = def.kind === "carousel";
  type Raw = {
    caption?: string;
    first_comment?: string;
    reel_script?: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] };
  };
  const raw = (await askForJson<Raw>(`${voiceFor(brand)}

Regenerate the PUBLISHING PACKAGE (caption + first comment + reel script) for an existing post. Visuals are locked. Try a DIFFERENT angle than before.

POST TYPE: ${def.label}. ${def.description}
TONE: ${def.voiceHint}
TOPIC: "${topic}"

Slides locked in:
${slideSummary || "(no slide context)"}

${existing.caption ? `Previous caption opening (do NOT repeat):\n"""\n${existing.caption.slice(0, 400)}\n"""` : ""}

Return ONLY raw JSON:
{
  "caption": "${isCarousel ? "600-800" : "400-600"} chars, short paragraphs, ends with '- Josh'",
  "first_comment": "2-3 lines including josh@prometheusconsulting.ai",
  "reel_script": { "duration": "${isCarousel ? "45s" : "30s"}", "beats": [
    { "t": "0:00", "label": "HOOK",   "script": "..." },
    { "t": "0:08", "label": "SETUP",  "script": "..." },
    { "t": "0:22", "label": "PAYOFF", "script": "..." },
    { "t": "0:40", "label": "CTA",    "script": "..." }
  ]}
}

RULES: DON'T start caption with the same opening as the previous one. Exactly 4 reel beats. No emojis, no em dashes.`, 2400)) ?? {};

  let reel_script: ReelScript | undefined;
  if (raw.reel_script?.beats && raw.reel_script.beats.length === 4) {
    const beats: ReelBeat[] = raw.reel_script.beats
      .filter((b): b is { t: string; label: string; script: string } => Boolean(b?.t && b?.label && b?.script))
      .slice(0, 4);
    if (beats.length === 4) {
      reel_script = { duration: raw.reel_script.duration || (isCarousel ? "45s" : "30s"), beats };
    }
  }

  return {
    caption: raw.caption || existing.caption || "",
    first_comment: raw.first_comment || undefined,
    reel_script,
  };
}

// ----- dispatcher -----
// slideCount + grounding are honored for carousels; buildArc clamps the count.
export async function draftPost(
  brand: Brand,
  postTypeSlug: string,
  topic: string,
  slideCount?: number,
  grounding?: Record<string, string>,
): Promise<PostCopy> {
  const def = getPostType(postTypeSlug);
  if (def.kind === "carousel") return draftCarousel(brand, def, topic, slideCount, grounding);
  return draftSingle(brand, def, topic, grounding);
}
