import { SectionStub } from "@/components/SectionStub";

export default function LeadsPage() {
  return (
    <SectionStub
      title="Leads"
      tagline="Pivot table of every person who filled out a form, across all sites."
      bullets={[
        "Pull from prometheusconsulting.ai form (source to be identified next)",
        "Pivot by source / project / status / date",
        "Click-through to full lead detail (notes, history, status)",
        "Bulk actions: tag, move to sequence, export",
      ]}
    />
  );
}
