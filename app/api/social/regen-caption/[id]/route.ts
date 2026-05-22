// POST /api/social/regen-caption/[id]
// Re-rolls the caption + first_comment + reel_script for an already-drafted
// post. Slides stay locked — only the publishing package changes. Used by
// the wizard's Review step "Regenerate caption" button.

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getBrand } from "@/lib/social/brands";
import { regenCopyPackage, type SlideContent } from "@/lib/social/copy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = supabaseServer();
  const { data: row, error } = await sb
    .from("social_posts")
    .select("id, brand, post_type, topic, copy_blocks, metadata")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const brand = getBrand(row.brand);
  const copy = (row.copy_blocks as { caption?: string; slides?: SlideContent[]; first_comment?: string }) || {};
  const slides = copy.slides || [];

  let pkg;
  try {
    pkg = await regenCopyPackage(brand, row.post_type, row.topic || "", {
      caption: copy.caption,
      slides,
    });
  } catch (e) {
    return NextResponse.json({ error: `regen failed: ${(e as Error).message}` }, { status: 500 });
  }

  // Write back to the row. Caption lives in copy_blocks (so it ships with
  // the post), and first_comment / reel_script in metadata (same pattern
  // as the original draft endpoint).
  const newCopyBlocks = { ...copy, caption: pkg.caption, first_comment: pkg.first_comment };
  const newMetadata = {
    ...((row.metadata as Record<string, unknown>) || {}),
    first_comment: pkg.first_comment,
    reel_script: pkg.reel_script,
  };
  const { error: upErr } = await sb
    .from("social_posts")
    .update({
      copy_blocks: newCopyBlocks as never,
      metadata: newMetadata as never,
    })
    .eq("id", id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    caption: pkg.caption,
    first_comment: pkg.first_comment,
    reel_script: pkg.reel_script,
  });
}
