// PATCH /api/docs/[id] — autosave doc fields, recipient, title, notes, status.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Schema = z.object({
  title: z.string().max(200).optional(),
  status: z.enum(["draft", "sent", "viewed", "signed", "cancelled", "completed"]).optional(),
  field_values: z.record(z.string(), z.string()).optional(),
  recipient_name: z.string().max(200).optional(),
  recipient_email: z.string().max(320).optional(),
  recipient_company: z.string().max(200).optional(),
  notes: z.string().max(20000).optional(),
  signed_at: z.string().optional(),
  cancelled_at: z.string().optional(),
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
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) update[k] = v;
  }
  const { error } = await sb.from("documents").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
