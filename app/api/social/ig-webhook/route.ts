// GET (verification) + POST (events) for Instagram Graph webhooks.
// Replaces ManyChat. Handles:
//   - DM auto-responses (classify intent, draft Josh-voice reply)
//   - Comment-triggered DMs ("post DEMO to get the link" style)
//   - Story replies, mentions
//
// Phase 1: skeleton. When IG_WEBHOOK_VERIFY_TOKEN + IG_GRAPH_TOKEN are set,
// we route events into draft replies stored in public.ig_messages (table
// added in a follow-up migration). For now, we log and store the raw event.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Meta sends a GET to verify the subscription. We echo their challenge if
// the verify_token matches.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = (process.env.IG_WEBHOOK_VERIFY_TOKEN || "").trim();
  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "verify_failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  // For phase 1: store the raw event in a generic "ig_events" log table
  // (skipping the per-message structured table until we wire IG creds).
  // The cron-style classifier + responder will live in /api/cron/ig-replies
  // once the table is added.
  const sb = supabaseServer();
  await sb.from("ingester_state").upsert(
    {
      id: "ig_webhook",
      last_run_at: new Date().toISOString(),
      cursor: { last_event: body as never },
      notes: "Raw event captured. Auto-responder requires IG_GRAPH_TOKEN to ship replies.",
    },
    { onConflict: "id" }
  );
  return NextResponse.json({ ok: true });
}
