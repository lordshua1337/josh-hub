// POST /api/projects/new
// Body: { slug, name?, description?, current_status? }
// Insert a fresh idea/project row. Used by /ideas "+ add idea" form.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Schema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  name: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  current_status: z.enum(["idea", "planned", "future"]).default("idea"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  const sb = supabaseServer();
  const row = {
    slug: parsed.data.slug,
    name: parsed.data.name || parsed.data.slug,
    description: parsed.data.description || null,
    current_status: parsed.data.current_status,
    mode: "idea",
  };
  const { error } = await sb.from("projects").insert(row as never);
  if (error) {
    // Already exists? Just succeed silently.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, existed: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
