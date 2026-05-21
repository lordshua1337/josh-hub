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
  emphasize?: string;
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
};

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

Slots:
- kicker:    small all-caps mono opener, optional. <= 6 words.
- headline:  the dominant line. <= 10 words.
- emphasize: ONE word from the headline to color amber.
- footer:    small line below headline. <= 18 words.
- caption:   IG caption. 2-4 short paragraphs. Ends with a question or path forward. 4-6 hashtags on separate line at bottom.

Topic: "${topic}"

Constraints:
- NO emojis. NO em dashes.
- emphasize must appear verbatim in headline.
- caption must NOT just restate the headline.

Return ONLY raw JSON:
{"kicker": "...", "headline": "...", "emphasize": "...", "footer": "...", "caption": "..."}`);
  const p = safeParse(text, { headline: topic, caption: "" }) as {
    kicker?: string; headline: string; emphasize?: string; footer?: string; caption: string;
  };
  return {
    is_carousel: false,
    slides: [
      { composition: "declaration", kicker: p.kicker, headline: p.headline, emphasize: p.emphasize, footer: p.footer },
    ],
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
- emphasize:     ONE word from trueLine to amber.
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
      {
        composition: "split_contrast",
        theySaidLabel: p.theySaidLabel,
        theySaid: p.theySaid,
        trueLabel: p.trueLabel,
        trueLine: p.trueLine,
        emphasize: p.emphasize,
      },
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

Return ONLY raw JSON:
{
  "hook": {
    "kicker": "${stepCount} PLAYS",
    "headline": "...",
    "emphasize": "...",
    "swipeHint": "swipe to start ->"
  },
  "steps": [
    { "title": "...", "body": "...", "emphasize": "..." }
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
- Every step must be specific enough to start TODAY.
- Vary the verb across steps (don't start all with "Build" or "Set up").
- Each step body must reference a concrete tool / metric / artifact.
- No emojis. No em dashes. No corporate slop ("transform" "leverage" "synergize").
- Caption: 600-900 chars. 2-4 short paragraphs, references the step titles. Ends with "- Josh" on its own line. NO link in the caption (IG penalizes that).
- first_comment: 2-4 short lines. This is where the email + URL live ("josh@prometheusconsulting.ai" + "prometheusconsulting.ai"). Make it feel like a planted follow-up, not a CTA.
- reel_script: exactly 4 beats (HOOK / SETUP / PAYOFF / CTA). 100-180 total words. Talking-head cadence: short sentences, specific numbers, no adjective tax.`, 3200);

  type Raw = {
    hook?: { kicker?: string; headline?: string; emphasize?: string; swipeHint?: string };
    steps?: { title?: string; body?: string; emphasize?: string }[];
    cta?: { closer?: string; cta?: string; link?: string };
    caption?: string;
    first_comment?: string;
    reel_script?: { duration?: string; beats?: { t?: string; label?: string; script?: string }[] };
  };
  const raw = safeParse<Raw>(text, {});
  const steps = (raw.steps ?? []).slice(0, stepCount);

  const slides: SlideContent[] = [
    {
      composition: "carousel_hook",
      kicker: raw.hook?.kicker || `${stepCount} PLAYS`,
      headline: raw.hook?.headline || topic,
      emphasize: raw.hook?.emphasize,
      swipeHint: raw.hook?.swipeHint || "swipe →",
    },
  ];
  for (let i = 0; i < stepCount; i++) {
    const s = steps[i] || { title: `Step ${i + 1}`, body: "" };
    slides.push({
      composition: "numbered_step",
      index: i + 1,
      total: stepCount,
      title: s.title || `Step ${i + 1}`,
      body: s.body || "",
      emphasize: s.emphasize,
    });
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

// ----- dispatcher -----
export async function draftPost(brand: Brand, postTypeSlug: string, topic: string): Promise<PostCopy> {
  const def = getPostType(postTypeSlug);
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
