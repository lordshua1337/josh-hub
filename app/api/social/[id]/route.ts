// PATCH /api/social/[id]
// General-purpose mutator for a social_posts row. Used by /content/calendar
// to schedule drafts and by future Campaign Builder to assign campaign_id.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Schema = z.object({
  scheduled_for: z.string().nullable().optional(),
  status: z.string().max(40).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  const sb = supabaseServer();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.scheduled_for !== undefined) update.scheduled_for = parsed.data.scheduled_for;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  const { error } = await sb.from("social_posts").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
