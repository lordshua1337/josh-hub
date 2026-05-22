"use client";

// Editorial calendar — month grid + unscheduled drafts rail.
// Click a draft chip → opens a date picker that PATCHes scheduled_for.
// Click a scheduled post chip → routes to /content/social (the editor).

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type CalendarRow = {
  id: string;
  brand: string;
  post_type: string;
  composition: string;
  topic: string | null;
  status: string;
  platform: string;
  scheduled_for: string | null;
  posted_at: string | null;
  copy_blocks: {
    is_carousel?: boolean;
    slides?: { headline?: string; title?: string }[];
    caption?: string;
  } | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  draft: { fg: "#a39888", bg: "rgba(163,152,136,0.16)" },
  scheduled: { fg: "#60a5fa", bg: "rgba(96,165,250,0.16)" },
  queued_for_ig: { fg: "#fbbf24", bg: "rgba(251,191,36,0.16)" },
  draft_pushed: { fg: "#34d399", bg: "rgba(52,211,153,0.16)" },
  posted: { fg: "#34d399", bg: "rgba(52,211,153,0.16)" },
  failed: { fg: "#f87171", bg: "rgba(248,113,113,0.16)" },
  discarded: { fg: "#64748b", bg: "rgba(100,116,139,0.16)" },
};

function postTitle(r: CalendarRow): string {
  const slides = r.copy_blocks?.slides;
  const heroHeadline = slides?.[0]?.headline || slides?.[0]?.title;
  return heroHeadline || r.topic || r.post_type.replace(/_/g, " ");
}

function ymdKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function buildMonthGrid(year: number, month: number): Date[] {
  // 6-row grid (42 cells) starting from the Sunday before the first day.
  const first = startOfMonth(year, month);
  const start = new Date(first);
  start.setDate(start.getDate() - first.getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarBoard({ rows }: { rows: CalendarRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const now = new Date();
  const [cursorY, setCursorY] = useState(now.getFullYear());
  const [cursorM, setCursorM] = useState(now.getMonth());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [pickFor, setPickFor] = useState<string | null>(null); // post id we're scheduling

  function flashFor(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  }

  // Bucket posts by yyyy-mm-dd (scheduled_for OR posted_at)
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarRow[]>();
    for (const r of rows) {
      const iso = r.posted_at || r.scheduled_for;
      if (!iso) continue;
      const k = ymdKey(new Date(iso));
      const arr = m.get(k) ?? [];
      arr.push(r);
      m.set(k, arr);
    }
    return m;
  }, [rows]);

  const unscheduled = useMemo(
    () =>
      rows
        .filter((r) => !r.scheduled_for && !r.posted_at && (r.status === "draft" || r.status === "scheduled"))
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [rows]
  );

  const gridCells = useMemo(() => buildMonthGrid(cursorY, cursorM), [cursorY, cursorM]);

  function nudgeMonth(delta: number) {
    let m = cursorM + delta;
    let y = cursorY;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    setCursorM(m);
    setCursorY(y);
  }

  async function setSchedule(postId: string, dateIso: string | null) {
    setBusyId(postId);
    try {
      const res = await fetch(`/api/social/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_for: dateIso, status: dateIso ? "scheduled" : "draft" }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        flashFor(`Schedule failed: ${json.error}`);
        return;
      }
      flashFor(dateIso ? "Scheduled." : "Unscheduled.");
      setPickFor(null);
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  const todayKey = ymdKey(new Date());

  return (
    <div className="fl-reveal">
      {/* Top bar — month nav + stats */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="act-btn" onClick={() => nudgeMonth(-1)} disabled={pending}>
            ←
          </button>
          <button
            type="button"
            className="act-btn"
            onClick={() => {
              setCursorY(now.getFullYear());
              setCursorM(now.getMonth());
            }}
          >
            today
          </button>
          <button type="button" className="act-btn" onClick={() => nudgeMonth(1)} disabled={pending}>
            →
          </button>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center" }}>
          {MONTH_NAMES[cursorM]} {cursorY}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.08em", textAlign: "right" }}>
          {rows.length} posts · {unscheduled.length} unscheduled · {[...byDay.values()].flat().length} on calendar
        </div>
      </div>

      {flash && <div className="inbox-flash">{flash}</div>}

      {/* Main split: calendar grid + unscheduled rail */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 16 }}>
        {/* Month grid */}
        <div className="card" style={{ padding: 12, overflow: "hidden" }}>
          {/* Day-of-week header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {DOW_SHORT.map((d, i) => (
              <div
                key={`${d}-${i}`}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  textAlign: "center",
                  padding: 4,
                }}
              >
                {d}
              </div>
            ))}
          </div>
          {/* 42 day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {gridCells.map((d, idx) => {
              const key = ymdKey(d);
              const inMonth = d.getMonth() === cursorM;
              const isToday = key === todayKey;
              const posts = byDay.get(key) || [];
              const isPicking = pickFor !== null;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (isPicking && pickFor) {
                      setSchedule(pickFor, new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0, 0).toISOString());
                    }
                  }}
                  disabled={!isPicking && posts.length === 0}
                  style={{
                    position: "relative",
                    minHeight: 96,
                    padding: 6,
                    border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`,
                    background: isPicking
                      ? "rgba(255,138,47,0.06)"
                      : inMonth
                      ? "transparent"
                      : "rgba(0,0,0,0.20)",
                    borderRadius: 4,
                    color: inMonth ? "var(--text)" : "var(--text-tertiary)",
                    fontFamily: "inherit",
                    cursor: isPicking ? "pointer" : posts.length > 0 ? "default" : "default",
                    textAlign: "left",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: isToday ? "var(--accent)" : inMonth ? "var(--text-secondary)" : "var(--text-tertiary)", fontWeight: isToday ? 700 : 400 }}>
                      {d.getDate()}
                    </span>
                    {posts.length > 0 && (
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 9,
                          color: "var(--accent)",
                          padding: "1px 5px",
                          background: "rgba(255,138,47,0.16)",
                          borderRadius: 3,
                          letterSpacing: "0.06em",
                        }}
                      >
                        {posts.length}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {posts.slice(0, 3).map((p) => (
                      <Link
                        key={p.id}
                        href="/content/social"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "block",
                          padding: "3px 6px",
                          fontSize: 10,
                          fontFamily: "var(--mono)",
                          background: STATUS_COLORS[p.status]?.bg || "var(--bg)",
                          color: STATUS_COLORS[p.status]?.fg || "var(--text-secondary)",
                          borderRadius: 3,
                          textDecoration: "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: 1.4,
                        }}
                        title={postTitle(p)}
                      >
                        {postTitle(p).slice(0, 26)}
                      </Link>
                    ))}
                    {posts.length > 3 && (
                      <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
                        +{posts.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {pickFor && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: "rgba(255,138,47,0.08)",
                border: "1px solid rgba(255,138,47,0.30)",
                borderRadius: 4,
                fontSize: 12,
                color: "var(--text-secondary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Click a day to schedule this draft. Posts at 10:00 AM by default.</span>
              <button
                type="button"
                onClick={() => setPickFor(null)}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  padding: "4px 10px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  borderRadius: 3,
                  cursor: "pointer",
                }}
              >
                cancel
              </button>
            </div>
          )}
        </div>

        {/* Unscheduled rail */}
        <div className="card" style={{ padding: 14, height: "fit-content" }}>
          <div className="section-label" style={{ marginBottom: 10 }}>
            unscheduled drafts
          </div>
          {unscheduled.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "8px 4px", lineHeight: 1.55 }}>
              No unscheduled drafts. Go to{" "}
              <Link href="/content/social" style={{ color: "var(--accent)" }}>
                Post Engine
              </Link>{" "}
              to make some.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {unscheduled.slice(0, 30).map((p) => {
                const isActivePick = pickFor === p.id;
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: 10,
                      background: isActivePick ? "rgba(255,138,47,0.10)" : "var(--bg)",
                      border: `1px solid ${isActivePick ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                      <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
                        {p.post_type.replace(/_/g, " ")}
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "var(--mono)",
                          padding: "1px 5px",
                          background: STATUS_COLORS[p.status]?.bg || "var(--bg)",
                          color: STATUS_COLORS[p.status]?.fg || "var(--text-tertiary)",
                          borderRadius: 3,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.35, marginBottom: 6, color: "var(--text)" }}>
                      {postTitle(p).slice(0, 80)}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => setPickFor(isActivePick ? null : p.id)}
                        disabled={busyId === p.id}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          background: isActivePick ? "var(--accent)" : "transparent",
                          color: isActivePick ? "#15100e" : "var(--accent)",
                          border: "1px solid var(--accent)",
                          borderRadius: 3,
                          cursor: "pointer",
                        }}
                      >
                        {isActivePick ? "pick a day →" : "schedule"}
                      </button>
                      <Link
                        href="/content/social"
                        style={{
                          padding: "5px 8px",
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          background: "transparent",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                          borderRadius: 3,
                          textDecoration: "none",
                        }}
                      >
                        edit
                      </Link>
                    </div>
                  </div>
                );
              })}
              {unscheduled.length > 30 && (
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", padding: 6 }}>
                  + {unscheduled.length - 30} more drafts
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--mono)" }}>
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: v.bg, border: `1px solid ${v.fg}` }} />
            <span style={{ letterSpacing: "0.06em" }}>{k.replace(/_/g, " ")}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
