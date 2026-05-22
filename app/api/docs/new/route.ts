// POST /api/docs/new
// Body: { template_id, title?, client_id? }
// Creates a fresh draft document. If client_id is set, prefills
// recipient_name + recipient_email from the leads table.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/docs/templates";

export const dynamic = "force-dynamic";

const Schema = z.object({
  template_id: z.string().min(1),
  title: z.string().max(200).optional(),
  client_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const template = getTemplate(parsed.data.template_id);
  if (!template) return NextResponse.json({ error: "unknown_template" }, { status: 400 });

  const sb = supabaseServer();
  const row: Record<string, unknown> = {
    template_id: parsed.data.template_id,
    title: parsed.data.title || template.name,
    status: "draft",
    field_values: {},
  };

  // Prefill recipient from clients/leads if provided
  if (parsed.data.client_id) {
    const { data: client } = await sb
      .from("leads")
      .select("name, email, company")
      .eq("id", parsed.data.client_id)
      .maybeSingle();
    if (client) {
      row.client_id = parsed.data.client_id;
      row.recipient_name = client.name;
      row.recipient_email = client.email;
      row.recipient_company = client.company;
    }
  }

  const { data, error } = await sb
    .from("documents")
    .insert(row as never)
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit event (non-critical)
  try {
    await sb.from("document_events").insert({
      document_id: data.id,
      event_type: "created",
      actor: "owner",
      meta: { template_id: parsed.data.template_id } as never,
    } as never);
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, id: data.id });
}
