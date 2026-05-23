// Copy generators per post type. Single + carousel.
// Each generator emits JSON matching the composition's slot shape.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import PROMETHEUS_VOICE from "./voices/prometheus";
import type { Brand } from "./brands";
import { getPostType, type PostTypeDef } from "./post-types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const VOICES: Record<string, string> = { prometheus: PROMETHEUS_VOICE };

// ----- shared types -----
export type SlideContent = {
  composition: string;
  // declaration / carousel_hook
  kicker?: string;
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

function rescueAll(slides: SlideContent[]): SlideContent[] {
  return slides.map(rescueSlideEmphasis);
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

// ----- carousels -----
async function draftCarousel(brand: Brand, def: PostTypeDef, topic: string): Promise<PostCopy> {
  // slideCount = total INCLUDING the auto-appended signoff. Step count is
  // everything between the hook and the cta/signoff.
  const slideCount = def.slideCount ?? 6;
  const stepCount = slideCount - 3; // hook + cta + signoff

  // Keep the topic short in-prompt — if the user pasted a long brief,
  // distill the gist rather than letting the LLM echo it verbatim into
  // the headline (real bug we saw with a 235-char topic).
  const briefedTopic = topic.length > 220 ? topic.slice(0, 220).trim() + "…" : topic;

  type Raw = {
    hook?: { kicker?: string; headline?: string; emphasize?: string; subtitle?: string; swipeHint?: string };
    steps?: { title?: string; body?: string; emphasize?: string; subtitle?: string }[];
    cta?: { closer?: string; cta?: string; link?: string };
    caption?: string;
    first_comment?: string;
    reel_script?: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] };
  };

  const raw = (await askForJson<Raw>(`${voiceFor(brand)}

Write an Instagram CAROUSEL package: ${slideCount} slides total = 1 hook + ${stepCount} steps + 1 CTA, plus a caption + first comment + reel script.

POST TYPE: ${def.label}. ${def.description}
TONE: ${def.voiceHint}
TOPIC (distill — do NOT echo verbatim): "${briefedTopic}"

Two text fields per slide that often get confused:
- "emphasize" = EXACTLY ONE word that already appears in the headline/title. It renders ember-gradient. If no single word pops, omit.
- "subtitle"  = the multi-word tagline / second-line copy. Multi-word OK. Where punchlines live.
Example: headline="Five systems in week one", emphasize="Five", subtitle="Not strategy decks. Real automation that moves revenue."

Return ONLY raw JSON, no prose, no fences:
{
  "hook": { "kicker": "${stepCount} PLAYS", "headline": "<=10 words, NOT the topic verbatim", "emphasize": "<one word>", "subtitle": "<the punchline, 8-14 words>", "swipeHint": "swipe to start ->" },
  "steps": [ ${Array(stepCount).fill(0).map((_, i) => `{ "title": "<=9 words", "body": "1-2 short sentences, ref one concrete tool/metric", "emphasize": "<one word from title or OMIT>", "subtitle": "<optional tagline>" }`).join(",\n    ")} ],
  "cta": { "closer": "punchy payoff line, <=12 words", "cta": "the one action", "link": "" },
  "caption": "600-800 chars, 2-3 short paragraphs ending with '- Josh' on its own line, NO link",
  "first_comment": "2-3 short lines, includes 'josh@prometheusconsulting.ai' and 'prometheusconsulting.ai'",
  "reel_script": { "duration": "45s", "beats": [
    { "t": "0:00", "label": "HOOK",   "script": "..." },
    { "t": "0:08", "label": "SETUP",  "script": "..." },
    { "t": "0:22", "label": "PAYOFF", "script": "..." },
    { "t": "0:40", "label": "CTA",    "script": "..." }
  ]}
}

RULES (failure to follow = the post is broken):
- steps array MUST have EXACTLY ${stepCount} items. No fewer, no more.
- headline MUST NOT be the topic verbatim — REWRITE it punchy, <=10 words.
- emphasize is ALWAYS a single word from its slide's headline/title, OR omit entirely.
- subtitle is a tagline (multi-word OK). NEVER put a tagline in emphasize.
- Vary verbs across steps. Each step body names a tool / metric / specific artifact.
- No emojis. No em dashes. No "transform / leverage / synergize" corporate slop.
- reel_script: exactly 4 beats, 100-160 words total.`, 3800 + stepCount * 400)) ?? {};

  const steps = (raw.steps ?? []).slice(0, stepCount);

  const slides: SlideContent[] = [
    rescueSlideEmphasis({
      composition: "carousel_hook",
      kicker: raw.hook?.kicker || `${stepCount} PLAYS`,
      headline: raw.hook?.headline || topic,
      emphasize: raw.hook?.emphasize,
      subtitle: raw.hook?.subtitle,
      swipeHint: raw.hook?.swipeHint || "swipe →",
    }),
  ];
  for (let i = 0; i < stepCount; i++) {
    const s = steps[i] || { title: `Step ${i + 1}`, body: "" };
    slides.push(
      rescueSlideEmphasis({
        composition: "numbered_step",
        index: i + 1,
        total: stepCount,
        title: s.title || `Step ${i + 1}`,
        body: s.body || "",
        emphasize: s.emphasize,
        subtitle: s.subtitle,
      })
    );
  }
  slides.push({
    composition: "carousel_cta",
    closer: raw.cta?.closer || "Pick one. Ship it this week.",
    cta: raw.cta?.cta || "Book a 15-min reality check.",
    link: raw.cta?.link || brand.schedulingLink || "",
  });
  // Brand-standard final slide — never LLM-generated, always appended.
  // The per-post-type signoffNote reinforces this carousel's specific ask
  // (e.g. case-study posts ask for the operator's two systems; diagnostic
  // posts ask them to answer one of the questions honestly).
  slides.push({
    composition: "signoff",
    link: "josh@prometheusconsulting.ai",
    headline: "If this was useful, do one of these.",
    emphasize: "do one of these",
    footer: def.signoffNote,
  });
  // Normalize the reel script if Haiku returned it.
  let reel_script: ReelScript | undefined;
  if (raw.reel_script?.beats && raw.reel_script.beats.length > 0) {
    const beats: ReelBeat[] = raw.reel_script.beats
      .filter((b): b is { t: string; label: string; script: string } =>
        Boolean(b?.t && b?.label && b?.script))
      .slice(0, 4);
    if (beats.length === 4) {
      reel_script = {
        duration: raw.reel_script.duration || "45s",
        beats,
      };
    }
  }

  return {
    is_carousel: true,
    slides,
    caption: raw.caption || "",
    first_comment: raw.first_comment || undefined,
    reel_script,
  };
}

// ----- panel_panorama (seamless image-split carousel) -----
async function draftPanorama(brand: Brand, def: PostTypeDef, topic: string, panelCount = 3): Promise<PostCopy> {
  const briefedTopic = topic.length > 220 ? topic.slice(0, 220).trim() + "…" : topic;

  type Raw = {
    panels?: { caption?: string; emphasize?: string }[];
    cta?: { closer?: string; cta?: string; link?: string };
    caption?: string;
    first_comment?: string;
    reel_script?: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] };
  };
  const raw = (await askForJson<Raw>(`${voiceFor(brand)}

Write a SEAMLESS PANORAMA CAROUSEL — one image stretched across ${panelCount} swipeable panels. Each panel gets ONE short overlay phrase. Read together they form one statement.

POST TYPE: ${def.label}. ${def.description}
TONE: ${def.voiceHint}
TOPIC: "${briefedTopic}"

Return ONLY raw JSON:
{
  "panels": [ ${Array(panelCount).fill('{ "caption": "4-8 words", "emphasize": "ONE word from caption OR empty" }').join(",\n    ")} ],
  "cta": { "closer": "<=12 word payoff", "cta": "the one action", "link": "" },
  "caption": "400-700 chars, 2-3 short paragraphs ending with '- Josh'",
  "first_comment": "2-3 lines, contains josh@prometheusconsulting.ai",
  "reel_script": { "duration": "30s", "beats": [
    { "t": "0:00", "label": "HOOK",   "script": "..." },
    { "t": "0:06", "label": "SETUP",  "script": "..." },
    { "t": "0:16", "label": "PAYOFF", "script": "..." },
    { "t": "0:26", "label": "CTA",    "script": "..." }
  ]}
}

RULES:
- panels array MUST have EXACTLY ${panelCount} items.
- Each panel.caption is 4-8 words; the panels READ TOGETHER form one statement.
- emphasize is single word from caption, OR omit. Never a phrase.
- reel_script: exactly 4 beats, 80-130 words total. No emojis/em dashes.`, 2800)) ?? {};

  const panels = (raw.panels || []).slice(0, panelCount);

  const slides: SlideContent[] = [];
  for (let i = 0; i < panelCount; i++) {
    const p = panels[i] || { caption: "" };
    slides.push(
      rescueSlideEmphasis({
        composition: "panel_slide",
        headline: p.caption || "",
        emphasize: p.emphasize,
        panelIndex: i,
        panelTotal: panelCount,
      })
    );
  }
  slides.push({
    composition: "carousel_cta",
    closer: raw.cta?.closer || "Pick one. Ship it this week.",
    cta: raw.cta?.cta || "Book a 15-min reality check.",
    link: raw.cta?.link || brand.schedulingLink || "",
  });
  slides.push({
    composition: "signoff",
    link: "josh@prometheusconsulting.ai",
    headline: "If this was useful, do one of these.",
    emphasize: "do one of these",
    footer: def.signoffNote,
  });

  let reel_script: ReelScript | undefined;
  if (raw.reel_script?.beats && raw.reel_script.beats.length === 4) {
    const beats: ReelBeat[] = raw.reel_script.beats
      .filter((b): b is { t: string; label: string; script: string } => Boolean(b?.t && b?.label && b?.script))
      .slice(0, 4);
    if (beats.length === 4) reel_script = { duration: raw.reel_script.duration || "30s", beats };
  }

  return {
    is_carousel: true,
    slides,
    caption: raw.caption || "",
    first_comment: raw.first_comment || undefined,
    reel_script,
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
export async function draftPost(brand: Brand, postTypeSlug: string, topic: string): Promise<PostCopy> {
  const def = getPostType(postTypeSlug);
  if (def.slug === "panel_panorama") return draftPanorama(brand, def, topic);
  if (def.kind === "carousel") return draftCarousel(brand, def, topic);
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
