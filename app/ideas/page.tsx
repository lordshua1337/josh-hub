// /ideas — everything that's pre-deploy. Local folders with no Vercel
// match, planned-but-not-built specs, future projects. Edit notes inline,
// promote to "deployed" once the Vercel project goes live.

import { supabaseServer } from "@/lib/supabase/server";
import { IdeasBoard, type IdeaRow } from "./IdeasBoard";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("projects")
    .select(
      "slug, name, description, repo_url, notes, current_status, created_at, updated_at, last_touched_at"
    )
    .in("current_status", ["idea", "planned", "future"])
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Ideas</h1>
          <p className="header-sub">Could not load ideas.</p>
        </div>
        <div className="main">
          <pre style={{ color: "var(--danger)", fontSize: 12 }}>{error.message}</pre>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">backlog</p>
        <h1>Ideas</h1>
        <p className="header-sub">
          Things that aren&apos;t deployed yet — half-built folders, planned specs, future projects.
          Drop a note, set a status, promote to Projects when something ships.
        </p>
      </div>
      <div className="main">
        <IdeasBoard rows={(data ?? []) as IdeaRow[]} />
      </div>
    </>
  );
}
