// POST /api/social/publish/[id]
// Single OR carousel push to IG Graph as a DRAFT.
//
// Single: POST /{ig-user}/media with image_url + caption + is_draft=true.
// Carousel: create one child media container per slide
// (is_carousel_item=true), then a parent (media_type=CAROUSEL, children=ids,
// is_draft=true). Josh finishes posting (music/effects) in the IG app.
//
// Without IG_GRAPH_TOKEN the route bakes the slide URLs and queues the row so
// the UI can show what the post will look like.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getBrand } from "@/lib/social/brands";
import type { SlideContent } from "@/lib/social/copy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://prometheus-hub.vercel.app";
}
function slideUrl(postId: string, idx: number): string {
  const p = new URLSearchParams({ postId, slide: String(idx), size: "1080" });
  return `${siteBase()}/api/social/render?${p}`;
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();

  const { data: row, error } = await sb
    .from("social_posts")
    .select("id, brand, copy_blocks, metadata, status, platform")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Existing metadata holds first_comment + reel_script. Every update below
  // MUST merge into this object, never overwrite — losing first_comment
  // breaks the IG workflow (that's where the link lives).
  const existingMeta = (row.metadata as Record<string, unknown>) || {};

  const cb = row.copy_blocks as { is_carousel?: boolean; slides?: SlideContent[]; caption?: string };
  const slides = cb?.slides ?? [];
  const isCarousel = !!cb?.is_carousel && slides.length > 1;
  const caption = cb?.caption || "";
  if (slides.length === 0) return NextResponse.json({ error: "no_slides" }, { status: 400 });

  const brand = getBrand(row.brand);
  const igToken = process.env.IG_GRAPH_TOKEN;
  const igUserId = brand.igAccount?.userId || process.env.IG_USER_ID;
  const imageUrls = slides.map((_s, i) => slideUrl(id, i));

  // No IG creds yet -> queue and return the baked slide URLs.
  if (!igToken || !igUserId) {
    await sb
      .from("social_posts")
      .update({
        image_url: imageUrls[0],
        status: "queued_for_ig",
        metadata: { ...existingMeta, reason: "IG_GRAPH_TOKEN missing", slide_urls: imageUrls } as never,
      })
      .eq("id", id);
    return NextResponse.json({
      ok: true,
      queued: true,
      reason: "IG creds not connected. Slide PNGs baked, ready to push.",
      slides: imageUrls,
    });
  }

  try {
    if (!isCarousel) {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${igUserId}/media?` +
          new URLSearchParams({ image_url: imageUrls[0], caption, is_draft: "true", access_token: igToken }),
        { method: "POST" }
      );
      const json = (await res.json()) as { id?: string; error?: { message: string } };
      if (!res.ok || !json.id) {
        const msg = json.error?.message || `HTTP ${res.status}`;
        await sb.from("social_posts").update({ status: "failed", error: msg, image_url: imageUrls[0] }).eq("id", id);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
      await sb
        .from("social_posts")
        .update({
          image_url: imageUrls[0],
          status: "draft_pushed",
          posted_id: json.id,
          posted_at: new Date().toISOString(),
          metadata: { ...existingMeta, container_id: json.id, slide_urls: imageUrls } as never,
        })
        .eq("id", id);
      return NextResponse.json({ ok: true, container_id: json.id });
    }

    // Carousel — create children then parent.
    const childIds: string[] = [];
    for (const url of imageUrls) {
      const cRes = await fetch(
        `https://graph.facebook.com/v21.0/${igUserId}/media?` +
          new URLSearchParams({ image_url: url, is_carousel_item: "true", access_token: igToken }),
        { method: "POST" }
      );
      const cJson = (await cRes.json()) as { id?: string; error?: { message: string } };
      if (!cRes.ok || !cJson.id) {
        const msg = cJson.error?.message || `child HTTP ${cRes.status}`;
        await sb.from("social_posts").update({ status: "failed", error: msg }).eq("id", id);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
      childIds.push(cJson.id);
    }
    const pRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media?` +
        new URLSearchParams({
          media_type: "CAROUSEL",
          children: childIds.join(","),
          caption,
          is_draft: "true",
          access_token: igToken,
        }),
      { method: "POST" }
    );
    const pJson = (await pRes.json()) as { id?: string; error?: { message: string } };
    if (!pRes.ok || !pJson.id) {
      const msg = pJson.error?.message || `parent HTTP ${pRes.status}`;
      await sb.from("social_posts").update({ status: "failed", error: msg }).eq("id", id);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    await sb
      .from("social_posts")
      .update({
        image_url: imageUrls[0],
        status: "draft_pushed",
        posted_id: pJson.id,
        posted_at: new Date().toISOString(),
        metadata: { ...existingMeta, container_id: pJson.id, child_ids: childIds, slide_urls: imageUrls } as never,
      })
      .eq("id", id);
    return NextResponse.json({ ok: true, container_id: pJson.id, child_ids: childIds });
  } catch (e) {
    await sb.from("social_posts").update({ status: "failed", error: (e as Error).message }).eq("id", id);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
