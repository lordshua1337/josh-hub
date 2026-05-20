import { supabaseServer } from "@/lib/supabase/server";
import { LeadsPivot } from "./LeadsPivot";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const sb = supabaseServer();
  const { data: leads, error } = await sb
    .from("leads")
    .select(
      "id, source, source_url, name, email, company, need, message, status, received_at, contacted_at"
    )
    .order("received_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Leads</h1>
          <p className="header-sub">Could not load leads.</p>
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
        <h1>Leads</h1>
        <p className="header-sub">
          {leads?.length ?? 0} leads · pivot by source, need, status, or month.
        </p>
      </div>
      <div className="main">
        <LeadsPivot leads={leads ?? []} />
      </div>
    </>
  );
}
