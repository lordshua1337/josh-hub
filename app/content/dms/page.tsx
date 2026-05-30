// /content/dms — Instagram DM review surface. Reads ig_messages rows that
// the cron classified + drafted. Josh hits Send (one-click ships via IG
// Graph when IG_GRAPH_TOKEN is wired; otherwise marks ready_to_send and
// surfaces the draft for copy/paste).

import { supabaseServer } from "@/lib/supabase/server";
import { DmReview, type DmRow } from "./DmReview";
import { TriggersPanel } from "./TriggersPanel";
import { CommentsList, type CommentRow } from "./CommentsList";

export const dynamic = "force-dynamic";

export default async function DmReviewPage() {
  const sb = supabaseServer();
  const [{ data, error }, commentsRes] = await Promise.all([
    sb
      .from("ig_messages")
      .select(
        "id, ig_message_id, sender_id, sender_username, sender_name, body, received_at, category, category_confidence, category_reasoning, draft_reply, reply_status, sent_at, send_error, created_at"
      )
      .order("received_at", { ascending: false, nullsFirst: false })
      .limit(150),
    // ig_comments isn't in the generated Database type yet; cast narrowly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sb as any)
      .from("ig_comments")
      .select(
        "id, ig_comment_id, parent_media_id, sender_id, sender_username, body, received_at, category, draft_reply, reply_status, created_at"
      )
      .order("received_at", { ascending: false, nullsFirst: false })
      .limit(50),
  ]);
  const comments = (commentsRes.data ?? []) as CommentRow[];

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
        <h1>Inbox · DMs &amp; Comments</h1>
        <p className="header-sub">
          Hybrid auto-responder for @builtbyprometheus. Manage your keyword triggers below
          (DM a keyword like &quot;AUDIT&quot; → instant auto-reply). Everything else gets classified,
          drafted in Josh&apos;s voice, and parked for one-click review. Comments arriving from
          the webhook show up below the triggers. Cron polls every 5 min.
        </p>
      </div>
      <div className="main">
        <TriggersPanel />
        <CommentsList rows={comments} />
        <DmReview rows={(data ?? []) as DmRow[]} />
      </div>
    </>
  );
}
