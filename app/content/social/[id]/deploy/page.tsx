// /content/social/[id]/deploy — the Instagram handoff page.
// Reached from the "Deploy to Instagram" button on a post. IG's API can't
// create drafts or attach catalog music, so this is the manual handoff: every
// slide ready to download, caption + hashtags + first comment + reel script
// ready to copy, and the exact steps to finish in the IG app.

import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { POST_TYPES } from "@/lib/social/post-types";
import type { SlideContent } from "@/lib/social/copy";
import type { ReelLike } from "@/lib/social/handoff";
import { DeployView } from "./DeployView";

export const dynamic = "force-dynamic";

export default async function DeployPage(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();
  const { data: row, error } = await sb
    .from("social_posts")
    .select("id, brand, post_type, topic, copy_blocks, metadata, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) notFound();

  const cb = row.copy_blocks as { is_carousel?: boolean; slides?: SlideContent[]; caption?: string; first_comment?: string; reel_script?: ReelLike } | null;
  const meta = row.metadata as { first_comment?: string; reel_script?: ReelLike } | null;
  const slides = cb?.slides ?? [];
  if (slides.length === 0) notFound();

  const typeLabel = POST_TYPES.find((p) => p.slug === row.post_type)?.label || row.post_type;

  return (
    <DeployView
      postId={row.id}
      typeLabel={typeLabel}
      topic={row.topic}
      slideCount={slides.length}
      isCarousel={!!cb?.is_carousel && slides.length > 1}
      caption={cb?.caption || ""}
      firstComment={meta?.first_comment || cb?.first_comment || ""}
      reel={meta?.reel_script || cb?.reel_script || null}
    />
  );
}
