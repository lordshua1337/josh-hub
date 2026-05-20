import { SectionStub } from "@/components/SectionStub";

export default function PostsPage() {
  return (
    <SectionStub
      title="Posts"
      tagline="Long-form pieces — blog, guides, landing-page copy."
      bullets={[
        "List of all published posts with views + conversions",
        "Per-post engagement (scroll, time, exits)",
        "AI-suggested follow-up topics based on traffic patterns",
        "Edit history + republish workflow",
      ]}
    />
  );
}
