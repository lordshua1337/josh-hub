// POST /api/social/draft
// Body: { brand: 'prometheus', post_type: 'declaration', topic: '...' }
//
// Drafts copy in the brand voice, stores a row in public.social_posts with
// status='draft', and returns the row so the UI can show the preview. The
// rendered image URL is computed from /api/social/render?... params (kept
// dynamic so edits to the copy re-render without re-baking PNGs).

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { getBrand } from "@/lib/social/brands";
import { draftDeclaration } from "@/lib/social/copy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Schema = z.object({
  brand: z.string().min(1),
  post_type: z.enum(["declaration"]),
  composition: z.enum(["declaration"]).optional(),
  topic: z.string().min(3).max(500),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });

  const { brand: brandSlug, post_type, topic } = parsed.data;
  const composition = parsed.data.composition ?? post_type;
  const brand = getBrand(brandSlug);

  let copy;
  try {
    copy = await draftDeclaration(brand, topic);
  } catch (e) {
    return NextResponse.json({ error: `draft failed: ${(e as Error).message}` }, { status: 500 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("social_posts")
    .insert({
      brand: brand.slug,
      post_type,
      composition,
      topic,
      copy_blocks: copy as never,
      status: "draft",
      platform: "instagram",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id, copy });
}
