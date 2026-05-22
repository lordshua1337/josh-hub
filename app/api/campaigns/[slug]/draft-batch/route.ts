// POST /api/campaigns/[slug]/draft-batch
// Body: { topics: string[], post_type: string, image_url?, focal_x?, focal_y?, overlay? }
// Calls the existing draftPost engine N times — one social_posts row per
// topic. Tags every new row with campaign_id + campaign_order so they show
// up grouped under this campaign.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { getBrand } from "@/lib/social/brands";
import { getPostType, POST_TYPES } from "@/lib/social/post-types";
import { draftPost } from "@/lib/social/copy";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const Schema = z.object({
  topics: z.array(z.string().min(3).max(500)).min(1).max(10),
  post_type: z.string().min(1),
  image_url: z.string().min(1).max(500).optional(),
  focal_x: z.number().min(0).max(100).optional(),
  focal_y: z.number().min(0).max(100).optional(),
  overlay: z.enum(["subtle", "strong", "fade-bottom", "wordmark", "none"]).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  const validTypes = POST_TYPES.map((p) => p.slug);
  if (!validTypes.includes(parsed.data.post_type)) {
    return NextResponse.json({ error: "unknown_post_type" }, { status: 400 });
  }
  const def = getPostType(parsed.data.post_type);

  const sb = supabaseServer();
  const { data: campaign, error: cErr } = await sb
    .from("campaigns")
    .select("id, brand")
    .eq("slug", slug)
    .maybeSingle();
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  if (!campaign) return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });

  // Figure out the next campaign_order so newly-drafted posts come after
  // anything already attached to this campaign.
  const { data: maxRow } = await sb
    .from("social_posts")
    .select("campaign_order")
    .eq("campaign_id", campaign.id)
    .order("campaign_order", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  let nextOrder = ((maxRow?.campaign_order as number | null) ?? 0) + 1;

  const brand = getBrand(campaign.brand || "prometheus");
  const created: { id: string; topic: string; order: number }[] = [];
  const errors: { topic: string; error: string }[] = [];

  for (const topic of parsed.data.topics) {
    try {
      const copy = await draftPost(brand, parsed.data.post_type, topic);

      // Attach image to hero / panel slides if provided (same logic as draft route)
      if (parsed.data.image_url && copy.slides.length > 0) {
        if (parsed.data.post_type === "panel_panorama") {
          copy.slides = copy.slides.map((s) =>
            s.composition === "panel_slide"
              ? {
                  ...s,
                  imageUrl: parsed.data.image_url,
                  focalX: parsed.data.focal_x,
                  focalY: parsed.data.focal_y,
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
              overlay: parsed.data.overlay,
            };
          }
        }
      }

      const metadata: Record<string, unknown> = {};
      if (copy.first_comment) metadata.first_comment = copy.first_comment;
      if (copy.reel_script) metadata.reel_script = copy.reel_script;

      const { data, error } = await sb
        .from("social_posts")
        .insert({
          brand: brand.slug,
          post_type: parsed.data.post_type,
          composition: def.kind === "carousel" ? "carousel" : def.compositions[0],
          topic,
          copy_blocks: copy as never,
          metadata: Object.keys(metadata).length ? (metadata as never) : null,
          image_url: parsed.data.image_url || null,
          status: "draft",
          platform: "instagram",
          campaign_id: campaign.id,
          campaign_order: nextOrder,
        } as never)
        .select("id")
        .single();
      if (error || !data) {
        errors.push({ topic, error: error?.message || "insert_failed" });
        continue;
      }
      created.push({ id: data.id, topic, order: nextOrder });
      nextOrder += 1;
    } catch (e) {
      errors.push({ topic, error: (e as Error).message });
    }
  }

  // Flip campaign to active once it has posts.
  if (created.length > 0) {
    await sb
      .from("campaigns")
      .update({ status: "active", updated_at: new Date().toISOString() } as never)
      .eq("id", campaign.id);
  }

  return NextResponse.json({ ok: true, created, errors });
}
