// Classifier. Single Claude Haiku call per email. Returns category + confidence
// + reasoning. Ported from the email-engine project.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { EmailCategory } from "./categories";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const CLASSIFICATION_PROMPT = `You are an email classifier for a business inbox. Classify the email into exactly one category.

Categories:
- sales_inquiry: Someone asking about pricing, services, or how things work
- support_request: Someone needs help with a problem
- complaint: Someone is upset or angry about something
- spam_nonhuman: Automated spam, marketing bots, non-human sender names
- spam_human: Cold outreach from real humans selling services
- billing: Invoices, payment requests, payment status inquiries
- job_seeker: Someone looking for a job FROM the business (not trying to hire the business)
- hiring_investor: Someone wanting to hire the business owner or invest
- meeting_request: "Can we hop on a call" "Are you free Thursday"
- thank_you: Positive feedback, gratitude, appreciation
- system_notification: Password resets, shipping confirmations, app notifications, automated alerts
- introduction: Three-way intro email "Meet Sarah, meet Josh"
- legal: Contracts, terms, legal notices, anything with legal language
- partnership: Collaboration proposals, joint ventures
- newsletter: Subscribed content, industry news
- personal_suspect: Clearly personal email that shouldn't be on a business inbox
- unsubscribe: Someone asking to be removed from a mailing list
- bounce: Delivery failure, address not found, mailbox full
- refund_cancel: Refund request or cancellation request
- follow_up: "Just checking in" "Any update" "Circling back"
- unclassifiable: Doesn't fit any category above

Respond with ONLY a JSON object: {"category": "category_name", "confidence": 0.0-1.0, "reasoning": "brief explanation"}

Email:
From: {from}
Subject: {subject}
Body: {body}`;

export async function classifyEmail(
  from: string,
  subject: string,
  body: string
): Promise<{ category: EmailCategory; confidence: number; reasoning: string }> {
  const prompt = CLASSIFICATION_PROMPT.replace("{from}", from)
    .replace("{subject}", subject)
    .replace("{body}", body.slice(0, 2000));

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    const parsed = JSON.parse(text.trim().replace(/^```json\n?|\n?```$/g, "")) as {
      category: EmailCategory;
      confidence: number;
      reasoning: string;
    };
    return parsed;
  } catch {
    return { category: "unclassifiable", confidence: 0.5, reasoning: "Failed to parse classifier output" };
  }
}
