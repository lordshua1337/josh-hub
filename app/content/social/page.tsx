import { supabaseServer } from "@/lib/supabase/server";
import { SocialComposer, type SocialRow } from "./SocialComposer";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("social_posts")
    .select("id, brand, post_type, composition, topic, copy_blocks, image_url, metadata, status, platform, scheduled_for, posted_at, posted_id, error, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <div className="header fl-reveal">
        <h1>Social</h1>
        <p className="header-sub">
          Drop a topic, the engine drafts copy in Prometheus voice and renders the post.
          Review here, push to Instagram drafts when ready.
        </p>
      </div>
      <div className="main">
        {error ? (
          <div className="card" style={{ padding: 20, color: "var(--danger)" }}>
            {error.message}
          </div>
        ) : (
          <SocialComposer rows={(data ?? []) as SocialRow[]} />
        )}
      </div>
    </>
  );
}
