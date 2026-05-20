import { SectionStub } from "@/components/SectionStub";

export default function ExperimentsPage() {
  return (
    <SectionStub
      title="A/B Tests"
      tagline="Running experiments — variants, lift, statistical significance."
      bullets={[
        "Live and historical experiments",
        "Variant performance side-by-side",
        "Significance + lift calculation",
        "Promote-winner button (writes to source-of-truth config)",
      ]}
    />
  );
}
