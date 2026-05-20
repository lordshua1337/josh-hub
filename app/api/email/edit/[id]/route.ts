// PATCH /api/email/edit/[id]
// Update the body of a parked draft before send. Pushes the new body to
// Fastmail (so the Drafts mailbox stays in sync) and to the DB.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { updateDraftBody } from "@/lib/email/jmap";

export const dynamic = "force-dynamic";

const Schema = z.object({ body: z.string().min(1).max(20000) });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });

  const sb = supabaseServer();
  const { data: row, error } = await sb
    .from("inbox_emails")
    .select("id, fastmail_draft_id, draft_status")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.draft_status !== "pending")
    return NextResponse.json({ error: "not_pending" }, { status: 400 });
  if (!row.fastmail_draft_id)
    return NextResponse.json({ error: "no_parked_draft" }, { status: 400 });

  try {
    await updateDraftBody(row.fastmail_draft_id, parsed.data.body);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  await sb.from("inbox_emails").update({ draft_response: parsed.data.body }).eq("id", id);
  return NextResponse.json({ ok: true });
}
