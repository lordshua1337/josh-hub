// POST /api/social/discard/[id]
// Flips a social_posts row to "discarded" so it falls out of the active
// drafts list. Used by the composer wizard + the legacy drafts list.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();
  const { error } = await sb
    .from("social_posts")
    .update({ status: "discarded" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
