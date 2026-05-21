// Draft copy for a single post in a brand's voice.
// Generates a JSON object matching the composition's shape.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import PROMETHEUS_VOICE from "./voices/prometheus";
import type { Brand } from "./brands";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const VOICES: Record<string, string> = {
  prometheus: PROMETHEUS_VOICE,
};

export type DeclarationCopy = {
  kicker?: string;
  headline: string;
  emphasize?: string;
  footer?: string;
  caption: string;
};

export async function draftDeclaration(brand: Brand, topic: string): Promise<DeclarationCopy> {
  const voice = VOICES[brand.slug];
  if (!voice) throw new Error(`No voice file for brand: ${brand.slug}`);

  const prompt = `${voice}

You're writing ONE Instagram post in the "declaration" format. The visual is typography-led, asymmetric, on a dark warm background. There is no background image.

The composition has these slots:
- kicker:   small all-caps mono line that opens the post. Optional. 6 words max. The restrained setup.
- headline: the dominant line. The pivot, the punch. 10 words max. THE thing that hits.
- emphasize: ONE single word from the headline to color in amber. The word that carries the weight.
- footer:   optional small line under the headline. 15 words max. The nuance / specificity / one-more-twist.
- caption:  the IG caption that goes BELOW the image. Longer-form, 2-4 short paragraphs. Conversational. Ends with a question or a path forward. Add 4-6 relevant hashtags at the bottom on their own line.

Topic for this post: "${topic}"

Constraints:
- NO emojis anywhere.
- NO em dashes (use -- if you must).
- The on-image copy (kicker + headline + footer) must read as a single thought, not a paragraph.
- The kicker should not repeat the headline's verb or noun.
- The emphasize word must be IN the headline string exactly as written.
- Caption must NOT just restate the on-image copy. It expands, gives an example, asks a question.

Return ONLY a raw JSON object matching this shape (no markdown, no backticks):
{"kicker": "...", "headline": "...", "emphasize": "...", "footer": "...", "caption": "..."}`;

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.content[0].type === "text" ? res.content[0].text : "";
  const cleaned = text.trim().replace(/^```json\n?|\n?```$/g, "");
  const parsed = JSON.parse(cleaned) as DeclarationCopy;

  // Defensive: trim, drop accidental emojis, enforce maxes
  return {
    kicker: parsed.kicker?.trim().slice(0, 60) || undefined,
    headline: parsed.headline.trim().slice(0, 120),
    emphasize: parsed.emphasize?.trim() || undefined,
    footer: parsed.footer?.trim().slice(0, 160) || undefined,
    caption: parsed.caption.trim(),
  };
}
