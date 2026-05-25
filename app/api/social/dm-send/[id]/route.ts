// POST /api/social/dm-send/[id]
// Sends a drafted IG DM reply via IG Graph. Without IG_GRAPH_TOKEN we mark
// the row "ready_to_send" and surface the body so Josh can copy-paste it
// for the time being.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sendIgDm } from "@/lib/social/dm";

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

  if (!row.sender_id) return NextResponse.json({ error: "no_sender" }, { status: 400 });

  const send = await sendIgDm(row.sender_id, row.draft_reply);

  // No creds yet — preserve the draft + mark ready_to_send for copy/paste.
  if (send.noCreds) {
    await sb.from("ig_messages").update({ reply_status: "ready_to_send" }).eq("id", id);
    return NextResponse.json({
      ok: true,
      queued: true,
      reason: "IG creds not connected. Draft preserved -- copy/paste it for now.",
      draft_reply: row.draft_reply,
    });
  }

  if (!send.ok) {
    await sb.from("ig_messages").update({ reply_status: "failed", send_error: send.error }).eq("id", id);
    return NextResponse.json({ error: send.error }, { status: 500 });
  }

  await sb
    .from("ig_messages")
    .update({ reply_status: "sent", sent_at: new Date().toISOString(), send_error: null })
    .eq("id", id);
  return NextResponse.json({ ok: true, message_id: send.messageId });
}
