import { SectionStub } from "@/components/SectionStub";

export default function AnalyticsPage() {
  return (
    <SectionStub
      title="Website Analytics"
      tagline="Visitors, top pages, conversion paths — across every live project."
      bullets={[
        "Total visitors (7d / 30d / 90d) per project",
        "Top pages by views and by conversions",
        "Funnel: visit → engagement → conversion event",
        "Referrer + device + geo breakdowns",
      ]}
    />
  );
}
