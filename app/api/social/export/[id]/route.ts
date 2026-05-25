// GET /api/social/export/[id]
// Bundles a post into a single .zip download: every slide as a 1080×1080 PNG
// (slide-01.png … slide-NN.png) plus caption.txt (caption + hashtags + first
// comment + reel script). This is the manual Instagram handoff — IG's API
// can't create drafts or attach catalog music, so Josh downloads here and
// finishes in the app.
//
// Gated by middleware (only /api/social/render + ig-webhook are public), so
// this is Josh-only. The slide PNGs are pulled from the public render route.

import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createZip, type ZipEntry } from "@/lib/social/zip";
import { extractHashtags, FALLBACK_HASHTAGS, buildCaptionTxt, type ReelLike } from "@/lib/social/handoff";
import type { SlideContent } from "@/lib/social/copy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function siteBase(origin: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL || origin || "https://prometheus-hub.vercel.app";
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();

  const { data: row, error } = await sb
    .from("social_posts")
    .select("id, topic, copy_blocks, metadata")
    .eq("id", id)
    .maybeSingle();
  if (error) return new Response(`export error: ${error.message}`, { status: 500 });
  if (!row) return new Response("post not found", { status: 404 });

  const cb = row.copy_blocks as { slides?: SlideContent[]; caption?: string; first_comment?: string; reel_script?: ReelLike } | null;
  const meta = row.metadata as { first_comment?: string; reel_script?: ReelLike } | null;
  const slides = cb?.slides ?? [];
  if (slides.length === 0) return new Response("post has no slides", { status: 400 });

  const caption = cb?.caption || "";
  const firstComment = meta?.first_comment || cb?.first_comment || "";
  const reel = meta?.reel_script || cb?.reel_script || null;

  const base = siteBase(req.nextUrl.origin);

  // Pull each slide PNG from the render route, in parallel.
  const pngs = await Promise.all(
    slides.map(async (_s, i) => {
      const url = `${base}/api/social/render?postId=${id}&slide=${i}&size=1080`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`slide ${i + 1} render failed: HTTP ${r.status}`);
      return new Uint8Array(await r.arrayBuffer());
    })
  ).catch((e) => {
    throw e;
  });

  const entries: ZipEntry[] = pngs.map((data, i) => ({
    name: `slide-${String(i + 1).padStart(2, "0")}.png`,
    data,
  }));

  // Hashtags: prefer the post's own (from caption or first comment); else fall
  // back to the brand set so Josh always has something to paste.
  const own = [...extractHashtags(caption), ...extractHashtags(firstComment)];
  const hashtags = own.length ? Array.from(new Set(own)) : FALLBACK_HASHTAGS;

  const captionTxt = buildCaptionTxt({ topic: row.topic, caption, hashtags, firstComment, reel });
  entries.push({ name: "caption.txt", data: new TextEncoder().encode(captionTxt) });

  let zip: Buffer;
  try {
    zip = createZip(entries);
  } catch (e) {
    return new Response(`zip error: ${(e as Error).message}`, { status: 500 });
  }

  const filename = `prometheus-post-${id.slice(0, 8)}.zip`;
  // Wrap the bytes in a Blob — the cleanest BodyInit the project's lib types
  // accept (Buffer/Uint8Array don't satisfy the narrowed BodyInit union here).
  const body = new Blob([new Uint8Array(zip)], { type: "application/zip" });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(zip.length),
      "Cache-Control": "no-store",
    },
  });
}
