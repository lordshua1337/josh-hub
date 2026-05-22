// /content/calendar — editorial calendar built on public.social_posts.
// Month grid + unscheduled drafts panel. Click a draft to schedule it on
// a specific day. Click a scheduled post to jump to its slide thumbnails.

import { supabaseServer } from "@/lib/supabase/server";
import { CalendarBoard, type CalendarRow } from "./CalendarBoard";

export const dynamic = "force-dynamic";

export default async function ContentCalendarPage() {
  const sb = supabaseServer();
  // Wide window: 3 months back, 6 months forward. Plenty of headroom for any
  // realistic planning, and cheap (few hundred rows max).
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const { data, error } = await sb
    .from("social_posts")
    .select(
      "id, brand, post_type, composition, topic, status, platform, scheduled_for, posted_at, copy_blocks, created_at"
    )
    .gte("created_at", since)
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .limit(500);

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Content Calendar</h1>
          <p className="header-sub" style={{ color: "var(--danger)" }}>{error.message}</p>
        </div>
      </>
    );
  }
  const rows = (data ?? []) as CalendarRow[];

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">cadence</p>
        <h1>Content Calendar</h1>
        <p className="header-sub">
          Every post in the pipeline. Click a draft to slot it onto a day. Click a scheduled post to open it.
          {rows.length} {rows.length === 1 ? "post" : "posts"} in the last 90 days.
        </p>
      </div>
      <div className="main">
        <CalendarBoard rows={rows} />
      </div>
    </>
  );
}
