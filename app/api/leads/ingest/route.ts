// POST /api/leads/ingest
// Auth: header X-Lead-Key matching LEAD_INGEST_KEY env (shared with the calling form).
// Body: { external_id?, source, source_url?, name, email, company?, need?, message,
//         utm_source?, utm_medium?, utm_campaign?, metadata? }
// Idempotent on external_id when provided.

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  external_id: z.string().max(200).optional(),
  source: z.string().min(1).max(120),
  source_url: z.string().max(2048).optional(),
  name: z.string().max(200).optional(),
  email: z.string().max(320).optional(),
  company: z.string().max(200).optional(),
  need: z.string().max(200).optional(),
  message: z.string().max(10000).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function authorized(req: Request): boolean {
  const provided = req.headers.get("x-lead-key")?.trim();
  const expected = (process.env.LEAD_INGEST_KEY || "").replace(/\\n|\n|\r/g, "").trim();
  return !!(provided && expected && provided === expected);
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  const lead = parsed.data;
  const sb = supabaseServer();
  const metadata = lead.metadata ? (JSON.parse(JSON.stringify(lead.metadata)) as Record<string, unknown>) : null;
  const { data, error } = await sb
    .from("leads")
    .upsert(
      {
        external_id: lead.external_id ?? null,
        source: lead.source,
        source_url: lead.source_url ?? null,
        name: lead.name ?? null,
        email: lead.email ?? null,
        company: lead.company ?? null,
        need: lead.need ?? null,
        message: lead.message ?? null,
        utm_source: lead.utm_source ?? null,
        utm_medium: lead.utm_medium ?? null,
        utm_campaign: lead.utm_campaign ?? null,
        metadata: metadata as never,
        received_at: new Date().toISOString(),
        status: "new",
      },
      { onConflict: "external_id", ignoreDuplicates: false }
    )
    .select("id")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data?.id ?? null });
}
