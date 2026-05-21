// POST /api/social/publish/[id]
// Pushes a drafted post to Instagram as a DRAFT (Josh adds music/effects
// then hits publish in the IG app). Wired against the IG Graph API:
// 1. Upload the rendered PNG to a public URL (the /render endpoint itself)
// 2. Create a media container with is_draft=true (when IG token is set)
// 3. Store the container id so the IG app can finish the post
//
// Until IG_GRAPH_TOKEN is set, this route stores the publish-intent and
// flips the row to status='queued_for_ig'. We can publish manually for now.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getBrand } from "@/lib/social/brands";

export const dynamic = "force-dynamic";

function renderUrlForPost(row: {
  brand: string;
  composition: string;
  copy_blocks: { kicker?: string; headline?: string; emphasize?: string; footer?: string };
}): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://prometheus-hub.vercel.app";
  const params = new URLSearchParams({
    brand: row.brand,
    composition: row.composition,
    size: "1080",
  });
  if (row.copy_blocks?.kicker) params.set("kicker", row.copy_blocks.kicker);
  if (row.copy_blocks?.headline) params.set("headline", row.copy_blocks.headline);
  if (row.copy_blocks?.emphasize) params.set("emphasize", row.copy_blocks.emphasize);
  if (row.copy_blocks?.footer) params.set("footer", row.copy_blocks.footer);
  return `${base}/api/social/render?${params}`;
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();

  const { data: row, error } = await sb
    .from("social_posts")
    .select("id, brand, composition, copy_blocks, status, platform")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const brand = getBrand(row.brand);
  const imageUrl = renderUrlForPost(row as never);
  const igToken = process.env.IG_GRAPH_TOKEN;
  const igUserId = brand.igAccount?.userId || process.env.IG_USER_ID;

  // Phase 1 fallback: no IG token yet -> queue + return draft preview link.
  if (!igToken || !igUserId) {
    await sb
      .from("social_posts")
      .update({
        image_url: imageUrl,
        status: "queued_for_ig",
        metadata: { reason: "IG_GRAPH_TOKEN missing; awaiting credential" },
      })
      .eq("id", id);
    return NextResponse.json({
      ok: true,
      queued: true,
      reason: "IG_GRAPH_TOKEN not set yet — image baked and queued. Connect IG and re-publish to push to drafts.",
      image_url: imageUrl,
    });
  }

  // Phase 2 path: IG Graph media container creation.
  // Endpoint: POST /{ig-user-id}/media with image_url + caption + is_draft=true
  try {
    const caption = (row.copy_blocks as { caption?: string })?.caption || "";
    const createRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media?` +
        new URLSearchParams({
          image_url: imageUrl,
          caption,
          // IG only honors is_draft via certain entry points; we ship it and
          // let IG behave -- the user finishes in the app either way.
          is_draft: "true",
          access_token: igToken,
        }),
      { method: "POST" }
    );
    const createJson = (await createRes.json()) as { id?: string; error?: { message: string } };
    if (!createRes.ok || !createJson.id) {
      const msg = createJson.error?.message || `HTTP ${createRes.status}`;
      await sb.from("social_posts").update({ status: "failed", error: msg, image_url: imageUrl }).eq("id", id);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    await sb
      .from("social_posts")
      .update({
        image_url: imageUrl,
        status: "draft_pushed",
        posted_id: createJson.id,
        posted_at: new Date().toISOString(),
        metadata: { container_id: createJson.id },
      })
      .eq("id", id);

    return NextResponse.json({ ok: true, container_id: createJson.id });
  } catch (e) {
    await sb.from("social_posts").update({ status: "failed", error: (e as Error).message }).eq("id", id);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
