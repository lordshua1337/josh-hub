import { SectionStub } from "@/components/SectionStub";

export default function EmailPage() {
  return (
    <SectionStub
      title="Email"
      tagline="Resend broadcasts + transactional — sends, opens, clicks."
      bullets={[
        "Recent broadcasts with open/click rates",
        "List + segment health (subscribers, unsubscribes)",
        "Transactional volume by template",
        "Bounce + complaint surfacing",
      ]}
    />
  );
}
