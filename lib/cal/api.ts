// Cal.com v2 API client. Server-only.
// Different endpoints return different shapes; bookings respects the
// `cal-api-version` header and returns `data: BookingObject[]` directly,
// while /me and /event-types return their legacy structured shapes.

import "server-only";

const BASE = "https://api.cal.com/v2";

function token(): string {
  const t = process.env.CALCOM_API_KEY;
  if (!t) throw new Error("CALCOM_API_KEY not set");
  return t;
}

async function call<T = unknown>(path: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token()}`, ...headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`cal.com ${path} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export type CalUser = {
  id: number;
  email: string;
  name: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  timeZone?: string | null;
  weekStart?: string | null;
  timeFormat?: number | null;
};

export type CalBooking = {
  id: number;
  uid?: string | null;
  title: string;
  description?: string | null;
  status: string;
  start: string;
  end: string;
  duration?: number;
  eventTypeId?: number;
  eventType?: { slug?: string | null; title?: string | null } | null;
  attendees?: { name: string; email: string; timeZone?: string }[];
  hosts?: { name?: string; email?: string }[];
  meetingUrl?: string | null;
  location?: string | null;
  createdAt?: string;
  updatedAt?: string;
  rescheduledFromUid?: string | null;
};

export type CalEventType = {
  id: number;
  title: string;
  slug: string;
  length: number;
  description?: string | null;
  hidden?: boolean;
};

export async function getMe(): Promise<CalUser> {
  const res = await call<{ status: string; data: CalUser }>("/me");
  return res.data;
}

/**
 * List bookings. v2024-08-13 returns `data` as a plain array.
 * The legacy shape (no version header) returns `data: { bookings: [...] }`.
 * We handle both defensively.
 */
export async function listBookings(opts: {
  status?: "upcoming" | "past" | "cancelled" | "recurring";
  take?: number;
} = {}): Promise<CalBooking[]> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  params.set("take", String(opts.take ?? 50));
  const res = await call<{
    status: string;
    data: CalBooking[] | { bookings?: CalBooking[] };
  }>(`/bookings?${params}`, { "cal-api-version": "2024-08-13" });
  const d = res.data as unknown;
  if (Array.isArray(d)) return d as CalBooking[];
  if (d && typeof d === "object" && Array.isArray((d as { bookings?: CalBooking[] }).bookings)) {
    return (d as { bookings: CalBooking[] }).bookings;
  }
  return [];
}

/**
 * Flatten the grouped event-types response into a single list. The legacy
 * endpoint (no version header) returns eventTypeGroups[].eventTypes[].
 */
export async function listEventTypes(): Promise<CalEventType[]> {
  const res = await call<{
    status: string;
    data: {
      eventTypeGroups?: { eventTypes?: CalEventType[] }[];
    };
  }>("/event-types");
  const out: CalEventType[] = [];
  for (const g of res.data?.eventTypeGroups ?? []) {
    for (const et of g.eventTypes ?? []) out.push(et);
  }
  return out;
}
