import { getMe, listBookings, listEventTypes, type CalBooking, type CalEventType } from "@/lib/cal/api";
import { CalendarView } from "./CalendarView";

export const dynamic = "force-dynamic";

async function load() {
  const now = new Date();
  const [me, upcoming, past, eventTypes] = await Promise.all([
    getMe(),
    listBookings({ status: "upcoming", take: 50 }),
    listBookings({ status: "past", take: 25 }),
    listEventTypes(),
  ]);
  return {
    me,
    upcoming: upcoming.bookings,
    past: past.bookings,
    eventTypes,
    now: now.toISOString(),
  };
}

export default async function CalendarPage() {
  let data: Awaited<ReturnType<typeof load>>;
  try {
    data = await load();
  } catch (e) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Calendar</h1>
          <p className="header-sub">Could not reach Cal.com.</p>
        </div>
        <div className="main">
          <div className="card" style={{ padding: 20, color: "var(--danger)" }}>
            {(e as Error).message}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="header fl-reveal">
        <h1>Calendar</h1>
        <p className="header-sub">
          Cal.com bookings for {data.me.name || data.me.email} — today, upcoming,
          event types, recent.
        </p>
      </div>
      <div className="main">
        <CalendarView
          me={data.me}
          upcoming={data.upcoming as CalBooking[]}
          past={data.past as CalBooking[]}
          eventTypes={data.eventTypes as CalEventType[]}
          now={data.now}
        />
      </div>
    </>
  );
}
