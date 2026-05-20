import { SectionStub } from "@/components/SectionStub";

export default function CalendarPage() {
  return (
    <SectionStub
      title="Content Calendar"
      tagline="Editorial calendar across blog, social, email — drafts, scheduled, published."
      bullets={[
        "Calendar view (month / week / list)",
        "Drag-and-drop to reschedule",
        "Status per piece: draft / scheduled / published",
        "Cross-channel rollup: 1 idea → blog + social + email variants",
      ]}
    />
  );
}
