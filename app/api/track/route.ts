// POST /api/track
// Public endpoint (no auth) that accepts a pageview event from /track.js on
// any of your sites. CORS open to all origins so any front-end can call it.
//
// Body: { site, path, referrer?, utm_source?, utm_medium?, utm_campaign?, session_id?, device? }
// Headers we capture: user-agent, x-vercel-ip-country.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  site: z.string().min(1).max(100),
  path: z.string().max(2048),
  referrer: z.string().max(2048).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  session_id: z.string().max(64).optional(),
  device: z.enum(["mobile", "tablet", "desktop"]).optional(),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function inferDevice(ua: string | null): "mobile" | "tablet" | "desktop" | undefined {
  if (!ua) return undefined;
  const lower = ua.toLowerCase();
  if (/ipad|tablet/.test(lower)) return "tablet";
  if (/mobile|iphone|android(?!.*tablet)/.test(lower)) return "mobile";
  return "desktop";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: corsHeaders() });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten() },
      { status: 400, headers: corsHeaders() }
    );
  }
  const ev = parsed.data;
  const ua = req.headers.get("user-agent");
  const country = req.headers.get("x-vercel-ip-country") || undefined;

  const sb = supabaseServer();
  const { error } = await sb.from("pageviews").insert({
    site: ev.site,
    path: ev.path,
    referrer: ev.referrer ?? null,
    utm_source: ev.utm_source ?? null,
    utm_medium: ev.utm_medium ?? null,
    utm_campaign: ev.utm_campaign ?? null,
    session_id: ev.session_id ?? null,
    device: ev.device ?? inferDevice(ua) ?? null,
    user_agent: ua ?? null,
    country: country ?? null,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
