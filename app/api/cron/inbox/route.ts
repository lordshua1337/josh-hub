// Inbox poller. Vercel Cron: every 5 minutes.
// For each new unread email in the inbox:
//   1. Classify (Claude Haiku)
//   2. If draft_reply: draft a reply in Josh's voice (Claude Haiku) + park it in Drafts
//   3. Mark the inbound email as read so we don't re-process
//   4. Upsert the row into public.inbox_emails

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { fetchRecentInbox, parkDraft, markAsRead } from "@/lib/email/jmap";
import { classifyEmail } from "@/lib/email/classifier";
import { draftReply } from "@/lib/email/persona";
import { CATEGORY_CONFIG } from "@/lib/email/categories";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const url = new URL(req.url);
  if (req.headers.get("x-vercel-cron")) return true;
  const provided = url.searchParams.get("key")?.trim();
  const expected = (process.env.JH_INGEST_KEY || "").replace(/\\n|\n|\r/g, "").trim();
  return !!(provided && expected && provided === expected);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const startedAt = Date.now();
  const sb = supabaseServer();
  const summary = {
    fetched: 0,
    processed: 0,
    classified: 0,
    drafted: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    // First poll: look back 24h including read emails. Subsequent: 10 min unread.
    const { count } = await sb.from("inbox_emails").select("id", { count: "exact", head: true });
    const first = (count ?? 0) === 0;
    const emails = await fetchRecentInbox({
      sinceMinutes: first ? 60 * 24 : 10,
      includeRead: first,
      limit: 50,
    });
    summary.fetched = emails.length;
    if (!emails.length) return NextResponse.json({ ok: true, ...summary, duration_ms: Date.now() - startedAt });

    for (const e of emails) {
      try {
        // Skip if we've already processed this fastmail_id
        const { data: existing } = await sb
          .from("inbox_emails")
          .select("id")
          .eq("fastmail_id", e.id)
          .maybeSingle();
        if (existing) {
          summary.skipped++;
          continue;
        }

        const fromAddress = e.from?.[0]?.email ?? "";
        const fromName = e.from?.[0]?.name ?? fromAddress;
        const toAddress = e.to?.[0]?.email ?? null;
        const subject = e.subject ?? "(no subject)";
        const bodyFull = e.bodyValues ? Object.values(e.bodyValues)[0]?.value ?? e.preview : e.preview;
        const isRead = e.keywords?.["$seen"] === true;

        // 1. Classify
        const cls = await classifyEmail(fromAddress, subject, bodyFull);
        summary.classified++;
        const conf = CATEGORY_CONFIG[cls.category];

        // 2. Draft if needed (skip already-read on first-import to avoid drafting old stuff)
        let draftId: string | null = null;
        let draftBody: string | null = null;
        if (conf.draft_reply && !(first && isRead) && fromAddress) {
          draftBody = await draftReply({
            category: cls.category,
            fromName,
            subject,
            body: bodyFull,
            threadHistory: null,
          });
          try {
            draftId = await parkDraft({
              inReplyToEmailId: e.id,
              to: fromAddress,
              subject,
              body: draftBody,
            });
            summary.drafted++;
          } catch (err) {
            summary.errors.push(`parkDraft ${e.id}: ${(err as Error).message}`);
          }
        }

        // 3. Mark original as read in Fastmail
        await markAsRead(e.id).catch((err) => summary.errors.push(`markRead ${e.id}: ${(err as Error).message}`));

        // 4. Insert into DB
        const { error: insErr } = await sb.from("inbox_emails").insert({
          fastmail_id: e.id,
          thread_id: e.threadId,
          from_address: fromAddress,
          from_name: fromName,
          to_address: toAddress,
          subject,
          body_preview: e.preview,
          body_full: bodyFull?.slice(0, 20000) ?? null,
          received_at: e.receivedAt,
          category: cls.category,
          category_confidence: cls.confidence,
          category_reasoning: cls.reasoning,
          action_taken: conf.action,
          draft_response: draftBody,
          fastmail_draft_id: draftId,
          draft_status: draftBody ? "pending" : "no_draft",
          classified_at: new Date().toISOString(),
          drafted_at: draftBody ? new Date().toISOString() : null,
        });
        if (insErr) summary.errors.push(`insert ${e.id}: ${insErr.message}`);
        summary.processed++;
      } catch (e) {
        summary.errors.push((e as Error).message);
      }
    }

    await sb
      .from("ingester_state")
      .upsert(
        {
          id: "inbox",
          last_run_at: new Date().toISOString(),
          cursor: { fetched: summary.fetched, drafted: summary.drafted, classified: summary.classified },
          notes: summary.errors.length ? summary.errors.slice(0, 3).join(" | ") : null,
        },
        { onConflict: "id" }
      );

    return NextResponse.json({ ok: true, duration_ms: Date.now() - startedAt, ...summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message, duration_ms: Date.now() - startedAt, ...summary },
      { status: 500 }
    );
  }
}
