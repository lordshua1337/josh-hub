"use client";

import { useMemo, useState } from "react";

type Lead = {
  id: string;
  source: string;
  source_url: string | null;
  name: string | null;
  email: string | null;
  company: string | null;
  need: string | null;
  message: string | null;
  status: string;
  received_at: string;
  contacted_at: string | null;
};

type Dim = "source" | "need" | "status" | "month" | "company";

const DIM_LABEL: Record<Dim, string> = {
  source: "Source",
  need: "Need",
  status: "Status",
  month: "Month",
  company: "Company",
};

function bucketValue(lead: Lead, dim: Dim): string {
  switch (dim) {
    case "source":
      return lead.source || "—";
    case "need":
      return lead.need || "(none)";
    case "status":
      return lead.status;
    case "month": {
      const d = new Date(lead.received_at);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    }
    case "company":
      return lead.company || "(none)";
  }
}

export function LeadsPivot({ leads }: { leads: Lead[] }) {
  const [rowDim, setRowDim] = useState<Dim>("source");
  const [colDim, setColDim] = useState<Dim>("need");

  const { rows, cols, matrix, rowTotals, colTotals, grandTotal } = useMemo(() => {
    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    const cells: Record<string, Record<string, number>> = {};
    for (const lead of leads) {
      const r = bucketValue(lead, rowDim);
      const c = bucketValue(lead, colDim);
      rowSet.add(r);
      colSet.add(c);
      cells[r] = cells[r] || {};
      cells[r][c] = (cells[r][c] || 0) + 1;
    }
    const rows = Array.from(rowSet).sort();
    const cols = Array.from(colSet).sort();
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;
    for (const r of rows) {
      for (const c of cols) {
        const v = cells[r]?.[c] || 0;
        rowTotals[r] = (rowTotals[r] || 0) + v;
        colTotals[c] = (colTotals[c] || 0) + v;
        grandTotal += v;
      }
    }
    return { rows, cols, matrix: cells, rowTotals, colTotals, grandTotal };
  }, [leads, rowDim, colDim]);

  return (
    <div className="fl-reveal">
      {/* Stat strip */}
      <div className="stats-bar" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Total Leads</div>
          <div className="stat-num">{leads.length}</div>
          <div className="stat-delta">All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last 7 Days</div>
          <div className="stat-num">
            {leads.filter((l) => Date.now() - new Date(l.received_at).getTime() < 7 * 86400_000).length}
          </div>
          <div className="stat-delta">New since {new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">New (untouched)</div>
          <div className="stat-num">{leads.filter((l) => l.status === "new").length}</div>
          <div className="stat-delta">Awaiting contact</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sources</div>
          <div className="stat-num">{new Set(leads.map((l) => l.source)).size}</div>
          <div className="stat-delta">Across all forms</div>
        </div>
      </div>

      {/* Pivot controls */}
      <div className="pivot-controls">
        <label>
          <span className="pivot-label">Rows</span>
          <select className="pivot-select" value={rowDim} onChange={(e) => setRowDim(e.target.value as Dim)}>
            {(Object.keys(DIM_LABEL) as Dim[]).map((d) => (
              <option key={d} value={d}>
                {DIM_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="pivot-label">Columns</span>
          <select className="pivot-select" value={colDim} onChange={(e) => setColDim(e.target.value as Dim)}>
            {(Object.keys(DIM_LABEL) as Dim[]).map((d) => (
              <option key={d} value={d}>
                {DIM_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
        <div className="pivot-grand">
          Total: <strong>{grandTotal}</strong>
        </div>
      </div>

      {/* Pivot table */}
      <div className="pivot-wrap">
        <table className="pivot-table">
          <thead>
            <tr>
              <th className="pivot-rh">
                {DIM_LABEL[rowDim]} \ {DIM_LABEL[colDim]}
              </th>
              {cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
              <th className="pivot-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <th className="pivot-rh">{r}</th>
                {cols.map((c) => {
                  const v = matrix[r]?.[c] || 0;
                  const intensity = v === 0 ? 0 : Math.min(1, v / Math.max(1, grandTotal / (rows.length * cols.length || 1)) / 4);
                  return (
                    <td key={c} style={v ? { background: `rgba(217,119,6,${0.06 + intensity * 0.25})` } : undefined}>
                      {v || ""}
                    </td>
                  );
                })}
                <td className="pivot-total">{rowTotals[r]}</td>
              </tr>
            ))}
            <tr className="pivot-total-row">
              <th className="pivot-rh">Total</th>
              {cols.map((c) => (
                <td key={c} className="pivot-total">
                  {colTotals[c]}
                </td>
              ))}
              <td className="pivot-total">{grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Raw leads list */}
      <div className="section-header" style={{ marginTop: 32 }}>
        <div className="section-label">All Leads</div>
        <span className="log-count">{leads.length} entries</span>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="leads-table">
          <thead>
            <tr>
              <th>Received</th>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Need</th>
              <th>Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td className="leads-time">{new Date(l.received_at).toISOString().slice(0, 16).replace("T", " ")}</td>
                <td>{l.name || "—"}</td>
                <td>
                  {l.email ? (
                    <a href={`mailto:${l.email}`} className="leads-link">
                      {l.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{l.company || "—"}</td>
                <td>{l.need || "—"}</td>
                <td>
                  <span className="leads-source-pill">{l.source}</span>
                </td>
                <td>
                  <span className={`leads-status leads-status-${l.status}`}>{l.status}</span>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-tertiary)" }}>
                  No leads yet. New submissions on prometheusconsulting.ai will land here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
