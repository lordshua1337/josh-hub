// POST /api/forge/upload
// Accepts a PNG blob from the Image Forge tool, uploads it to Supabase
// Storage under the forge-renders bucket, returns the public URL. The
// wizard pastes that URL into Step 3 to use the custom render as the
// hero slide background.
//
// Auth: middleware gates this route, so only Josh (or any allowed user)
// can post here. Upload uses the service-role client (no RLS on the
// bucket itself), so we don't need a separate per-user policy.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const BUCKET = "forge-renders";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const slug = String(formData.get("slug") || "render");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "file_too_large", max_mb: 8 }, { status: 413 });
    }

    const sb = supabaseServer();

    // Ensure bucket exists (idempotent). createBucket returns 409 if exists.
    await sb.storage
      .createBucket(BUCKET, { public: true, fileSizeLimit: 8 * 1024 * 1024 })
      .catch(() => undefined);

    const ext = file.type === "image/jpeg" ? "jpg" : "png";
    const safe = slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 40) || "render";
    const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safe}.${ext}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(path, buf, {
        contentType: file.type || "image/png",
        cacheControl: "31536000",
        upsert: false,
      });
    if (upErr) {
      return NextResponse.json({ error: `upload_failed: ${upErr.message}` }, { status: 500 });
    }

    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ ok: true, url: pub.publicUrl, path });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
