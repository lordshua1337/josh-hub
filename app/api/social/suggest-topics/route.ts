// POST /api/social/suggest-topics
// Body: { post_type: string, brand?: string, count?: number }
// Returns: { topics: { title: string, hook: string }[] }
//
// Used by wizard Step 2 when Josh hits "Suggest topics". The drafter is
// gated on having a topic, so this endpoint is the IDEATE half of the
// "ideate → generate → publish" workflow. Each suggestion is a complete
// topic string that can be dropped into the topic textarea.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { getBrand } from "@/lib/social/brands";
import { getPostType, POST_TYPES } from "@/lib/social/post-types";
import PROMETHEUS_VOICE from "@/lib/social/voices/prometheus";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const Schema = z.object({
  post_type: z.string().min(1),
  brand: z.string().default("prometheus"),
  count: z.number().int().min(3).max(8).default(5),
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  const validTypes = POST_TYPES.map((p) => p.slug);
  if (!validTypes.includes(parsed.data.post_type)) {
    return NextResponse.json({ error: "unknown_post_type", valid: validTypes }, { status: 400 });
  }
  const def = getPostType(parsed.data.post_type);
  const brand = getBrand(parsed.data.brand);
  // Brand-voice file kept off the suggestions to save tokens — they're
  // short prompts, not full copy. The voiceHint on the post type is enough.

  const prompt = `You suggest ${parsed.data.count} specific post topics for a Prometheus Consulting Instagram ${def.kind} post in the "${def.label}" format.

BRAND VOICE (excerpt):
${PROMETHEUS_VOICE.slice(0, 800)}

POST TYPE DESCRIPTION: ${def.description}
TONE FOR THIS TYPE: ${def.voiceHint}

Each suggestion must be:
- A specific topic Josh could write about RIGHT NOW (no "AI in general", "future of work", etc. — be concrete)
- Drawn from the operator world (industrial services, professional services, founders, ops leaders, mid-market)
- Different from the other suggestions in this batch (cover different angles)
- 1-2 sentences max, written as if it were the brief for the post

Brand: ${brand.name}.

Return ONLY raw JSON:
{
  "topics": [
    { "title": "short 4-7 word label", "topic": "the actual topic prompt Josh can drop into the drafter, 1-2 sentences" }
  ]
}`;

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text : "";
    const cleaned = text.trim().replace(/^```json\n?|\n?```$/g, "");
    const parsedOut = JSON.parse(cleaned) as { topics?: { title?: string; topic?: string }[] };
    const topics = (parsedOut.topics || [])
      .filter((t): t is { title: string; topic: string } => Boolean(t?.title && t?.topic))
      .slice(0, parsed.data.count);
    return NextResponse.json({ ok: true, topics });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
