// POST /api/email/send-all
// Sends every pending parked draft. Returns per-id results.

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sendDraft } from "@/lib/email/jmap";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const sb = supabaseServer();
  const { data: rows, error } = await sb
    .from("inbox_emails")
    .select("id, from_address, fastmail_draft_id")
    .eq("draft_status", "pending")
    .not("fastmail_draft_id", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const r of rows ?? []) {
    if (!r.fastmail_draft_id) continue;
    try {
      await sendDraft(r.fastmail_draft_id, r.from_address);
      await sb
        .from("inbox_emails")
        .update({ draft_status: "sent", sent_at: new Date().toISOString(), send_error: null })
        .eq("id", r.id);
      results.push({ id: r.id, ok: true });
    } catch (e) {
      await sb
        .from("inbox_emails")
        .update({ draft_status: "failed", send_error: (e as Error).message })
        .eq("id", r.id);
      results.push({ id: r.id, ok: false, error: (e as Error).message });
    }
  }

  return NextResponse.json({
    ok: true,
    attempted: results.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
