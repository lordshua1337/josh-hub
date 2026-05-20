// Cal.com v2 API client. Server-only.
// v1 was decommissioned May 2026; only v2 endpoints work.

import "server-only";

const BASE = "https://api.cal.com/v2";

function token(): string {
  const t = process.env.CALCOM_API_KEY;
  if (!t) throw new Error("CALCOM_API_KEY not set");
  return t;
}

async function call<T = unknown>(path: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token()}`,
      ...headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`cal.com ${path} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

export type CalUser = {
  id: number;
  email: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  timeZone?: string;
  weekStart?: string;
};

export type CalBooking = {
  id: number;
  uid?: string;
  title: string;
  description?: string;
  status: "accepted" | "pending" | "cancelled" | "rejected" | "awaiting_host";
  start: string;
  end: string;
  duration: number;
  eventTypeId: number;
  eventType?: { slug?: string; title?: string };
  attendees?: { name: string; email: string; timeZone?: string }[];
  hosts?: { name: string; email: string }[];
  meetingUrl?: string | null;
  location?: string;
  bookingFieldsResponses?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  rescheduledFromUid?: string | null;
  rating?: number | null;
};

export type CalEventType = {
  id: number;
  title: string;
  slug: string;
  length: number;
  description?: string;
  hidden?: boolean;
  bookingFields?: unknown[];
  metadata?: Record<string, unknown> | null;
};

export async function getMe(): Promise<CalUser> {
  const res = await call<{ status: string; data: CalUser }>("/me");
  return res.data;
}

/**
 * List bookings. Pagination via cursor. Status filter optional.
 * Cal.com v2 sorts bookings descending by start by default.
 */
export async function listBookings(opts: {
  status?: "upcoming" | "past" | "cancelled" | "recurring";
  take?: number;
  afterStart?: string;
  beforeEnd?: string;
  cursor?: string;
} = {}): Promise<{ bookings: CalBooking[]; totalCount: number; hasMore: boolean; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  params.set("take", String(opts.take ?? 50));
  if (opts.afterStart) params.set("afterStart", opts.afterStart);
  if (opts.beforeEnd) params.set("beforeEnd", opts.beforeEnd);
  if (opts.cursor) params.set("cursor", opts.cursor);
  const res = await call<{
    status: string;
    data: { bookings: CalBooking[]; totalCount: number; hasMore: boolean; nextCursor: string | null };
  }>(`/bookings?${params}`, { "cal-api-version": "2024-08-13" });
  return res.data;
}

/**
 * Flatten the grouped event-types response into a single list.
 */
export async function listEventTypes(): Promise<CalEventType[]> {
  const res = await call<{
    status: string;
    data: {
      eventTypeGroups: { eventTypes: CalEventType[]; profile?: { slug?: string } }[];
    };
  }>("/event-types");
  const out: CalEventType[] = [];
  for (const g of res.data.eventTypeGroups ?? []) {
    for (const et of g.eventTypes ?? []) out.push(et);
  }
  return out;
}

export async function getProfile(): Promise<CalUser & { bookerBaseUrl: string }> {
  const me = await getMe();
  return { ...me, bookerBaseUrl: `https://cal.com/${me.username ?? ""}` };
}
