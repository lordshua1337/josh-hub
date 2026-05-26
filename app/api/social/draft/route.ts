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
  focal_x: z.number().min(0).max(100).optional(),
  focal_y: z.number().min(0).max(100).optional(),
  focal_zoom: z.number().min(0.3).max(3).optional(),
  overlay: z.enum(["subtle", "strong", "fade-bottom", "wordmark", "none"]).optional(),
  slide_count: z.number().int().min(3).max(12).optional(),
  grounding: z.record(z.string(), z.string()).optional(),
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
    copy = await draftPost(brand, parsed.data.post_type, parsed.data.topic, parsed.data.slide_count, parsed.data.grounding);
  } catch (e) {
    return NextResponse.json({ error: `draft failed: ${(e as Error).message}` }, { status: 500 });
  }

  // If Josh picked a forge image, attach it. For panoramas the image goes
  // on EVERY panel slide (each shows a different slice of it). For other
  // post types it goes on the hero slide only (declaration / carousel_hook).
  if (parsed.data.image_url && copy.slides.length > 0) {
    if (parsed.data.post_type === "panel_panorama") {
      copy.slides = copy.slides.map((s) =>
        s.composition === "panel_slide"
          ? {
              ...s,
              imageUrl: parsed.data.image_url,
              focalX: parsed.data.focal_x,
              focalY: parsed.data.focal_y,
              zoom: parsed.data.focal_zoom,
              overlay: parsed.data.overlay,
            }
          : s
      );
    } else {
      const heroIdx = copy.slides.findIndex(
        (s) => s.composition === "declaration" || s.composition === "carousel_hook"
      );
      if (heroIdx >= 0) {
        copy.slides[heroIdx] = {
          ...copy.slides[heroIdx],
          imageUrl: parsed.data.image_url,
          focalX: parsed.data.focal_x,
          focalY: parsed.data.focal_y,
          zoom: parsed.data.focal_zoom,
          overlay: parsed.data.overlay,
        };
      }
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
