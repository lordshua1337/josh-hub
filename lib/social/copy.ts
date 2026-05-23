// Copy generators per post type. Single + carousel.
// Each generator emits JSON matching the composition's slot shape.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import PROMETHEUS_VOICE from "./voices/prometheus";
import type { Brand } from "./brands";
import { getPostType, type PostTypeDef } from "./post-types";
import { buildArc, buildArcPrompt, enforceLimits } from "./arc-spec";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const VOICES: Record<string, string> = { prometheus: PROMETHEUS_VOICE };

// ----- shared types -----
export type SlideContent = {
  composition: string;
  // declaration / carousel_hook
  kicker?: string;
  eyebrow?: string;     // overline tag for numbered_step (e.g. "play 1 of 5")
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
async function ask(prompt: string, maxTokens = 1500): Promise<string> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
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
async function askForJson<T>(prompt: string, maxTokens: number): Promise<T | null> {
  const first = await ask(prompt, maxTokens);
  const parsed = tryParse<T>(first);
  if (parsed) return parsed;
  // One retry with an injected sternness header. We don't want to loop
  // forever — one shot then give up.
  const stricter =
    `CRITICAL: Your previous response could not be parsed. Return ONLY raw, complete, well-formed JSON. No prose, no markdown fences, no commentary. The JSON must be a single complete object that fits within the response budget. Be terse if you must.\n\n` +
    prompt;
  const second = await ask(stricter, maxTokens);
  return tryParse<T>(second);
}

// ----- declaration / hot_take / founder_lens / ai_enablement_declaration -----
async function draftSingleDeclaration(brand: Brand, def: PostTypeDef, topic: string): Promise<PostCopy> {
  const briefedTopic = topic.length > 220 ? topic.slice(0, 220).trim() + "…" : topic;
  type Raw = { kicker?: string; headline?: string; emphasize?: string; subtitle?: string; footer?: string; caption?: string };
  const p = (await askForJson<Raw>(`${voiceFor(brand)}

Write ONE Instagram declaration post. Typography-led, dark forge background.

POST TYPE: ${def.label}. ${def.description}
TONE: ${def.voiceHint}
TOPIC (distill — do NOT echo verbatim): "${briefedTopic}"

Two fields often confused:
- "emphasize" = EXACTLY ONE word from the headline below. Renders ember-gradient. If no single word pops, omit.
- "subtitle"  = multi-word tagline / second-line copy. Multi-word OK.
Example: headline="AI doesn't replace judgment.", emphasize="judgment", subtitle="It amplifies the operators who already have it."

Return ONLY raw JSON, no prose, no fences:
{
  "kicker":    "small all-caps mono opener, <=6 words, OR empty string",
  "headline":  "<=10 words, REWRITE the topic, do NOT echo it verbatim",
  "emphasize": "ONE word from headline, OR empty string",
  "subtitle":  "8-14 word tagline / punchline that complements headline",
  "footer":    "optional small editorial line, <=18 words, OR empty string",
  "caption":   "IG caption, 2-4 short paragraphs, ends with question, 4-6 hashtags on new line at bottom"
}

RULES:
- headline MUST NOT echo topic verbatim — REWRITE punchy.
- emphasize is single-word-from-headline OR omitted/empty. NEVER a phrase.
- No emojis. No em dashes. No corporate slop.`, 2000)) ?? { headline: briefedTopic, caption: "" };
  const heroSlide = rescueSlideEmphasis({
    composition: "declaration",
    kicker: p.kicker,
    headline: p.headline,
    emphasize: p.emphasize,
    subtitle: p.subtitle,
    footer: p.footer,
  });
  return {
    is_carousel: false,
    slides: [heroSlide],
    caption: p.caption || "",
  };
}

// ----- split_contrast (reframe) -----
async function draftReframe(brand: Brand, def: PostTypeDef, topic: string): Promise<PostCopy> {
  const briefedTopic = topic.length > 220 ? topic.slice(0, 220).trim() + "…" : topic;
  type Raw = { theySaidLabel?: string; theySaid?: string; trueLabel?: string; trueLine?: string; emphasize?: string; caption?: string };
  const p = (await askForJson<Raw>(`${voiceFor(brand)}

Write ONE Instagram "split_contrast" post. Top half = what they were told (struck-through). Bottom half = what's true.

POST TYPE: ${def.label}. ${def.description}
TONE: ${def.voiceHint}
TOPIC: "${briefedTopic}"

Return ONLY raw JSON, no prose:
{
  "theySaidLabel": "2-4 word ALL CAPS label, default WHAT THEY SAID",
  "theySaid":      "the popular take, <=12 words, accurate not strawman",
  "trueLabel":     "2-4 word ALL CAPS label, default WHAT'S TRUE",
  "trueLine":      "the reframe, <=15 words",
  "emphasize":     "ONE word from trueLine OR empty string",
  "caption":       "2-3 short paragraphs, question at end, 4-6 hashtags"
}

RULES: emphasize = single word from trueLine OR omit. No emojis, no em dashes.`, 1500)) ?? { theySaid: "", trueLine: briefedTopic, caption: "" };
  return {
    is_carousel: false,
    slides: [
      rescueSlideEmphasis({
        composition: "split_contrast",
        theySaidLabel: p.theySaidLabel,
        theySaid: p.theySaid,
        trueLabel: p.trueLabel,
        trueLine: p.trueLine,
        emphasize: p.emphasize,
      }),
    ],
    caption: p.caption || "",
  };
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

// ----- carousels (spec-driven) -----
// Prompt, per-field caps, arc roles, and slide count all come from buildArc()/
// buildArcPrompt() in arc-spec.ts. enforceLimits() clamps the output as a
// backstop. This function just maps the JSON onto SlideContent.
async function draftCarousel(brand: Brand, def: PostTypeDef, topic: string, slideCount?: number): Promise<PostCopy> {
  const arc = buildArc(def.slug, slideCount ?? def.slideCount);
  const bodyCount = arc.bodyCount;

  type Raw = {
    hook?: { kicker?: string; headline?: string; emphasize?: string; subtitle?: string; swipeHint?: string };
    body?: { title?: string; body?: string; emphasize?: string; subtitle?: string }[];
    cta?: { closer?: string; emphasize?: string; cta?: string; link?: string };
    caption?: string;
    first_comment?: string;
    reel_script?: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] };
  };

  const raw = (await askForJson<Raw>(buildArcPrompt(arc, voiceFor(brand), topic), arc.tokenBudget)) ?? {};
  const body = (raw.body ?? []).slice(0, bodyCount);

  const slides: SlideContent[] = [
    enforceLimits({
      composition: "carousel_hook",
      kicker: raw.hook?.kicker || `${bodyCount} ${arc.bodyNoun.toUpperCase()}S`,
      headline: raw.hook?.headline || topic,
      emphasize: raw.hook?.emphasize,
      subtitle: raw.hook?.subtitle,
      swipeHint: raw.hook?.swipeHint || "swipe →",
    } as SlideContent),
  ];
  for (let i = 0; i < bodyCount; i++) {
    const s = body[i] || { title: `${arc.bodyNoun} ${i + 1}`, body: "" };
    slides.push(
      enforceLimits({
        composition: "numbered_step",
        index: i + 1,
        total: bodyCount,
        eyebrow: `${arc.bodyNoun} ${i + 1} of ${bodyCount}`,
        title: s.title || `${arc.bodyNoun} ${i + 1}`,
        body: s.body || "",
        emphasize: s.emphasize,
        subtitle: s.subtitle,
      } as SlideContent)
    );
  }
  slides.push(
    enforceLimits({
      composition: "carousel_cta",
      closer: raw.cta?.closer || "Pick one. Ship it this week.",
      emphasize: raw.cta?.emphasize,
      cta: raw.cta?.cta || "Book a 15-min reality check.",
      link: raw.cta?.link || brand.schedulingLink || "",
    } as SlideContent)
  );
  // Brand-standard final slide — never LLM-generated, always appended.
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

// ----- panel_panorama (seamless image-split carousel, spec-driven) -----
async function draftPanorama(brand: Brand, def: PostTypeDef, topic: string, slideCount?: number): Promise<PostCopy> {
  const arc = buildArc(def.slug, slideCount ?? def.slideCount);
  const panelCount = arc.bodyCount;

  type Raw = {
    panels?: { caption?: string; emphasize?: string }[];
    cta?: { closer?: string; emphasize?: string; cta?: string; link?: string };
    caption?: string;
    first_comment?: string;
    reel_script?: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] };
  };
  const raw = (await askForJson<Raw>(buildArcPrompt(arc, voiceFor(brand), topic), arc.tokenBudget)) ?? {};
  const panels = (raw.panels || []).slice(0, panelCount);

  const slides: SlideContent[] = [];
  for (let i = 0; i < panelCount; i++) {
    const p = panels[i] || { caption: "" };
    // panel_slide reads its text from `headline` (mapped from caption); keep
    // a `caption` mirror too so enforceLimits caps it under the panel rule.
    const enforced = enforceLimits({
      composition: "panel_slide",
      caption: p.caption || "",
      emphasize: p.emphasize,
    });
    slides.push({
      composition: "panel_slide",
      headline: enforced.caption || "",
      emphasize: enforced.emphasize,
      panelIndex: i,
      panelTotal: panelCount,
    });
  }
  slides.push(
    enforceLimits({
      composition: "carousel_cta",
      closer: raw.cta?.closer || "Pick one. Ship it this week.",
      emphasize: raw.cta?.emphasize,
      cta: raw.cta?.cta || "Book a 15-min reality check.",
      link: raw.cta?.link || brand.schedulingLink || "",
    } as SlideContent)
  );
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
    reel_script: normalizeReel(raw.reel_script, "30s"),
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
// slideCount is honored only for carousels; buildArc clamps it to the type's range.
export async function draftPost(brand: Brand, postTypeSlug: string, topic: string, slideCount?: number): Promise<PostCopy> {
  const def = getPostType(postTypeSlug);
  if (def.slug === "panel_panorama") return draftPanorama(brand, def, topic, slideCount);
  if (def.kind === "carousel") return draftCarousel(brand, def, topic, slideCount);
  if (def.compositions[0] === "split_contrast") return draftReframe(brand, def, topic);
  return draftSingleDeclaration(brand, def, topic);
}

// Back-compat single-declaration helper used by phase 1 callers
export async function draftDeclaration(brand: Brand, topic: string): Promise<DeclarationCopy> {
  const post = await draftSingleDeclaration(brand, getPostType("ai_enablement_declaration"), topic);
  const s = post.slides[0];
  return {
    kicker: s.kicker,
    headline: s.headline || topic,
    emphasize: s.emphasize,
    footer: s.footer,
    caption: post.caption,
  };
}
