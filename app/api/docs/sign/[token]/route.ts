// POST /api/docs/sign/[token] — public signature endpoint. No auth.
// Body: { signer_name }. Records a signature row + flips doc to 'signed'.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Schema = z.object({
  signer_name: z.string().min(1).max(200),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const sb = supabaseServer();
  const { data: row, error } = await sb
    .from("documents")
    .select("id, status, recipient_email")
    .eq("sign_token", token)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.status === "cancelled") return NextResponse.json({ error: "cancelled" }, { status: 410 });
  if (row.status === "signed" || row.status === "completed") {
    return NextResponse.json({ ok: true, already_signed: true });
  }

  const now = new Date().toISOString();
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  const ua = req.headers.get("user-agent") || null;

  const { error: sigErr } = await sb.from("document_signatures").insert({
    document_id: row.id,
    signer_role: "recipient",
    signer_name: parsed.data.signer_name,
    signer_email: row.recipient_email,
    ip_address: ip,
    user_agent: ua,
    signed_at: now,
  } as never);
  if (sigErr) return NextResponse.json({ error: sigErr.message }, { status: 500 });

  const { error: upErr } = await sb
    .from("documents")
    .update({ status: "signed", signed_at: now, updated_at: now } as never)
    .eq("id", row.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  try {
    await sb.from("document_events").insert({
      document_id: row.id,
      event_type: "signed",
      actor: parsed.data.signer_name,
      meta: { ip, ua } as never,
    } as never);
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true });
}
