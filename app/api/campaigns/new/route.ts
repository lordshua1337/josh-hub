// POST /api/campaigns/new
// Body: { slug, name, theme?, pitch?, cadence? }
// Creates a campaign in planning status.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Schema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  name: z.string().min(2).max(120),
  theme: z.string().max(500).optional(),
  pitch: z.string().max(2000).optional(),
  cadence: z.string().max(40).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("campaigns")
    .insert({
      slug: parsed.data.slug,
      name: parsed.data.name,
      theme: parsed.data.theme,
      pitch: parsed.data.pitch,
      cadence: parsed.data.cadence || "weekly",
      status: "planning",
    } as never)
    .select("id, slug")
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}
