// POST /api/email/send/[id]
// Submits the parked Fastmail draft + marks the row sent. Server-only,
// gated by the hub's middleware (must be signed in).

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sendDraft } from "@/lib/email/jmap";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();

  const { data: row, error } = await sb
    .from("inbox_emails")
    .select("id, from_address, fastmail_draft_id, draft_status")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.draft_status === "sent") return NextResponse.json({ ok: true, already_sent: true });
  if (!row.fastmail_draft_id)
    return NextResponse.json({ error: "no_parked_draft" }, { status: 400 });

  try {
    await sendDraft(row.fastmail_draft_id, row.from_address);
  } catch (e) {
    await sb
      .from("inbox_emails")
      .update({ draft_status: "failed", send_error: (e as Error).message })
      .eq("id", id);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  await sb
    .from("inbox_emails")
    .update({ draft_status: "sent", sent_at: new Date().toISOString(), send_error: null })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
