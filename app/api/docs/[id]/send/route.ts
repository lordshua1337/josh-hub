// POST /api/docs/[id]/send
// Generates a sign_token, sets status=sent, returns the public sign URL.
// (Email delivery via Resend can plug in here later; for now Josh shares
// the URL manually until the email engine is wired to this surface.)

import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://prometheus-hub.vercel.app";
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();
  const { data: row, error } = await sb
    .from("documents")
    .select("id, status, sign_token, recipient_name, recipient_email")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!row.recipient_email) return NextResponse.json({ error: "no_recipient_email" }, { status: 400 });

  const token = row.sign_token || randomBytes(18).toString("base64url");
  const now = new Date().toISOString();
  const { error: upErr } = await sb
    .from("documents")
    .update({ sign_token: token, status: "sent", sent_at: now, updated_at: now } as never)
    .eq("id", id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  try {
    await sb.from("document_events").insert({
      document_id: id,
      event_type: "sent",
      actor: "owner",
      meta: { recipient: row.recipient_email } as never,
    } as never);
  } catch {
    // Audit event is non-critical; never fail the send because of it.
  }

  return NextResponse.json({ ok: true, sign_url: `${siteBase()}/sign/${token}` });
}
