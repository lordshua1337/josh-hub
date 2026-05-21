// POST /api/social/dm-send/[id]
// Sends a drafted IG DM reply via IG Graph. Without IG_GRAPH_TOKEN we mark
// the row "ready_to_send" and surface the body so Josh can copy-paste it
// for the time being.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();
  const { data: row, error } = await sb
    .from("ig_messages")
    .select("id, sender_id, draft_reply, reply_status")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!row.draft_reply) return NextResponse.json({ error: "no_draft" }, { status: 400 });
  if (row.reply_status === "sent") return NextResponse.json({ ok: true, already_sent: true });

  const igToken = process.env.IG_GRAPH_TOKEN;
  const igUserId = process.env.IG_USER_ID;
  if (!igToken || !igUserId) {
    await sb
      .from("ig_messages")
      .update({ reply_status: "ready_to_send" })
      .eq("id", id);
    return NextResponse.json({
      ok: true,
      queued: true,
      reason: "IG creds not connected. Draft preserved -- copy/paste it for now.",
      draft_reply: row.draft_reply,
    });
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: row.sender_id },
        message: { text: row.draft_reply },
        messaging_type: "RESPONSE",
        access_token: igToken,
      }),
    });
    const json = (await res.json()) as { message_id?: string; error?: { message: string } };
    if (!res.ok || !json.message_id) {
      const msg = json.error?.message || `HTTP ${res.status}`;
      await sb.from("ig_messages").update({ reply_status: "failed", send_error: msg }).eq("id", id);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    await sb
      .from("ig_messages")
      .update({ reply_status: "sent", sent_at: new Date().toISOString(), send_error: null })
      .eq("id", id);
    return NextResponse.json({ ok: true, message_id: json.message_id });
  } catch (e) {
    await sb.from("ig_messages").update({ reply_status: "failed", send_error: (e as Error).message }).eq("id", id);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
