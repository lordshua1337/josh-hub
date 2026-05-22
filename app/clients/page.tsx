// /clients — the simple CRM. One table, one filter row, one click to change
// status, one click to copy email or open Cal.com. Backed by public.leads
// (every form fill becomes a row via /api/leads/ingest). No new table, no
// new schema — just a CRM lens on the data we already collect.

import { supabaseServer } from "@/lib/supabase/server";
import { ClientsBoard, type ClientRow } from "./ClientsBoard";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("leads")
    .select(
      "id, source, source_url, name, email, company, need, message, notes, status, received_at, contacted_at, qualified_at, closed_at, updated_at, utm_source, utm_medium, utm_campaign"
    )
    .order("received_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Clients</h1>
          <p className="header-sub">Could not load clients.</p>
        </div>
        <div className="main">
          <pre style={{ fontSize: 12, color: "var(--danger)" }}>{error.message}</pre>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">crm</p>
        <h1>Clients</h1>
        <p className="header-sub">
          Every form fill. Every conversation. One place. Click a status to move someone through the pipeline,
          click their row to drop a note.
        </p>
      </div>
      <div className="main">
        <ClientsBoard rows={(data ?? []) as ClientRow[]} />
      </div>
    </>
  );
}
