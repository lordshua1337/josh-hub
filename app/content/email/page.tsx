import { SectionStub } from "@/components/SectionStub";

export default function EmailPage() {
  return (
    <SectionStub
      title="Email"
      tagline="Fastmail-powered email — broadcasts + transactional sends, opens, clicks."
      bullets={[
        "Recent broadcasts with open/click rates (Fastmail-via-SMTP)",
        "Inbox state: replies, unread, flagged across mailboxes",
        "Masked-email aliases per project + per campaign",
        "Bounce + complaint surfacing",
      ]}
    />
  );
}
