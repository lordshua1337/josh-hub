import { SectionStub } from "@/components/SectionStub";

// Campaign Builder — coordinate multiple posts under a single theme/launch.
// Stub for now. When Josh's ready to build it, the spec below scopes it.

export default function CampaignBuilderPage() {
  return (
    <SectionStub
      title="Campaign Builder"
      tagline="Group a series of posts under one theme. Plan cadence, draft as a batch, ship as a sequence."
      bullets={[
        "Create a campaign (e.g. 'Q3 audit-keyword push' or 'Compliance GTM week')",
        "Add 3-10 posts of mixed types (declaration, carousel, panorama) drafted from a shared brief",
        "Schedule across a cadence (M/W/F, daily for 5 days, etc.)",
        "Shared signoff note + first-comment pattern across the series",
        "Auto-link each post's first comment to the next ('part 2 of 5 — find the rest at...')",
        "One-click 'draft the whole campaign' that calls the Post Engine N times",
        "Performance rollup: aggregate saves/shares/comments across the campaign vs baseline",
      ]}
    />
  );
}
