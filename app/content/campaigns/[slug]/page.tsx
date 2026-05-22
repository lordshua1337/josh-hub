// /content/campaigns/[slug] — single campaign detail.
// Shows attached posts in order. Batch-draft form takes N topics + a post
// type and calls /api/campaigns/[slug]/draft-batch which fans out to the
// Post Engine.

import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { POST_TYPES } from "@/lib/social/post-types";
import { CampaignDetail, type CampaignDetailRow, type CampaignPostRow } from "./CampaignDetail";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage(ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const sb = supabaseServer();
  const { data: campaign, error } = await sb
    .from("campaigns")
    .select("id, slug, name, theme, pitch, status, brand, cadence, start_at, end_at, created_at, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !campaign) notFound();

  const { data: posts } = await sb
    .from("social_posts")
    .select(
      "id, brand, post_type, composition, topic, status, platform, scheduled_for, posted_at, copy_blocks, campaign_order, created_at"
    )
    .eq("campaign_id", campaign.id)
    .order("campaign_order", { ascending: true, nullsFirst: false });

  return (
    <CampaignDetail
      campaign={campaign as CampaignDetailRow}
      posts={(posts ?? []) as CampaignPostRow[]}
      postTypes={POST_TYPES.map((p) => ({ slug: p.slug, label: p.label, kind: p.kind, slideCount: p.slideCount }))}
    />
  );
}
