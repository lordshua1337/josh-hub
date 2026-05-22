// /api/cron/sequences — hourly stepper for outreach sequences.
// Scans lead_sequence_progress rows that are due (next_due_at <= now,
// status='active') and queues a sequence_sends row for each. Advances
// current_step and computes the next_due_at from the next step's wait_days.
//
// IMPORTANT: This DOES NOT auto-send emails. It only queues them. Josh
// dispatches manually from the /lead-gen/sequences UI. Safer for cold
// outreach where misfires are expensive.

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function authorized(req: Request): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const url = new URL(req.url);
  const provided = url.searchParams.get("key")?.trim();
  const expected = (process.env.JH_INGEST_KEY || "").replace(/\\n|\n|\r/g, "").trim();
  return !!(provided && expected && provided === expected);
}

function interpolate(template: string, lead: { name?: string | null; company?: string | null; email?: string | null }): string {
  const firstName = lead.name?.split(/\s+/)[0] || lead.name || "there";
  return template
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*name\s*\}\}/gi, lead.name || "")
    .replace(/\{\{\s*company\s*\}\}/gi, lead.company || "");
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = supabaseServer();
  const now = new Date().toISOString();

  const { data: due, error } = await sb
    .from("lead_sequence_progress")
    .select("id, lead_id, sequence_id, current_step, status, next_due_at")
    .eq("status", "active")
    .lte("next_due_at", now)
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let queued = 0;
  let completed = 0;
  const errors: { progress_id: string; err: string }[] = [];

  for (const row of due ?? []) {
    try {
      const r = row as { id: string; lead_id: string; sequence_id: string; current_step: number };

      // Fetch the step for this position
      const { data: step } = await sb
        .from("sequence_steps")
        .select("step_order, wait_days, subject, body")
        .eq("sequence_id", r.sequence_id)
        .eq("step_order", r.current_step + 1) // step_order is 1-indexed; current_step is 0-indexed count of sent
        .maybeSingle();

      if (!step) {
        // No more steps → completed
        await sb
          .from("lead_sequence_progress")
          .update({ status: "completed", completed_at: now, next_due_at: null } as never)
          .eq("id", r.id);
        completed += 1;
        continue;
      }

      // Fetch lead for personalization
      const { data: lead } = await sb
        .from("leads")
        .select("name, company, email, status")
        .eq("id", r.lead_id)
        .maybeSingle();
      if (!lead || !lead.email) {
        errors.push({ progress_id: r.id, err: "lead missing email" });
        continue;
      }
      // Exit if lead has been closed
      if (lead.status === "client" || lead.status === "past" || lead.status === "cold") {
        await sb
          .from("lead_sequence_progress")
          .update({ status: "exited", completed_at: now, next_due_at: null } as never)
          .eq("id", r.id);
        completed += 1;
        continue;
      }

      const preview = interpolate(step.body || "", lead);
      const subject = step.subject ? interpolate(step.subject, lead) : null;

      // Queue the send
      await sb.from("sequence_sends").insert({
        lead_id: r.lead_id,
        sequence_id: r.sequence_id,
        step_order: step.step_order,
        status: "queued",
        preview: subject ? `${subject}\n\n${preview}` : preview,
      } as never);

      // Look ahead: is there another step after this?
      const { data: nextStep } = await sb
        .from("sequence_steps")
        .select("wait_days")
        .eq("sequence_id", r.sequence_id)
        .eq("step_order", step.step_order + 1)
        .maybeSingle();
      const nextDue = nextStep
        ? new Date(Date.now() + (nextStep.wait_days || 0) * 86_400_000).toISOString()
        : null;
      const nextStatus = nextStep ? "active" : "completed";

      await sb
        .from("lead_sequence_progress")
        .update({
          current_step: r.current_step + 1,
          last_sent_at: now,
          next_due_at: nextDue,
          status: nextStatus,
          completed_at: nextStep ? null : now,
        } as never)
        .eq("id", r.id);
      queued += 1;
    } catch (e) {
      errors.push({ progress_id: (row as { id: string }).id, err: (e as Error).message });
    }
  }

  return NextResponse.json({ ok: true, scanned: due?.length ?? 0, queued, completed, errors });
}
