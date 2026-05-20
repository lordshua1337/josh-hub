import { SectionStub } from "@/components/SectionStub";

export default function SocialPage() {
  return (
    <SectionStub
      title="Social"
      tagline="Posts queue + performance — X, LinkedIn, IG."
      bullets={[
        "Cross-platform queue (scheduled, drafts)",
        "Engagement per platform per post",
        "Best-time-to-post heatmap",
        "Repurpose: thread → carousel → short-form",
      ]}
    />
  );
}
