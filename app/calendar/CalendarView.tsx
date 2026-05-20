"use client";

import { useMemo } from "react";
import type { CalBooking, CalEventType, CalUser } from "@/lib/cal/api";

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}
function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)} · ${fmtTime(iso)}`;
}
function isToday(iso: string, nowIso: string): boolean {
  const a = new Date(iso);
  const b = new Date(nowIso);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isThisWeek(iso: string, nowIso: string): boolean {
  const a = new Date(iso).getTime();
  const b = new Date(nowIso).getTime();
  return a >= b && a - b <= 7 * 86400_000;
}
function durationMin(b: CalBooking): number {
  if (b.duration) return b.duration;
  return Math.round((new Date(b.end).getTime() - new Date(b.start).getTime()) / 60000);
}

export function CalendarView({
  me,
  upcoming,
  past,
  eventTypes,
  now,
}: {
  me: CalUser;
  upcoming: CalBooking[];
  past: CalBooking[];
  eventTypes: CalEventType[];
  now: string;
}) {
  const today = useMemo(() => upcoming.filter((b) => isToday(b.start, now)), [upcoming, now]);
  const next7 = useMemo(() => upcoming.filter((b) => isThisWeek(b.start, now)), [upcoming, now]);
  const monthCount = useMemo(() => {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    const startMs = start.getTime();
    return past.filter((b) => new Date(b.start).getTime() >= startMs).length;
  }, [past, now]);

  return (
    <div className="fl-reveal">
      {/* Stat strip */}
      <div className="stats-bar" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Today</div>
          <div className="stat-num">{today.length}</div>
          <div className="stat-delta">{today.length === 1 ? "Call scheduled" : "Calls scheduled"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Next 7 days</div>
          <div className="stat-num">{next7.length}</div>
          <div className="stat-delta">Upcoming bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last 30 days</div>
          <div className="stat-num">{monthCount}</div>
          <div className="stat-delta">Calls completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Event types</div>
          <div className="stat-num">{eventTypes.length}</div>
          <div className="stat-delta">Active booking forms</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="quick-bar fl-reveal" style={{ marginBottom: 28 }}>
        <a
          className="quick-card"
          href={`https://app.cal.com/bookings/upcoming`}
          target="_blank"
          rel="noreferrer"
        >
          <div className="quick-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            ↗
          </div>
          <div>
            <div className="quick-label">Open Cal.com</div>
            <div className="quick-sub">Full app · reschedule, edit</div>
          </div>
        </a>
        <a
          className="quick-card"
          href={`https://cal.com/${me.username ?? ""}`}
          target="_blank"
          rel="noreferrer"
        >
          <div className="quick-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
            ⎘
          </div>
          <div>
            <div className="quick-label">Your booking page</div>
            <div className="quick-sub">cal.com/{me.username ?? "?"}</div>
          </div>
        </a>
        <div className="quick-card">
          <div className="quick-icon" style={{ background: "var(--info-soft)", color: "var(--info)" }}>
            🕘
          </div>
          <div>
            <div className="quick-label">Timezone</div>
            <div className="quick-sub">{me.timeZone || "—"}</div>
          </div>
        </div>
      </div>

      {/* Today */}
      <div className="section-header">
        <div className="section-label">Today — {fmtDate(now)}</div>
        <span className="log-count">{today.length}</span>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        {today.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
            Nothing on today&apos;s calendar.
          </div>
        ) : (
          today.map((b) => <BookingRow key={b.id} b={b} />)
        )}
      </div>

      {/* Upcoming */}
      <div className="section-header">
        <div className="section-label">Upcoming</div>
        <span className="log-count">{upcoming.length}</span>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        {upcoming.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
            No upcoming bookings.
          </div>
        ) : (
          upcoming.slice(0, 25).map((b) => <BookingRow key={b.id} b={b} />)
        )}
      </div>

      {/* Event types */}
      <div className="section-header">
        <div className="section-label">Event types</div>
        <span className="log-count">{eventTypes.length}</span>
      </div>
      <div className="projects" style={{ marginBottom: 24 }}>
        {eventTypes.map((et) => (
          <div className="card" key={et.id}>
            <div className="card-header">
              <div className="card-title">{et.title}</div>
              <span className="badge badge-active">{et.length} min</span>
            </div>
            {et.description && <div className="card-desc">{et.description.slice(0, 200)}</div>}
            <div className="card-actions">
              <a
                className="act-btn act-btn-primary"
                href={`https://cal.com/${me.username ?? ""}/${et.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Share link
              </a>
              <button
                type="button"
                className="act-btn"
                onClick={() => {
                  if (typeof navigator !== "undefined") {
                    navigator.clipboard?.writeText(`https://cal.com/${me.username ?? ""}/${et.slug}`);
                  }
                }}
              >
                Copy link
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent past */}
      {past.length > 0 && (
        <>
          <div className="section-header">
            <div className="section-label">Recent calls</div>
            <span className="log-count">{past.length}</span>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {past.slice(0, 15).map((b) => (
              <BookingRow key={b.id} b={b} past />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BookingRow({ b, past }: { b: CalBooking; past?: boolean }) {
  const guest = b.attendees?.[0];
  return (
    <div className="booking-row">
      <div className="booking-when">
        <div className="booking-date">{fmtDate(b.start)}</div>
        <div className="booking-time">
          {fmtTime(b.start)} · {durationMin(b)}m
        </div>
      </div>
      <div className="booking-body">
        <div className="booking-title">{b.title}</div>
        <div className="booking-meta">
          {guest && (
            <span>
              {guest.name} · <a href={`mailto:${guest.email}`} className="leads-link">{guest.email}</a>
            </span>
          )}
          {b.eventType?.title && <span className="booking-pill">{b.eventType.title}</span>}
          <span className={`leads-status leads-status-${b.status === "accepted" ? "new" : "lost"}`}>
            {b.status}
          </span>
        </div>
      </div>
      <div className="booking-actions">
        {b.meetingUrl && !past && (
          <a className="act-btn act-btn-primary" href={b.meetingUrl} target="_blank" rel="noreferrer">
            Join
          </a>
        )}
        <a className="act-btn" href={`https://app.cal.com/booking/${b.uid || b.id}`} target="_blank" rel="noreferrer">
          Open
        </a>
      </div>
    </div>
  );
}
