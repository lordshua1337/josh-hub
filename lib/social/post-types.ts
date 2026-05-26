// Post-type registry — now DERIVED from content-types.ts (the single source of
// truth). Kept as a thin compatibility layer so existing callers (draft route,
// suggest-topics, campaigns, deploy page, composer) keep working with the same
// PostTypeDef shape. New code should prefer importing ContentTypeSpec directly
// from content-types.ts.

import { CONTENT_TYPES, signoffNoteFor, type ContentTypeSpec } from "./content-types";

export type PostKind = "single" | "carousel";

export type PostTypeDef = {
  slug: string;
  label: string;
  pillar: string;
  kind: PostKind;
  slideCount?: number;       // carousels: default slide count
  description: string;
  voiceHint: string;         // tone/arc guidance (used by topic suggester)
  compositions: string[];    // composition slugs this type renders with
  signoffNote?: string;      // carousel-only end-slide note
};

function toPostType(spec: ContentTypeSpec): PostTypeDef {
  const compositions =
    spec.kind === "single"
      ? [spec.design.single ?? spec.design.body]
      : [spec.design.hook ?? "carousel_hook", spec.design.body, spec.design.cta ?? "carousel_cta", "signoff"];
  return {
    slug: spec.slug,
    label: spec.label,
    pillar: spec.pillar,
    kind: spec.kind,
    slideCount: spec.slideRange?.default,
    description: spec.purpose,
    voiceHint: spec.arcGoal,
    compositions,
    signoffNote: spec.kind === "carousel" ? signoffNoteFor(spec.slug) : undefined,
  };
}

export const POST_TYPES: PostTypeDef[] = CONTENT_TYPES.map(toPostType);

export function getPostType(slug: string): PostTypeDef {
  const t = POST_TYPES.find((p) => p.slug === slug);
  if (!t) throw new Error(`Unknown post type: ${slug}`);
  return t;
}
