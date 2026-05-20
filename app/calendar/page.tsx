import { getMe, listBookings, listEventTypes, type CalBooking, type CalEventType } from "@/lib/cal/api";
import { CalendarView } from "./CalendarView";

export const dynamic = "force-dynamic";

async function load() {
  const [me, upcoming, past, eventTypes] = await Promise.all([
    getMe().catch(() => null),
    listBookings({ status: "upcoming", take: 50 }).catch(() => [] as CalBooking[]),
    listBookings({ status: "past", take: 25 }).catch(() => [] as CalBooking[]),
    listEventTypes().catch(() => [] as CalEventType[]),
  ]);
  return {
    me,
    upcoming,
    past,
    eventTypes,
    now: new Date().toISOString(),
  };
}

export default async function CalendarPage() {
  const data = await load();
  if (!data.me) {
    return (
      <>
        <div className="header fl-reveal">
          <h1>Calendar</h1>
          <p className="header-sub">Could not reach Cal.com.</p>
        </div>
        <div className="main">
          <div className="card" style={{ padding: 20, color: "var(--danger)" }}>
            Failed to authenticate with Cal.com. Check CALCOM_API_KEY.
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
          upcoming={data.upcoming}
          past={data.past}
          eventTypes={data.eventTypes}
          now={data.now}
        />
      </div>
    </>
  );
}
