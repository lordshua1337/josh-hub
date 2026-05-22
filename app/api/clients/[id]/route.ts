// PATCH /api/clients/[id]
// Body: { status?, notes?, name?, email?, company? }
// Updates a row in public.leads (the CRM-table-by-other-name) and
// auto-stamps the right timeline column when the status moves forward:
//   contacted   → sets contacted_at if not already set
//   qualified   → sets qualified_at if not already set
//   client      → sets contacted_at + qualified_at if not set (skip stages)
//   past / cold → sets closed_at

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "qualified", "client", "past", "cold"] as const;

const Schema = z.object({
  status: z.enum(STATUSES).optional(),
  notes: z.string().max(20000).optional(),
  name: z.string().max(200).optional(),
  email: z.string().max(320).optional(),
  company: z.string().max(200).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  const sb = supabaseServer();

  // Fetch existing row so we know which timeline columns are already set.
  const { data: row, error: readErr } = await sb
    .from("leads")
    .select("id, status, contacted_at, qualified_at, closed_at")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };

  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.email !== undefined) update.email = parsed.data.email;
  if (parsed.data.company !== undefined) update.company = parsed.data.company;

  if (parsed.data.status) {
    update.status = parsed.data.status;
    // Auto-stamp timeline columns when moving forward through the pipeline.
    // Skipping stages (new → client) backfills the earlier ones too.
    const s = parsed.data.status;
    if ((s === "contacted" || s === "qualified" || s === "client") && !row.contacted_at) {
      update.contacted_at = now;
    }
    if ((s === "qualified" || s === "client") && !row.qualified_at) {
      update.qualified_at = now;
    }
    if ((s === "past" || s === "cold") && !row.closed_at) {
      update.closed_at = now;
    }
  }

  const { error: upErr } = await sb.from("leads").update(update as never).eq("id", id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
