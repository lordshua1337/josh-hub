// PATCH /api/campaigns/[slug] — edit name / theme / pitch / status / cadence.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Schema = z.object({
  name: z.string().max(120).optional(),
  theme: z.string().max(500).optional(),
  pitch: z.string().max(2000).optional(),
  status: z.enum(["planning", "active", "paused", "shipped", "archived"]).optional(),
  cadence: z.string().max(40).optional(),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const sb = supabaseServer();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(parsed.data)) if (v !== undefined) update[k] = v;
  const { error } = await sb.from("campaigns").update(update as never).eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
