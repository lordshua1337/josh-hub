// /docs/templates — the consultant template gallery. Picking a template
// creates a fresh document in 'draft' status and redirects to the editor.

import Link from "next/link";
import { CONTRACT_TEMPLATES } from "@/lib/docs/templates";
import { TemplateGallery } from "./TemplateGallery";

export default function TemplatesPage() {
  // Group by category for visual sections
  const engagement = CONTRACT_TEMPLATES.filter((t) => t.category === "engagement");
  const protection = CONTRACT_TEMPLATES.filter((t) => t.category === "protection");
  const hiring = CONTRACT_TEMPLATES.filter((t) => t.category === "hiring");

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">templates</p>
        <h1>Pick a template</h1>
        <p className="header-sub">
          {CONTRACT_TEMPLATES.length} consultant-grade contracts, organized by what you&apos;re doing.
          Engagement = getting work. Protection = NDAs and IP. Hiring = freelancers + 1099s.
          Click any to draft a new doc with your fields prefilled.
        </p>
        <div style={{ marginTop: 14 }}>
          <Link href="/docs" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-tertiary)", letterSpacing: "0.08em", textDecoration: "none" }}>
            ← back to docs
          </Link>
        </div>
      </div>
      <div className="main">
        <TemplateGallery
          engagement={engagement}
          protection={protection}
          hiring={hiring}
        />
      </div>
    </>
  );
}
