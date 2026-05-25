// /content/dms — Instagram DM review surface. Reads ig_messages rows that
// the cron classified + drafted. Josh hits Send (one-click ships via IG
// Graph when IG_GRAPH_TOKEN is wired; otherwise marks ready_to_send and
// surfaces the draft for copy/paste).

import { supabaseServer } from "@/lib/supabase/server";
import { DmReview, type DmRow } from "./DmReview";

export const dynamic = "force-dynamic";

export default async function DmReviewPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("ig_messages")
    .select(
      "id, ig_message_id, sender_id, sender_username, sender_name, body, received_at, category, category_confidence, category_reasoning, draft_reply, reply_status, sent_at, send_error, created_at"
    )
    .order("received_at", { ascending: false, nullsFirst: false })
    .limit(150);

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>DM Triage</h1>
          <p className="header-sub">Could not load DMs.</p>
        </div>
        <div className="main">
          <div className="card" style={{ padding: 20, color: "var(--danger)" }}>
            {error.message}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="header fl-reveal">
        <h1>DM Triage</h1>
        <p className="header-sub">
          Hybrid auto-responder: keyword triggers (DM &quot;AUDIT&quot;) fire an instant
          reply automatically; everything else is classified + drafted in Josh&apos;s
          voice and parked here for one-click review. ManyChat replacement. Polling every 5 min.
        </p>
      </div>
      <div className="main">
        <DmReview rows={(data ?? []) as DmRow[]} />
      </div>
    </>
  );
}
