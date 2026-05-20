import { SectionStub } from "@/components/SectionStub";

export default function PagesPage() {
  return (
    <SectionStub
      title="Pages"
      tagline="Per-page performance: speed, conversion, engagement."
      bullets={[
        "Core Web Vitals (LCP, FID, CLS) per page",
        "Page-level conversion rate to next funnel step",
        "Scroll depth + time on page",
        "Drill-in: page-level revision history (Vercel deploys diff)",
      ]}
    />
  );
}
