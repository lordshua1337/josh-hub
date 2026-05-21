// IG Graph webhook — DM intake.
// GET = Meta verification handshake.
// POST = real-time DM/comment/story events. Each message gets stored, then
// the cron at /api/cron/ig-replies classifies + drafts the reply.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

type MetaEntry = {
  id?: string;
  time?: number;
  messaging?: {
    sender?: { id?: string; username?: string; name?: string };
    recipient?: { id?: string };
    timestamp?: number;
    message?: { mid?: string; text?: string };
  }[];
  changes?: {
    field?: string;
    value?: Record<string, unknown>;
  }[];
};

export async function POST(req: NextRequest) {
  let body: { entry?: MetaEntry[] } = {};
  try {
    body = (await req.json()) as { entry?: MetaEntry[] };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const sb = supabaseServer();

  // Best-effort store of every event for replay/debug.
  await sb.from("ingester_state").upsert(
    {
      id: "ig_webhook",
      last_run_at: new Date().toISOString(),
      cursor: { last_event: body as never },
      notes: null,
    },
    { onConflict: "id" }
  );

  const rows: {
    ig_thread_id: string | null;
    ig_message_id: string;
    sender_id: string;
    sender_username: string | null;
    sender_name: string | null;
    body: string;
    raw_event: never;
    received_at: string;
    source_kind: string;
  }[] = [];

  for (const entry of body.entry ?? []) {
    for (const m of entry.messaging ?? []) {
      const text = m.message?.text;
      const mid = m.message?.mid;
      const senderId = m.sender?.id;
      if (!text || !mid || !senderId) continue;
      rows.push({
        ig_thread_id: m.recipient?.id || null,
        ig_message_id: mid,
        sender_id: senderId,
        sender_username: m.sender?.username || null,
        sender_name: m.sender?.name || null,
        body: text,
        raw_event: m as never,
        received_at: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
        source_kind: "dm",
      });
    }
  }

  if (rows.length) {
    await sb.from("ig_messages").upsert(rows, { onConflict: "ig_message_id" });
  }

  return NextResponse.json({ ok: true, captured: rows.length });
}
