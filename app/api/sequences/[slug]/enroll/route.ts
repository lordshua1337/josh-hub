// POST /api/sequences/[slug]/enroll
// Body: { lead_id }
// Enrolls a lead into the sequence at step 0 with next_due_at = now
// (so the cron picks it up on the next run).

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Schema = z.object({ lead_id: z.string().uuid() });

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });
  const sb = supabaseServer();

  const { data: seq } = await sb.from("sequences").select("id, status").eq("slug", slug).maybeSingle();
  if (!seq) return NextResponse.json({ error: "sequence_not_found" }, { status: 404 });
  if (seq.status !== "active") return NextResponse.json({ error: "sequence_not_active" }, { status: 400 });

  const now = new Date().toISOString();
  const { error } = await sb.from("lead_sequence_progress").insert({
    lead_id: parsed.data.lead_id,
    sequence_id: seq.id,
    current_step: 0,
    status: "active",
    next_due_at: now,
    enrolled_at: now,
  } as never);
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "already_enrolled" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
