import { SectionStub } from "@/components/SectionStub";

export default function SequencesPage() {
  return (
    <SectionStub
      title="Sequences"
      tagline="Outreach sequences — cold + warm — and where each lead is in their journey."
      bullets={[
        "Active sequences and step-by-step view per lead",
        "Open / reply / click stats per email step",
        "Sequence builder (link to /skills/cold-outreach-sequence)",
        "Stalled-lead surfacing — leads stuck on the same step >7 days",
      ]}
    />
  );
}
