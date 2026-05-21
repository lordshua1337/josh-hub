// Classify + draft replies for any pending IG DMs.
// Runs every 5 min via Vercel Cron (configure in vercel.json when ready)
// or on demand via ?key=JH_INGEST_KEY.

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { classifyDm, draftDmReply } from "@/lib/social/dm";

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
  const sb = supabaseServer();
  const summary = { fetched: 0, classified: 0, drafted: 0, errors: [] as string[] };

  // Grab every row that hasn't been classified yet.
  const { data: rows, error } = await sb
    .from("ig_messages")
    .select("id, body")
    .is("category", null)
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  summary.fetched = rows?.length ?? 0;

  for (const r of rows ?? []) {
    try {
      const cls = await classifyDm(r.body);
      summary.classified++;
      const draft = await draftDmReply(r.body, cls);
      if (draft) summary.drafted++;
      await sb
        .from("ig_messages")
        .update({
          category: cls.category,
          category_confidence: cls.confidence,
          category_reasoning: cls.reasoning,
          draft_reply: draft || null,
          reply_status: draft ? "pending" : cls.category === "spam" ? "skipped" : "pending",
        })
        .eq("id", r.id);
    } catch (e) {
      summary.errors.push(`${r.id}: ${(e as Error).message}`);
    }
  }

  await sb.from("ingester_state").upsert(
    { id: "ig_replies", last_run_at: new Date().toISOString(), cursor: summary as never, notes: null },
    { onConflict: "id" }
  );

  return NextResponse.json({ ok: true, ...summary });
}
