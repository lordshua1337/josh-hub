import { SectionStub } from "@/components/SectionStub";

export default function SeoPage() {
  return (
    <SectionStub
      title="SEO"
      tagline="Audits, indexed pages, keywords, schema health — across every project."
      bullets={[
        "Audit score per site (links to /skills/seo-audit)",
        "Indexed page count + recent changes",
        "Tracked keywords + ranking history",
        "Schema validation / structured-data checker",
      ]}
    />
  );
}
