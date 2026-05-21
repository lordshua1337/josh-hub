import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that bypass auth entirely.
const PUBLIC_PATHS = new Set(["/login", "/auth/callback", "/auth/error"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/api/cron/")) return true; // cron auth via JH_INGEST_KEY/x-vercel-cron
  if (pathname.startsWith("/api/leads/")) return true; // own auth via x-lead-key header
  if (pathname === "/api/track") return true; // public pageview ingest (CORS open)
  if (pathname === "/track.js") return true; // analytics snippet served from public/
  if (pathname.startsWith("/api/admin/")) return true; // admin endpoints own auth via x-admin-key header
  if (pathname === "/api/social/render") return true; // OG image render — needs to be reachable by IG fetcher
  if (pathname === "/api/social/ig-webhook") return true; // Meta webhook verifier + event POSTs
  if (pathname === "/config-inspector.html") return true; // static asset
  return false;
}

function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const { res, user } = await updateSession(req);

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (!isAllowed(user.email)) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/error";
    url.searchParams.set("reason", "not_allowed");
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Match all paths except static files and image optimization.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
