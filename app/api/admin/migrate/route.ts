// POST /api/admin/migrate
// Apply arbitrary SQL via Supabase Management API. Gated by JH_INGEST_KEY
// header so only I (with the env secret) can call it. Used as a permanent
// fallback for when the Supabase MCP times out.
//
// Body: { sql: string }
// Returns: pass-through of the Management API response.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { runSql } from "@/lib/supabase/management";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Schema = z.object({ sql: z.string().min(1).max(200_000) });

function authorized(req: NextRequest): boolean {
  const provided = req.headers.get("x-admin-key")?.trim();
  const expected = (process.env.JH_INGEST_KEY || "").replace(/\\n|\n|\r/g, "").trim();
  return !!(provided && expected && provided === expected);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await runSql(parsed.data.sql);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
