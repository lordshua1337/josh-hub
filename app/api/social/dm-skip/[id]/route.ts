// POST /api/social/dm-skip/[id]
// Marks an IG DM as handled-without-reply. Used when Josh sees a DM that
// doesn't need a response (e.g. spam the classifier missed, or a comment
// he handled in-app).

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();
  const { error } = await sb
    .from("ig_messages")
    .update({ reply_status: "skipped" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
