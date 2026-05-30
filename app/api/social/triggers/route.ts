// /api/social/triggers
// CRUD for the dm_triggers table — the keyword -> auto-reply pairs the IG DM
// responder fires on. Authoring lives on /content/dms; the cron route loads
// these once per tick and matches inbound DMs against them.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TriggerRow = {
  id: string;
  keyword: string;
  response: string;
  description: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

function normalize(input: Partial<TriggerRow>) {
  const out: Partial<TriggerRow> = {};
  if (typeof input.keyword === "string") out.keyword = input.keyword.trim().toLowerCase();
  if (typeof input.response === "string") out.response = input.response.trim();
  if (typeof input.description === "string" || input.description === null) {
    out.description = (input.description as string | null)?.toString() ?? null;
  }
  if (typeof input.enabled === "boolean") out.enabled = input.enabled;
  return out;
}

export async function GET() {
  // dm_triggers isn't in the generated Database type yet; cast narrowly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = supabaseServer();
  const { data, error } = await sb
    .from("dm_triggers")
    .select("id, keyword, response, description, enabled, created_at, updated_at")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ triggers: data ?? [] });
}

export async function POST(req: NextRequest) {
  let body: Partial<TriggerRow>;
  try {
    body = (await req.json()) as Partial<TriggerRow>;
  } catch {
    return badRequest("invalid json");
  }
  const n = normalize(body);
  if (!n.keyword) return badRequest("keyword required");
  if (!n.response) return badRequest("response required");
  // keyword must be a single token (or short phrase) so the matcher's
  // ≤5-token guard is meaningful. Reject anything obviously not a keyword.
  if (n.keyword.split(/\s+/).length > 3) return badRequest("keyword should be 1–3 words");

  // dm_triggers isn't in the generated Database type yet; cast narrowly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = supabaseServer();
  const { data, error } = await sb
    .from("dm_triggers")
    .insert({ ...n, enabled: n.enabled ?? true })
    .select("id, keyword, response, description, enabled, created_at, updated_at")
    .single();
  if (error) {
    const status = error.code === "23505" ? 409 : 500; // unique violation
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ trigger: data });
}

export async function PATCH(req: NextRequest) {
  let body: { id?: string } & Partial<TriggerRow>;
  try {
    body = (await req.json()) as { id?: string } & Partial<TriggerRow>;
  } catch {
    return badRequest("invalid json");
  }
  if (!body.id) return badRequest("id required");
  const n = normalize(body);
  if (Object.keys(n).length === 0) return badRequest("no fields to update");

  // dm_triggers isn't in the generated Database type yet; cast narrowly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = supabaseServer();
  const { data, error } = await sb
    .from("dm_triggers")
    .update(n)
    .eq("id", body.id)
    .select("id, keyword, response, description, enabled, created_at, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trigger: data });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("id required");
  // dm_triggers isn't in the generated Database type yet; cast narrowly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = supabaseServer();
  const { error } = await sb.from("dm_triggers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
