import { SectionStub } from "@/components/SectionStub";

export default function WebsitePage() {
  return (
    <SectionStub
      title="Website"
      tagline="Live website ops — analytics, page speed, conversion paths, A/B tests, SEO health."
      bullets={[
        "Page speed + Core Web Vitals (Vercel Analytics + PageSpeed Insights)",
        "Real-time visitors + top pages",
        "Conversion funnel per project (impressions → signups)",
        "Active A/B tests and winners",
        "SEO audit pulls (sitemap, schema, indexed pages)",
        "Heatmap snapshots from Hotjar / Clarity",
      ]}
    />
  );
}
