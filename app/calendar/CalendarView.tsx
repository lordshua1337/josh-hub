"use client";

import { useMemo, useState } from "react";
import type { CalBooking, CalEventType, CalUser } from "@/lib/cal/api";

// ---------- date utilities (host's local timezone) ----------
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameYmd(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function fmtDayLong(d: Date): string {
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString([], { month: "long", year: "numeric" });
}
function durationMin(b: CalBooking): number {
  if (b.duration) return b.duration;
  const ms = new Date(b.end).getTime() - new Date(b.start).getTime();
  return isNaN(ms) ? 0 : Math.round(ms / 60000);
}

function indexByDay(bookings: CalBooking[]): Map<string, CalBooking[]> {
  const map = new Map<string, CalBooking[]>();
  for (const b of bookings) {
    const d = new Date(b.start);
    if (isNaN(d.getTime())) continue;
    const key = ymd(d);
    const arr = map.get(key) || [];
    arr.push(b);
    map.set(key, arr);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }
  return map;
}

// ---------- main view ----------
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
  const today = useMemo(() => new Date(now), [now]);
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(today));
  const [selected, setSelected] = useState<Date>(today);

  const allBookings = useMemo(() => [...upcoming, ...past], [upcoming, past]);
  const byDay = useMemo(() => indexByDay(allBookings), [allBookings]);

  const todayCount = byDay.get(ymd(today))?.length ?? 0;
  const next7 = useMemo(() => {
    let n = 0;
    for (let i = 0; i < 7; i++) n += byDay.get(ymd(addDays(today, i)))?.length ?? 0;
    return n;
  }, [byDay, today]);
  const monthCount = useMemo(() => {
    const prefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    let n = 0;
    for (const [k, arr] of byDay) if (k.startsWith(prefix)) n += arr.length;
    return n;
  }, [byDay, cursor]);

  const selectedBookings = byDay.get(ymd(selected)) ?? [];

  return (
    <div className="fl-reveal">
      <div className="stats-bar" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Today</div>
          <div className="stat-num">{todayCount}</div>
          <div className="stat-delta">{todayCount === 1 ? "Call" : "Calls"} scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Next 7 days</div>
          <div className="stat-num">{next7}</div>
          <div className="stat-delta">Upcoming bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{fmtMonthYear(cursor)}</div>
          <div className="stat-num">{monthCount}</div>
          <div className="stat-delta">Bookings this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Event types</div>
          <div className="stat-num">{eventTypes.length}</div>
          <div className="stat-delta">Active booking forms</div>
        </div>
      </div>

      <div className="cal-card">
        <div className="cal-header">
          <button type="button" className="cal-nav" onClick={() => setCursor(addMonths(cursor, -1))} aria-label="Previous month">
            ‹
          </button>
          <div className="cal-month">{fmtMonthYear(cursor)}</div>
          <button type="button" className="cal-nav" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Next month">
            ›
          </button>
          <button
            type="button"
            className="cal-today-btn"
            onClick={() => {
              setCursor(startOfMonth(today));
              setSelected(today);
            }}
          >
            Today
          </button>
        </div>
        <MonthGrid cursor={cursor} today={today} selected={selected} byDay={byDay} onSelect={setSelected} />
      </div>

      <div className="section-header" style={{ marginTop: 24 }}>
        <div className="section-label">{fmtDayLong(selected)}</div>
        <span className="log-count">
          {selectedBookings.length} {selectedBookings.length === 1 ? "booking" : "bookings"}
        </span>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        {selectedBookings.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
            Nothing on this day.
          </div>
        ) : (
          selectedBookings.map((b) => (
            <BookingRow key={b.id} b={b} past={new Date(b.start).getTime() < today.getTime()} />
          ))
        )}
      </div>

      <div className="quick-bar fl-reveal" style={{ marginBottom: 28 }}>
        <a className="quick-card" href="https://app.cal.com/bookings/upcoming" target="_blank" rel="noreferrer">
          <div className="quick-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            ↗
          </div>
          <div>
            <div className="quick-label">Open Cal.com</div>
            <div className="quick-sub">Full app · reschedule, edit</div>
          </div>
        </a>
        <a className="quick-card" href={`https://cal.com/${me.username ?? ""}`} target="_blank" rel="noreferrer">
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

// ---------- month grid ----------
function MonthGrid({
  cursor,
  today,
  selected,
  byDay,
  onSelect,
}: {
  cursor: Date;
  today: Date;
  selected: Date;
  byDay: Map<string, CalBooking[]>;
  onSelect: (d: Date) => void;
}) {
  const first = startOfMonth(cursor);
  const start = addDays(first, -first.getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(start, i));
  const weekHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="cal-grid">
      {weekHeaders.map((w) => (
        <div className="cal-dow" key={w}>
          {w}
        </div>
      ))}
      {cells.map((d, i) => {
        const inMonth = d.getMonth() === cursor.getMonth();
        const isToday = sameYmd(d, today);
        const isSelected = sameYmd(d, selected);
        const bookings = byDay.get(ymd(d)) ?? [];
        return (
          <button
            type="button"
            key={i}
            className={[
              "cal-cell",
              inMonth ? "" : "cal-cell-out",
              isToday ? "cal-cell-today" : "",
              isSelected ? "cal-cell-selected" : "",
              bookings.length > 0 ? "cal-cell-has" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => onSelect(d)}
            title={`${d.toDateString()}${bookings.length ? ` · ${bookings.length} booking${bookings.length === 1 ? "" : "s"}` : ""}`}
          >
            <div className="cal-cell-day">{d.getDate()}</div>
            {bookings.length > 0 && (
              <div className="cal-cell-items">
                {bookings.slice(0, 2).map((b) => (
                  <div className="cal-cell-pill" key={b.id}>
                    <span className="cal-cell-time">{fmtTime(b.start)}</span>
                    <span className="cal-cell-title">{b.title}</span>
                  </div>
                ))}
                {bookings.length > 2 && <div className="cal-cell-more">+{bookings.length - 2} more</div>}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------- booking row ----------
function BookingRow({ b, past }: { b: CalBooking; past?: boolean }) {
  const guest = b.attendees?.[0];
  return (
    <div className="booking-row">
      <div className="booking-when">
        <div className="booking-date">
          {new Date(b.start).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
        </div>
        <div className="booking-time">
          {fmtTime(b.start)} · {durationMin(b)}m
        </div>
      </div>
      <div className="booking-body">
        <div className="booking-title">{b.title}</div>
        <div className="booking-meta">
          {guest && (
            <span>
              {guest.name} ·{" "}
              <a href={`mailto:${guest.email}`} className="leads-link">
                {guest.email}
              </a>
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
