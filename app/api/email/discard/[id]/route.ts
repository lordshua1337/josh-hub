// POST /api/email/discard/[id]
// Discards a parked draft -- moves it to Trash in Fastmail + marks the DB row.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { discardDraft } from "@/lib/email/jmap";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();
  const { data: row, error } = await sb
    .from("inbox_emails")
    .select("id, fastmail_draft_id, draft_status")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.fastmail_draft_id) {
    try {
      await discardDraft(row.fastmail_draft_id);
    } catch (e) {
      // best-effort; still update DB so it disappears from the queue
      console.error("discardDraft:", (e as Error).message);
    }
  }
  await sb
    .from("inbox_emails")
    .update({ draft_status: "discarded", discarded_at: new Date().toISOString() })
    .eq("id", id);
  return NextResponse.json({ ok: true });
}
