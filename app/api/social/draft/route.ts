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
  image_url: z.string().min(1).max(500).optional(),
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

  // If Josh picked a forge image, attach it to the hero slide. For singles
  // that's the single slide; for carousels it's the carousel_hook. Body
  // slides stay typography — the image stops the scroll, the text delivers.
  if (parsed.data.image_url && copy.slides.length > 0) {
    const heroIdx = copy.slides.findIndex(
      (s) => s.composition === "declaration" || s.composition === "carousel_hook"
    );
    if (heroIdx >= 0) {
      copy.slides[heroIdx] = { ...copy.slides[heroIdx], imageUrl: parsed.data.image_url };
    }
  }

  // first_comment + reel_script ride along in metadata so the Package panel
  // can surface them without bloating copy_blocks (which the renderer reads
  // per-slide). Caption stays inside copy_blocks since it's part of the post.
  const metadata: Record<string, unknown> = {};
  if (copy.first_comment) metadata.first_comment = copy.first_comment;
  if (copy.reel_script) metadata.reel_script = copy.reel_script;

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("social_posts")
    .insert({
      brand: brand.slug,
      post_type: parsed.data.post_type,
      composition: def.kind === "carousel" ? "carousel" : def.compositions[0],
      topic: parsed.data.topic,
      copy_blocks: copy as never,
      metadata: Object.keys(metadata).length ? (metadata as never) : null,
      image_url: parsed.data.image_url || null,
      status: "draft",
      platform: "instagram",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id, copy });
}
