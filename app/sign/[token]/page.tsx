// /sign/[token] — public sign surface. The recipient gets a URL with this
// token (no auth required), reads the doc, types their name to sign, submits.

import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/docs/templates";
import { SignSurface } from "./SignSurface";

export const dynamic = "force-dynamic";

export default async function SignPage(ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("documents")
    .select(
      "id, template_id, title, status, field_values, recipient_name, recipient_email, recipient_company, sign_token, signed_at"
    )
    .eq("sign_token", token)
    .maybeSingle();
  if (error || !data) notFound();

  const template = getTemplate(data.template_id);
  if (!template) notFound();

  // Mark as viewed (fire-and-forget side effect on initial load).
  if (data.status === "sent") {
    await sb
      .from("documents")
      .update({ status: "viewed", viewed_at: new Date().toISOString() } as never)
      .eq("id", data.id);
  }

  return (
    <SignSurface
      doc={data as never}
      template={template}
      alreadySigned={data.status === "signed" || data.status === "completed"}
    />
  );
}
