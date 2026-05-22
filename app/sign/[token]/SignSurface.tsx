"use client";

import { useState } from "react";
import { type ContractTemplate, renderSectionContent } from "@/lib/docs/templates";

type DocStub = {
  id: string;
  template_id: string;
  title: string;
  status: string;
  field_values: Record<string, string>;
  recipient_name: string | null;
  recipient_email: string | null;
  sign_token: string;
  signed_at: string | null;
};

export function SignSurface({
  doc,
  template,
  alreadySigned,
}: {
  doc: DocStub;
  template: ContractTemplate;
  alreadySigned: boolean;
}) {
  const [agreed, setAgreed] = useState(false);
  const [typedName, setTypedName] = useState(doc.recipient_name || "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadySigned);
  const [error, setError] = useState<string | null>(null);
  const values = (doc.field_values || {}) as Record<string, string>;

  async function onSign() {
    if (!agreed || !typedName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/docs/sign/${doc.sign_token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signer_name: typedName.trim() }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || `HTTP ${res.status}`);
        return;
      }
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px", maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
          // sign document
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 6, color: "var(--text)" }}>
          {doc.title}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {template.name} · sent to {doc.recipient_name || doc.recipient_email}
        </p>
      </div>

      {/* Document body */}
      <article
        className="card"
        style={{ padding: 36, marginBottom: 28, lineHeight: 1.7, color: "var(--text-secondary)" }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
          {values.contract_title || template.name}
        </h2>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", marginBottom: 24, letterSpacing: "0.1em" }}>
          {template.id} · {values.effective_date || ""}
        </div>
        {template.sections.map((sec) => {
          if (!sec.content) return null;
          const rendered = renderSectionContent(sec.content, values);
          return (
            <section key={sec.id} style={{ marginBottom: 22 }}>
              {sec.title && (
                <h3 style={{ fontSize: 13, fontFamily: "var(--mono)", color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
                  {sec.title}
                </h3>
              )}
              <div style={{ fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {rendered}
              </div>
            </section>
          );
        })}
      </article>

      {/* Sign block */}
      {done ? (
        <div
          className="card"
          style={{
            padding: 28,
            background: "rgba(52,211,153,0.06)",
            border: "1px solid rgba(52,211,153,0.30)",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#34d399", marginBottom: 8 }}>
            // signed
          </div>
          <div style={{ fontSize: 16, color: "var(--text)" }}>
            Thanks, <strong>{typedName}</strong>. This document is signed and a copy has been recorded.
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 28 }}>
          <div className="section-label" style={{ marginBottom: 14 }}>Sign here</div>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 4, accentColor: "var(--accent)" }}
            />
            <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
              I have read this document and agree to be bound by its terms. By typing my name below,
              I&apos;m providing my electronic signature, which has the same legal effect as a wet signature
              under the E-SIGN Act and UETA.
            </span>
          </label>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your full legal name"
            disabled={!agreed}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: 22,
              fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
              fontStyle: "italic",
              background: "var(--bg)",
              border: "2px solid var(--border)",
              borderBottom: "2px solid var(--accent)",
              borderRadius: 4,
              color: "var(--text)",
              marginBottom: 14,
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 10 }}>{error}</div>
          )}
          <button
            type="button"
            onClick={onSign}
            disabled={!agreed || !typedName.trim() || submitting}
            className="act-btn act-btn-primary"
            style={{ width: "100%", padding: 14, fontSize: 13 }}
          >
            {submitting ? "Signing…" : "Sign Document"}
          </button>
        </div>
      )}
    </div>
  );
}
