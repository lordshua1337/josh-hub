// PATCH /api/projects/[slug]
// Body: { notes?, description?, current_status?, mode? }
// Edit a project (idea or deployed) in public.projects.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Schema = z.object({
  notes: z.string().max(20000).optional(),
  description: z.string().max(2000).optional(),
  current_status: z.enum(["idea", "planned", "future", "active", "recent", "stale", "archived", "deployed"]).optional(),
  mode: z.string().max(40).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  const sb = supabaseServer();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;
  if (parsed.data.description !== undefined) update.description = parsed.data.description;
  if (parsed.data.current_status !== undefined) update.current_status = parsed.data.current_status;
  if (parsed.data.mode !== undefined) update.mode = parsed.data.mode;

  const { error } = await sb.from("projects").update(update as never).eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
