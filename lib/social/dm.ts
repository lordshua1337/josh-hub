// IG DM responder — the ManyChat replacement.
// Classifies inbound IG messages, drafts a reply in Josh's voice, parks it
// for review. Cron route picks up pending rows and (optionally) ships
// replies via IG Graph when configured.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import PROMETHEUS_VOICE from "./voices/prometheus";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Hybrid auto-responder config ─────────────────────────────────────────────
// Only mechanical keyword triggers auto-send. Everything human (real leads,
// complaints, conversations) is drafted and parked for review. A trigger reply
// is a fixed, on-brand message — never LLM-generated — so an auto-send can
// never go off-tone.
//
// Keyed by the trigger keyword (lowercase). The signoff slides tell people to
// DM a keyword; this is what they get back, instantly.
export const TRIGGER_REPLIES: Record<string, string> = {
  audit:
    "Happy to help. Send me a quick list of the tools your team runs on and the two things eating the most time each week, and I'll send back a short written diagnostic in a couple days. No call needed unless you want one.",
};

// Match an inbound DM to a trigger keyword. Guarded against false positives:
// the keyword only counts when the message is short (people send the keyword
// on its own, e.g. "AUDIT" or "audit please"), so a sentence like "I don't
// think I need an audit yet" won't fire an auto-send.
export function matchTriggerKeyword(body: string): string | null {
  const tokens = body.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 5) return null;
  const lower = body.toLowerCase();
  for (const kw of Object.keys(TRIGGER_REPLIES)) {
    if (new RegExp(`\\b${kw}\\b`, "i").test(lower)) return kw;
  }
  return null;
}

export type SendResult = { ok: boolean; messageId?: string; error?: string; noCreds?: boolean };

// Send a DM reply via the IG Graph API (RESPONSE type — valid only inside the
// 24h window after the user messaged us). Returns noCreds:true when the token
// isn't wired yet, so callers can fall back to a manual/review path.
export async function sendIgDm(senderId: string, text: string): Promise<SendResult> {
  const igToken = process.env.IG_GRAPH_TOKEN;
  const igUserId = process.env.IG_USER_ID;
  if (!igToken || !igUserId) return { ok: false, noCreds: true, error: "IG creds not connected" };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text },
        messaging_type: "RESPONSE",
        access_token: igToken,
      }),
    });
    const json = (await res.json()) as { message_id?: string; error?: { message: string } };
    if (!res.ok || !json.message_id) return { ok: false, error: json.error?.message || `HTTP ${res.status}` };
    return { ok: true, messageId: json.message_id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type DmCategory =
  | "lead_inquiry"        // they want what we sell
  | "audit_request"       // matches our keyword DM trigger
  | "support_question"    // something is broken / they need help
  | "compliment"          // thank you / liked the post / loved it
  | "complaint"           // upset / disagreement
  | "spam"                // bot / mass DM / off-topic outreach
  | "personal"            // friend / family / off-channel
  | "unclassifiable";

export type DmClassification = {
  category: DmCategory;
  confidence: number;
  reasoning: string;
};

const CLASSIFIER_PROMPT = `You're classifying an Instagram DM that came into the Prometheus Consulting account.

Categories:
- lead_inquiry      They're asking about what Prometheus does or showing buying intent
- audit_request     They typed a trigger keyword like "AUDIT" or asked for the systems teardown
- support_question  Something is broken / they need help with a thing they already paid for
- compliment        Thank you / great post / loved the carousel — no question attached
- compulint         (typo intentional) -- ignore this
- complaint         Upset / disagreement / pushback
- spam              Bot, mass DM, agency pitch, OF link, anything off-topic
- personal          A friend, family, or off-channel personal message
- unclassifiable    None of the above

Respond ONLY with raw JSON: {"category": "...", "confidence": 0.0-1.0, "reasoning": "..."}

DM:
"""
{body}
"""`;

export async function classifyDm(body: string): Promise<DmClassification> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: CLASSIFIER_PROMPT.replace("{body}", body.slice(0, 2000)) }],
  });
  const text = res.content[0].type === "text" ? res.content[0].text : "";
  const cleaned = text.trim().replace(/^```json\n?|\n?```$/g, "");
  try {
    return JSON.parse(cleaned) as DmClassification;
  } catch {
    return { category: "unclassifiable", confidence: 0.5, reasoning: "parse failed" };
  }
}

const CATEGORY_INSTRUCTIONS: Partial<Record<DmCategory, string>> = {
  lead_inquiry:
    'Engage. Ask one specific qualifying question that respects their time. Offer the scheduling link if it feels natural: cal.com/prometheus-consulting/15min. Keep it under 4 sentences.',
  audit_request:
    'They triggered the audit keyword. Send the audit intro: "Send me your tool stack (just a list) and your top 2 bottlenecks. I\'ll send back a written diagnostic inside 48 hours. No call required unless you want one."',
  support_question:
    'Acknowledge the issue. Ask one clarifying question. Promise a follow-up within 24h if you can\'t solve it on the spot. No corporate-support voice.',
  compliment:
    "Warm acknowledgment with genuine gratitude. One line. Don't pitch in a thank-you reply.",
  complaint:
    "Acknowledge their take without being defensive. Ask what they'd like you to do about it.",
  personal:
    "Reply naturally as Josh -- not as a brand. One sentence. If they want a longer chat, point them to text/phone.",
  spam: "Do not reply. Set draft_reply to empty string.",
  unclassifiable:
    "Ask one clarifying question to understand what they want. Keep it short and human.",
};

export async function draftDmReply(body: string, classification: DmClassification): Promise<string> {
  if (classification.category === "spam") return "";

  const instructions = CATEGORY_INSTRUCTIONS[classification.category] || "Reply naturally as Josh.";
  const prompt = `${PROMETHEUS_VOICE}

You're writing a single Instagram DM reply -- not a post. Conversational. Lowercase okay. No emojis. No em dashes.

CONTEXT: This DM was classified as "${classification.category}" with confidence ${classification.confidence}.
WHY: ${classification.reasoning}

INSTRUCTIONS: ${instructions}

The DM you're replying to:
"""
${body}
"""

Write Josh's reply. Just the reply text -- no greeting, no signature, no metadata. <= 3 short paragraphs, usually 1-2 sentences.`;

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });
  return res.content[0].type === "text" ? res.content[0].text.trim() : "";
}
