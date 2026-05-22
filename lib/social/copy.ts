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
function safeParse<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

// ----- declaration / hot_take / founder_lens / ai_enablement_declaration -----
async function draftSingleDeclaration(brand: Brand, def: PostTypeDef, topic: string): Promise<PostCopy> {
  const text = await ask(`${voiceFor(brand)}

You're writing ONE Instagram post in the "declaration" format. Typography-led, asymmetric, dark warm background. No background image.

POST TYPE: ${def.label}. ${def.description}
TONE: ${def.voiceHint}

Slots (READ CAREFULLY — emphasize and subtitle are DIFFERENT things):
- kicker:    small all-caps mono opener, optional. <= 6 words.
- headline:  the dominant line. <= 10 words.
- emphasize: EXACTLY ONE WORD from the headline above. That single word renders in an ember-gradient color so it pops. If no single word stands out, OMIT this field. NEVER put a tagline or full sentence here.
- subtitle:  the supporting tagline/punchline that complements the headline. <= 14 words. This is where the "second line of copy" lives — multi-word, full sentence OK. Optional but encouraged.
- footer:    small editorial line below subtitle. <= 18 words. Optional.
- caption:   IG caption. 2-4 short paragraphs. Ends with a question or path forward. 4-6 hashtags on separate line at bottom.

Topic: "${topic}"

EXAMPLES of correct emphasize vs subtitle:
  GOOD: headline="AI doesn't replace judgment.", emphasize="judgment", subtitle="It amplifies the operators who already have it."
  GOOD: headline="Five systems we set up in week one", emphasize="five", subtitle="Not strategy decks. Real automation that moves revenue."
  BAD:  headline="Five systems we set up in week one", emphasize="Not strategy decks. Real automation."  ← THIS IS A SUBTITLE, NOT AN EMPHASIZE

Constraints:
- NO emojis. NO em dashes.
- emphasize MUST be a single word that appears verbatim inside headline, OR omit entirely.
- caption must NOT just restate the headline.

Return ONLY raw JSON:
{"kicker": "...", "headline": "...", "emphasize": "...", "subtitle": "...", "footer": "...", "caption": "..."}`);
  const p = safeParse(text, { headline: topic, caption: "" }) as {
    kicker?: string; headline: string; emphasize?: string; subtitle?: string; footer?: string; caption: string;
  };
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
  const text = await ask(`${voiceFor(brand)}

You're writing ONE Instagram post in the "split_contrast" format. Top half (struck-through, muted) = what they were told. Bottom half (full color) = what's actually true.

POST TYPE: ${def.label}. ${def.description}
TONE: ${def.voiceHint}

Slots:
- theySaidLabel: 2-4 word label, all caps. Default "WHAT THEY SAID".
- theySaid:      the popular take. <= 12 words. Accurate, not a strawman.
- trueLabel:     2-4 word label, all caps. Default "WHAT'S TRUE".
- trueLine:      the reframe. <= 15 words.
- emphasize:     EXACTLY ONE WORD from trueLine (verbatim substring) to amber. If no single word stands out, OMIT entirely. NEVER a phrase.
- caption:       2-4 short paragraphs. Question at end. 4-6 hashtags.

Topic: "${topic}"

Return ONLY raw JSON:
{"theySaidLabel": "...", "theySaid": "...", "trueLabel": "...", "trueLine": "...", "emphasize": "...", "caption": "..."}`);
  const p = safeParse(text, { theySaid: "", trueLine: topic, caption: "" }) as {
    theySaidLabel?: string; theySaid: string; trueLabel?: string; trueLine: string; emphasize?: string; caption: string;
  };
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

  const text = await ask(`${voiceFor(brand)}

You're writing an Instagram CAROUSEL plus its companion publishing package
(caption + planted first comment + 45-50s reel script).

POST TYPE: ${def.label}. ${def.description}
TONE: ${def.voiceHint}
SLIDES: ${slideCount} total -- 1 hook + ${stepCount} body slides + 1 CTA.

Topic: "${topic}"

CRITICAL — emphasize vs subtitle (the system silently drops bad emphasize):
- "emphasize" = EXACTLY ONE WORD that appears verbatim in the headline/title. It gets an ember-gradient color treatment. If no single word stands out, OMIT this field.
- "subtitle" = the multi-word supporting line / tagline / second-line copy. This is where punchlines live.
- DO NOT cram a tagline into emphasize. It will be dropped.

GOOD: headline="Five systems in week one", emphasize="five", subtitle="Not strategy decks. Real automation that moves revenue."
BAD:  headline="Five systems in week one", emphasize="Not strategy decks. Real automation."  ← WRONG, that's a subtitle

Return ONLY raw JSON:
{
  "hook": {
    "kicker": "${stepCount} PLAYS",
    "headline": "...",
    "emphasize": "...",
    "subtitle": "...",
    "swipeHint": "swipe to start ->"
  },
  "steps": [
    { "title": "...", "body": "...", "emphasize": "...", "subtitle": "..." }
  ],
  "cta": {
    "closer": "...",
    "cta": "...",
    "link": ""
  },
  "caption": "...",
  "first_comment": "...",
  "reel_script": {
    "duration": "45s",
    "beats": [
      { "t": "0:00", "label": "HOOK", "script": "..." },
      { "t": "0:08", "label": "SETUP", "script": "..." },
      { "t": "0:22", "label": "PAYOFF", "script": "..." },
      { "t": "0:40", "label": "CTA", "script": "..." }
    ]
  }
}

Hard rules:
- Steps array MUST be exactly ${stepCount} items.
- Each step title <= 9 words; body 1-3 short lines.
- Step "subtitle" is OPTIONAL — only include if it adds a real tagline. Otherwise the body alone is enough.
- Every step must be specific enough to start TODAY.
- Vary the verb across steps (don't start all with "Build" or "Set up").
- Each step body must reference a concrete tool / metric / artifact.
- For the hook slide, "subtitle" is HIGHLY ENCOURAGED — it's the punchline that complements the headline.
- emphasize is ALWAYS single-word-from-headline-or-title, OR omit. Never a phrase.
- No emojis. No em dashes. No corporate slop ("transform" "leverage" "synergize").
- Caption: 600-900 chars. 2-4 short paragraphs, references the step titles. Ends with "- Josh" on its own line. NO link in the caption (IG penalizes that).
- first_comment: 2-4 short lines. This is where the email + URL live ("josh@prometheusconsulting.ai" + "prometheusconsulting.ai"). Make it feel like a planted follow-up, not a CTA.
- reel_script: exactly 4 beats (HOOK / SETUP / PAYOFF / CTA). 100-180 total words. Talking-head cadence: short sentences, specific numbers, no adjective tax.`, 3200);

  type Raw = {
    hook?: { kicker?: string; headline?: string; emphasize?: string; subtitle?: string; swipeHint?: string };
    steps?: { title?: string; body?: string; emphasize?: string; subtitle?: string }[];
    cta?: { closer?: string; cta?: string; link?: string };
    caption?: string;
    first_comment?: string;
    reel_script?: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] };
  };
  const raw = safeParse<Raw>(text, {});
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
  const text = await ask(`${voiceFor(brand)}

You're writing a SEAMLESS PANORAMA CAROUSEL. One image stretched across ${panelCount} swipeable panels. Each panel gets ONE short overlay phrase. Read together, they make a single statement.

POST TYPE: ${def.label}. ${def.description}
TONE: ${def.voiceHint}
Topic: "${topic}"

Return ONLY raw JSON:
{
  "panels": [
    { "caption": "...", "emphasize": "..." }
  ],
  "cta": {
    "closer": "...",
    "cta": "...",
    "link": ""
  },
  "caption": "...",
  "first_comment": "...",
  "reel_script": {
    "duration": "30s",
    "beats": [
      { "t": "0:00", "label": "HOOK", "script": "..." },
      { "t": "0:06", "label": "SETUP", "script": "..." },
      { "t": "0:16", "label": "PAYOFF", "script": "..." },
      { "t": "0:26", "label": "CTA", "script": "..." }
    ]
  }
}

Hard rules:
- panels array MUST be exactly ${panelCount} items.
- Each panel.caption is 4-8 words. Together they form ONE statement when swiped.
- Each panel.emphasize is EXACTLY ONE WORD from its caption (verbatim substring) to ember-gradient. If no single word stands out, OMIT this field entirely. NEVER put a tagline here — it gets silently dropped.
- No emojis. No em dashes.
- Caption: 400-700 chars. 2-3 short paragraphs. Ends with "- Josh".
- first_comment: 2-3 lines, contains josh@prometheusconsulting.ai.
- reel_script: exactly 4 beats, 80-130 words total.`, 2400);

  type Raw = {
    panels?: { caption?: string; emphasize?: string }[];
    cta?: { closer?: string; cta?: string; link?: string };
    caption?: string;
    first_comment?: string;
    reel_script?: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] };
  };
  const raw = safeParse<Raw>(text, {});
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
  const text = await ask(`${voiceFor(brand)}

You're regenerating the PUBLISHING PACKAGE for an already-drafted Instagram post.
The visuals are locked. Only the caption, first comment, and reel script need to change.
Try a different angle / opening hook than what's likely already there — Josh is regenerating because he wants alternatives.

POST TYPE: ${def.label}. ${def.description}
TONE: ${def.voiceHint}
TOPIC: "${topic}"

The slides that are already locked in:
${slideSummary || "(no slide context)"}

${existing.caption ? `Previous caption (for reference — do NOT repeat the same opening line):\n"""\n${existing.caption.slice(0, 600)}\n"""\n` : ""}

Return ONLY raw JSON:
{
  "caption": "...",
  "first_comment": "...",
  "reel_script": {
    "duration": "${isCarousel ? "45s" : "30s"}",
    "beats": [
      { "t": "0:00", "label": "HOOK", "script": "..." },
      { "t": "0:08", "label": "SETUP", "script": "..." },
      { "t": "0:22", "label": "PAYOFF", "script": "..." },
      { "t": "0:40", "label": "CTA", "script": "..." }
    ]
  }
}

Hard rules:
- Caption: ${isCarousel ? "600-900" : "400-700"} chars. Short paragraphs. Ends with "- Josh".
- DON'T start with the same opening line as the previous caption.
- first_comment: 2-3 lines including josh@prometheusconsulting.ai.
- reel_script: exactly 4 beats.
- No emojis. No em dashes.`, 2400);

  type Raw = {
    caption?: string;
    first_comment?: string;
    reel_script?: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] };
  };
  const raw = safeParse<Raw>(text, {});

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
