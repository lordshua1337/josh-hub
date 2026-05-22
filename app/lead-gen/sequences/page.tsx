// /lead-gen/sequences — outreach sequence engine.
// Multi-step playbooks that auto-advance per lead. Each step is an email
// template with a wait-days delay. A cron at /api/cron/sequences picks up
// `lead_sequence_progress` rows whose next_due_at <= now and ships the
// step via the existing Fastmail integration.

import { supabaseServer } from "@/lib/supabase/server";
import { SequencesBoard, type SequenceRow, type EnrolledLeadRow } from "./SequencesBoard";

export const dynamic = "force-dynamic";

export default async function SequencesPage() {
  const sb = supabaseServer();

  const [seqRes, stepRes, progRes] = await Promise.all([
    sb
      .from("sequences")
      .select("id, slug, name, goal, brand, status, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50),
    sb
      .from("sequence_steps")
      .select("id, sequence_id, step_order, wait_days, subject, body")
      .order("step_order", { ascending: true }),
    sb
      .from("lead_sequence_progress")
      .select("id, lead_id, sequence_id, current_step, status, last_sent_at, next_due_at, enrolled_at"),
  ]);

  if (seqRes.error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Sequences</h1>
          <p className="header-sub" style={{ color: "var(--danger)" }}>{seqRes.error.message}</p>
        </div>
      </>
    );
  }
  const sequences = (seqRes.data ?? []) as SequenceRow[];
  const stepRows = (stepRes.data ?? []) as { id: string; sequence_id: string; step_order: number; wait_days: number; subject: string | null; body: string }[];

  // Group steps by sequence_id
  const stepsBySeq = new Map<string, typeof stepRows>();
  for (const s of stepRows) {
    const arr = stepsBySeq.get(s.sequence_id) ?? [];
    arr.push(s);
    stepsBySeq.set(s.sequence_id, arr);
  }
  const sequencesWithSteps = sequences.map((s) => ({ ...s, steps: stepsBySeq.get(s.id) ?? [] }));

  // For each enrolled lead, fetch the lead summary
  const progressRows = (progRes.data ?? []) as { id: string; lead_id: string; sequence_id: string; current_step: number; status: string; last_sent_at: string | null; next_due_at: string | null; enrolled_at: string }[];
  const leadIds = [...new Set(progressRows.map((p) => p.lead_id))];
  let enrolledLeads: EnrolledLeadRow[] = [];
  if (leadIds.length > 0) {
    const { data: leads } = await sb
      .from("leads")
      .select("id, name, email, company, status")
      .in("id", leadIds);
    const leadMap = new Map((leads ?? []).map((l) => [l.id, l] as const));
    enrolledLeads = progressRows.map((p) => {
      const l = leadMap.get(p.lead_id);
      const seq = sequencesWithSteps.find((s) => s.id === p.sequence_id);
      const totalSteps = seq?.steps.length ?? 0;
      const stalled =
        p.status === "active" &&
        p.next_due_at !== null &&
        new Date(p.next_due_at).getTime() < Date.now() - 7 * 86_400_000;
      return {
        progressId: p.id,
        leadId: p.lead_id,
        sequenceId: p.sequence_id,
        sequenceName: seq?.name ?? "(deleted)",
        currentStep: p.current_step,
        totalSteps,
        status: p.status,
        nextDueAt: p.next_due_at,
        lastSentAt: p.last_sent_at,
        enrolledAt: p.enrolled_at,
        leadName: l?.name ?? null,
        leadEmail: l?.email ?? null,
        leadCompany: l?.company ?? null,
        leadStatus: l?.status ?? null,
        stalled,
      };
    });
  }

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">outreach</p>
        <h1>Sequences</h1>
        <p className="header-sub">
          Multi-step outreach playbooks. Each enrolled lead auto-advances on a cadence. Stalled leads (no
          step for 7+ days) get surfaced for follow-up.
        </p>
      </div>
      <div className="main">
        <SequencesBoard sequences={sequencesWithSteps} enrolled={enrolledLeads} />
      </div>
    </>
  );
}
