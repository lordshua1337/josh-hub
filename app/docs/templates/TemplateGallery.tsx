"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContractTemplate } from "@/lib/docs/templates";

const CAT_LABELS: Record<"engagement" | "protection" | "hiring", string> = {
  engagement: "engagement",
  protection: "protection",
  hiring: "hiring",
};

const CAT_DESCRIPTIONS = {
  engagement: "Get the work — landing clients, setting scope, charging right.",
  protection: "Cover your back — NDAs, IP, confidentiality.",
  hiring: "Bring help in — 1099s, freelancers, subcontractors.",
};

export function TemplateGallery({
  engagement,
  protection,
  hiring,
}: {
  engagement: ContractTemplate[];
  protection: ContractTemplate[];
  hiring: ContractTemplate[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startDraft(templateId: string) {
    setCreating(templateId);
    setError(null);
    try {
      const res = await fetch("/api/docs/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId }),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok || !json.id) {
        setError(json.error || `HTTP ${res.status}`);
        return;
      }
      router.push(`/docs/${json.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="fl-reveal">
      {error && (
        <div className="inbox-flash" style={{ marginBottom: 14 }}>
          Could not create draft: {error}
        </div>
      )}
      <Group title="Engagement" tagline={CAT_DESCRIPTIONS.engagement} templates={engagement} onPick={startDraft} creating={creating} />
      <Group title="Protection" tagline={CAT_DESCRIPTIONS.protection} templates={protection} onPick={startDraft} creating={creating} />
      <Group title="Hiring" tagline={CAT_DESCRIPTIONS.hiring} templates={hiring} onPick={startDraft} creating={creating} />
    </div>
  );
}

function Group({
  title,
  tagline,
  templates,
  onPick,
  creating,
}: {
  title: string;
  tagline: string;
  templates: ContractTemplate[];
  onPick: (id: string) => void;
  creating: string | null;
}) {
  if (templates.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="section-header" style={{ marginBottom: 12 }}>
        <div className="section-label">{title}</div>
        <span className="log-count">{tagline}</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {templates.map((t) => {
          const isCreating = creating === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t.id)}
              disabled={creating !== null}
              className="card"
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                textAlign: "left",
                cursor: creating === null ? "pointer" : "wait",
                fontFamily: "inherit",
                color: "var(--text)",
                opacity: creating !== null && !isCreating ? 0.5 : 1,
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {t.fields.length} fields
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, minHeight: 50 }}>
                {t.description}
              </div>
              <div
                style={{
                  marginTop: "auto",
                  padding: "8px 0 0",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isCreating ? "var(--accent)" : "var(--text-secondary)",
                  borderTop: "1px solid var(--border)",
                  paddingTop: 8,
                }}
              >
                {isCreating ? "creating draft…" : "use this →"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
