import { SectionStub } from "@/components/SectionStub";

export default function LeadGenPage() {
  return (
    <SectionStub
      title="Lead Gen"
      tagline="Pipeline, sources, intake forms, scoring, outreach automation — central view across every project."
      bullets={[
        "Unified leads table across CTAX Partner Site, BashBox, Cash Cow, etc.",
        "Source attribution + UTM rollups",
        "Lead scoring model + status pipeline",
        "Cold outreach sequence status (Apollo / Smartlead / etc.)",
        "Inbound form conversion stats",
        "Intake form builder per project",
      ]}
    />
  );
}
