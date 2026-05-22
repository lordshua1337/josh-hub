"use client";

// Split-view document editor:
//   Left  — fillable fields grouped by section, autosave on blur
//   Right — live preview with {{mustache}} placeholders interpolated
//   Top   — title + recipient + Send for signature button + status

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  type ContractTemplate,
  renderSectionContent,
} from "@/lib/docs/templates";

export type DocumentRow = {
  id: string;
  template_id: string;
  title: string;
  status: string;
  field_values: Record<string, string> | unknown;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_company: string | null;
  client_id: string | null;
  sign_token: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function toFieldRecord(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object") return {};
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, val == null ? "" : String(val)])
  );
}

export function DocumentEditor({ row, template }: { row: DocumentRow; template: ContractTemplate }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(toFieldRecord(row.field_values));
  const [title, setTitle] = useState(row.title);
  const [recipient, setRecipient] = useState({
    name: row.recipient_name || "",
    email: row.recipient_email || "",
    company: row.recipient_company || "",
  });
  const [notes, setNotes] = useState(row.notes || "");
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  function flashFor(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  }

  // Group fields by section for the left rail
  const grouped = useMemo(() => {
    const m = new Map<string, typeof template.fields>();
    for (const f of template.fields) {
      const arr = m.get(f.section) ?? [];
      arr.push(f);
      m.set(f.section, arr);
    }
    return m;
  }, [template.fields]);

  // Compute completion %
  const completion = useMemo(() => {
    const required = template.fields.filter((f) => f.required);
    if (required.length === 0) return 100;
    const filled = required.filter((f) => (values[f.key] || "").trim().length > 0).length;
    return Math.round((filled / required.length) * 100);
  }, [template.fields, values]);

  async function patchDoc(body: Record<string, unknown>): Promise<boolean> {
    setBusy("save");
    try {
      const res = await fetch(`/api/docs/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Save failed: ${json.error}`);
        return false;
      }
      startTransition(() => router.refresh());
      return true;
    } catch (e) {
      flashFor(`Save failed: ${(e as Error).message}`);
      return false;
    } finally {
      setBusy(null);
    }
  }

  // Autosave field values to DB (debounced)
  const valuesKey = JSON.stringify(values);
  useEffect(() => {
    if (valuesKey === JSON.stringify(toFieldRecord(row.field_values))) return;
    const t = setTimeout(() => {
      patchDoc({ field_values: values });
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesKey]);

  async function onSendForSignature() {
    if (!recipient.email || !recipient.name) {
      flashFor("Set recipient name + email first.");
      return;
    }
    setBusy("send");
    try {
      // Persist recipient and any unsaved state
      await patchDoc({
        title,
        field_values: values,
        recipient_name: recipient.name,
        recipient_email: recipient.email,
        recipient_company: recipient.company,
        notes,
      });
      const res = await fetch(`/api/docs/${row.id}/send`, { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; sign_url?: string; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Send failed: ${json.error}`);
        return;
      }
      flashFor(`Sent. Sign URL: ${json.sign_url}`);
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function onMarkSigned() {
    setBusy("mark");
    await patchDoc({ status: "signed", signed_at: new Date().toISOString() });
    flashFor("Marked as signed.");
    setBusy(null);
  }

  async function onCancel() {
    if (!confirm("Cancel this document? It'll be marked cancelled (not deleted).")) return;
    setBusy("cancel");
    await patchDoc({ status: "cancelled", cancelled_at: new Date().toISOString() });
    flashFor("Cancelled.");
    setBusy(null);
  }

  const status = row.status || "draft";
  const isLocked = status === "sent" || status === "signed" || status === "completed" || status === "cancelled";
  const signUrl = row.sign_token
    ? typeof window !== "undefined"
      ? `${window.location.origin}/sign/${row.sign_token}`
      : `/sign/${row.sign_token}`
    : null;

  return (
    <div className="fl-reveal">
      {flash && <div className="inbox-flash">{flash}</div>}

      {/* Header bar */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 14,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title !== row.title) patchDoc({ title });
            }}
            disabled={isLocked}
            style={{
              width: "100%",
              padding: "6px 8px",
              fontSize: 18,
              fontWeight: 700,
              background: "transparent",
              border: "1px solid transparent",
              borderRadius: 4,
              color: "var(--text)",
              fontFamily: "inherit",
            }}
          />
          <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
            <span>{completion}% complete</span>
            <span>·</span>
            <span>{template.fields.length} fields</span>
            <span>·</span>
            <span>status: {status}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {status === "draft" && (
            <button
              type="button"
              onClick={onSendForSignature}
              disabled={busy !== null || pending}
              className="act-btn act-btn-primary"
            >
              {busy === "send" ? "Sending…" : "Send for Signature →"}
            </button>
          )}
          {(status === "sent" || status === "viewed") && (
            <button
              type="button"
              onClick={onMarkSigned}
              disabled={busy !== null}
              className="act-btn act-btn-primary"
            >
              Mark as Signed
            </button>
          )}
          {!isLocked && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy !== null}
              className="act-btn"
            >
              Cancel doc
            </button>
          )}
        </div>
      </div>

      {/* Sign link banner once sent */}
      {signUrl && (status === "sent" || status === "viewed") && (
        <div
          className="card"
          style={{
            padding: 14,
            marginBottom: 14,
            background: "rgba(96,165,250,0.06)",
            border: "1px solid rgba(96,165,250,0.30)",
          }}
        >
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#60a5fa", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
            // sign URL — send this to {recipient.name || "the recipient"}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input readOnly value={signUrl} style={{ flex: 1, padding: 8, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text)" }} />
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(signUrl).catch(() => undefined);
                flashFor("Sign URL copied.");
              }}
              className="act-btn"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Split view */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 360px) minmax(0, 1fr)", gap: 16 }}>
        {/* Fields rail */}
        <div className="card" style={{ padding: 16, maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Fields</div>

          {/* Recipient block */}
          <div style={{ padding: 12, background: "rgba(242,138,47,0.04)", border: "1px solid rgba(255,138,47,0.16)", borderRadius: 4, marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
              // recipient (who&apos;s signing)
            </div>
            <input
              type="text"
              value={recipient.name}
              onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
              onBlur={() => {
                if (recipient.name !== (row.recipient_name || "")) {
                  patchDoc({ recipient_name: recipient.name });
                }
              }}
              placeholder="Name"
              disabled={isLocked}
              style={fieldStyle}
            />
            <input
              type="email"
              value={recipient.email}
              onChange={(e) => setRecipient({ ...recipient, email: e.target.value })}
              onBlur={() => {
                if (recipient.email !== (row.recipient_email || "")) {
                  patchDoc({ recipient_email: recipient.email });
                }
              }}
              placeholder="Email"
              disabled={isLocked}
              style={{ ...fieldStyle, marginTop: 6 }}
            />
            <input
              type="text"
              value={recipient.company}
              onChange={(e) => setRecipient({ ...recipient, company: e.target.value })}
              onBlur={() => {
                if (recipient.company !== (row.recipient_company || "")) {
                  patchDoc({ recipient_company: recipient.company });
                }
              }}
              placeholder="Company (optional)"
              disabled={isLocked}
              style={{ ...fieldStyle, marginTop: 6 }}
            />
          </div>

          {template.sections.map((sec) => {
            const fields = grouped.get(sec.id) || [];
            if (fields.length === 0) return null;
            return (
              <div
                key={sec.id}
                style={{
                  marginBottom: 18,
                  padding: 10,
                  borderLeft: activeSection === sec.id ? "2px solid var(--accent)" : "2px solid transparent",
                  background: activeSection === sec.id ? "rgba(242,138,47,0.03)" : "transparent",
                }}
                onMouseEnter={() => setActiveSection(sec.id)}
              >
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                  // {sec.title || sec.id}
                </div>
                {fields.map((f) => {
                  if (f.type === "signature") return null; // signed on the sign page
                  const v = values[f.key] || "";
                  const labelEl = (
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
                      {f.label}
                      {f.required && <span style={{ color: "var(--accent)" }}> *</span>}
                    </div>
                  );
                  const common = {
                    value: v,
                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                      setValues((prev) => ({ ...prev, [f.key]: e.target.value })),
                    placeholder: f.placeholder,
                    disabled: isLocked,
                    style: fieldStyle,
                  };
                  return (
                    <div key={f.id} style={{ marginBottom: 10 }}>
                      {labelEl}
                      {f.type === "textarea" ? (
                        <textarea {...common} rows={3} style={{ ...fieldStyle, resize: "vertical" }} />
                      ) : f.type === "dropdown" ? (
                        <select {...common}>
                          <option value="">{f.placeholder || "Select…"}</option>
                          {(f.options || []).map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : f.type === "date" ? (
                        <input type="date" {...common} />
                      ) : f.type === "email" ? (
                        <input type="email" {...common} />
                      ) : f.type === "number" ? (
                        <input type="number" {...common} />
                      ) : (
                        <input type="text" {...common} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Internal notes */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
              // private notes (not in doc)
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== (row.notes || "")) patchDoc({ notes });
              }}
              placeholder="Any reminders to yourself about this doc"
              rows={3}
              style={{ ...fieldStyle, resize: "vertical" }}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="card" style={{ padding: 30, maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
          <div className="section-label" style={{ marginBottom: 14 }}>Live preview</div>
          <article style={{ fontFamily: "Inter, sans-serif", color: "var(--text)" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
              {values.contract_title || template.name}
            </h2>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.1em", marginBottom: 24 }}>
              {template.id} · {values.effective_date || "{{effective_date}}"}
            </div>
            {template.sections.map((sec) => {
              if (!sec.content) return null;
              const rendered = renderSectionContent(sec.content, values);
              return (
                <section
                  key={sec.id}
                  onMouseEnter={() => setActiveSection(sec.id)}
                  style={{ marginBottom: 22, padding: 8, borderLeft: activeSection === sec.id ? "2px solid var(--accent)" : "2px solid transparent" }}
                >
                  {sec.title && (
                    <h3 style={{ fontSize: 13, fontFamily: "var(--mono)", color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>
                      {sec.title}
                    </h3>
                  )}
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                    {rendered}
                  </div>
                </section>
              );
            })}
          </article>
        </div>
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 3,
  color: "var(--text)",
  fontFamily: "inherit",
  fontSize: 13,
};
