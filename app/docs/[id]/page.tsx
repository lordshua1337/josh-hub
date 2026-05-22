// /docs/[id] — split-view editor. Left = fillable fields, right = live preview
// with mustache placeholders replaced. Save, send, sign actions in the toolbar.

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/docs/templates";
import { DocumentEditor, type DocumentRow } from "./DocumentEditor";

export const dynamic = "force-dynamic";

export default async function DocumentPage(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("documents")
    .select(
      "id, template_id, title, status, field_values, recipient_name, recipient_email, recipient_company, client_id, sign_token, sent_at, viewed_at, signed_at, cancelled_at, notes, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Doc</h1>
          <p className="header-sub" style={{ color: "var(--danger)" }}>{error.message}</p>
        </div>
      </>
    );
  }
  if (!data) notFound();

  const template = getTemplate(data.template_id);
  if (!template) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Unknown template</h1>
          <p className="header-sub">Template <code>{data.template_id}</code> is not in the registry.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="header fl-reveal">
        <p className="page-eyebrow">{template.category}</p>
        <h1>{data.title}</h1>
        <p className="header-sub">
          {template.name} · status: <strong style={{ color: "var(--text)" }}>{data.status}</strong>
        </p>
        <div style={{ marginTop: 14 }}>
          <Link href="/docs" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-tertiary)", letterSpacing: "0.08em", textDecoration: "none" }}>
            ← back to docs
          </Link>
        </div>
      </div>
      <div className="main">
        <DocumentEditor row={data as DocumentRow} template={template} />
      </div>
    </>
  );
}
