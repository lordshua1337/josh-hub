// POST /api/sequences/new
// Body: { slug, name, goal? }

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Schema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  name: z.string().min(2).max(120),
  goal: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });
  const sb = supabaseServer();
  const { error } = await sb
    .from("sequences")
    .insert({ slug: parsed.data.slug, name: parsed.data.name, goal: parsed.data.goal } as never);
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
