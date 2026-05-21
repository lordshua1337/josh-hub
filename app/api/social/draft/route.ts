// POST /api/social/draft
// Body: { brand, post_type, topic }
// post_type comes from the registry in lib/social/post-types.ts. Carousels
// get multi-slide content stored in copy_blocks as { is_carousel, slides[], caption }.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { getBrand } from "@/lib/social/brands";
import { getPostType, POST_TYPES } from "@/lib/social/post-types";
import { draftPost } from "@/lib/social/copy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Schema = z.object({
  brand: z.string().min(1),
  post_type: z.string().min(1),
  topic: z.string().min(3).max(500),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });

  const validTypes = POST_TYPES.map((p) => p.slug);
  if (!validTypes.includes(parsed.data.post_type)) {
    return NextResponse.json({ error: "unknown_post_type", valid: validTypes }, { status: 400 });
  }
  const def = getPostType(parsed.data.post_type);
  const brand = getBrand(parsed.data.brand);

  let copy;
  try {
    copy = await draftPost(brand, parsed.data.post_type, parsed.data.topic);
  } catch (e) {
    return NextResponse.json({ error: `draft failed: ${(e as Error).message}` }, { status: 500 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("social_posts")
    .insert({
      brand: brand.slug,
      post_type: parsed.data.post_type,
      composition: def.kind === "carousel" ? "carousel" : def.compositions[0],
      topic: parsed.data.topic,
      copy_blocks: copy as never,
      status: "draft",
      platform: "instagram",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id, copy });
}
