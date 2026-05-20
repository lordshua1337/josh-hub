import { SectionStub } from "@/components/SectionStub";

export default function ContentPage() {
  return (
    <SectionStub
      title="Content"
      tagline="Editorial calendar, drafts, published pieces, performance — across blog, social, email."
      bullets={[
        "Content calendar (drafts, scheduled, published)",
        "Per-piece performance (views, conversions, source)",
        "Social post queue (X, LinkedIn, IG)",
        "Email broadcast performance (Resend)",
        "Repurpose suggestions (turn 1 piece into 5)",
        "AI-drafted next-up suggestions based on what's working",
      ]}
    />
  );
}
