// /content/campaigns — list of every campaign. Coordinate a series of posts
// under a single theme. Click a row to drill in.

import { supabaseServer } from "@/lib/supabase/server";
import { CampaignsBoard, type CampaignRow } from "./CampaignsBoard";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("campaigns")
    .select("id, slug, name, theme, pitch, status, brand, cadence, start_at, end_at, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Campaigns</h1>
          <p className="header-sub" style={{ color: "var(--danger)" }}>{error.message}</p>
        </div>
      </>
    );
  }
  const campaigns = (data ?? []) as CampaignRow[];

  // Count posts per campaign (one extra query)
  let postCountBySlug = new Map<string, number>();
  if (campaigns.length > 0) {
    const { data: posts } = await sb
      .from("social_posts")
      .select("campaign_id")
      .in("campaign_id", campaigns.map((c) => c.id));
    if (posts) {
      const m = new Map<string, number>();
      for (const p of posts) {
        const cid = (p as { campaign_id: string | null }).campaign_id;
        if (cid) m.set(cid, (m.get(cid) ?? 0) + 1);
      }
      postCountBySlug = new Map(campaigns.map((c) => [c.slug, m.get(c.id) ?? 0]));
    }
  }

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">growth flywheel</p>
        <h1>Campaign Builder</h1>
        <p className="header-sub">
          Coordinate a series of posts under one theme. Plan cadence, batch-draft the whole series through the Post Engine, ship as a sequence.
        </p>
      </div>
      <div className="main">
        <CampaignsBoard campaigns={campaigns} postCounts={Object.fromEntries(postCountBySlug)} />
      </div>
    </>
  );
}
