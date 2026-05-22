// POST /api/sequences/[slug]/steps
// Body: { wait_days, subject?, body }
// Appends a step at the end of the sequence (auto-increment step_order).

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Schema = z.object({
  wait_days: z.number().int().min(0).max(365),
  subject: z.string().max(300).optional(),
  body: z.string().min(1).max(20000),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });
  const sb = supabaseServer();

  const { data: seq } = await sb.from("sequences").select("id").eq("slug", slug).maybeSingle();
  if (!seq) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Next step_order
  const { data: maxRow } = await sb
    .from("sequence_steps")
    .select("step_order")
    .eq("sequence_id", seq.id)
    .order("step_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((maxRow?.step_order as number | null) ?? 0) + 1;

  const { error } = await sb.from("sequence_steps").insert({
    sequence_id: seq.id,
    step_order: nextOrder,
    wait_days: parsed.data.wait_days,
    subject: parsed.data.subject,
    body: parsed.data.body,
  } as never);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
