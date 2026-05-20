import { SectionStub } from "@/components/SectionStub";

export default function SourcesPage() {
  return (
    <SectionStub
      title="Sources"
      tagline="Where leads come from — UTM rollups, referrers, channels."
      bullets={[
        "Top UTM sources / mediums / campaigns",
        "Channel breakdown (organic, ads, direct, referral)",
        "Cost per lead by channel (when ad spend is wired)",
        "Time-series of new sources over time",
      ]}
    />
  );
}
