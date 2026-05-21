// Post-type registry for Prometheus social engine.
// Each entry declares: what it is, what slides it produces, and which
// composition templates render it. The drafter + UI both read from this.

export type PostKind = "single" | "carousel";

export type PostTypeDef = {
  slug: string;
  label: string;             // UI label
  pillar: string;            // content pillar grouping
  kind: PostKind;
  slideCount?: number;       // for carousels: max slides
  description: string;       // shown in UI dropdown
  voiceHint: string;         // tone-specific guidance for the drafter
  compositions: string[];    // composition slugs this type can render with
};

export const POST_TYPES: PostTypeDef[] = [
  // ----- SINGLE-IMAGE POSTS -----
  {
    slug: "ai_enablement_declaration",
    label: "AI Enablement — Declaration",
    pillar: "AI Enablement",
    kind: "single",
    description: "One-line truth about how AI actually shows up in a team. Reframes the hype.",
    voiceHint: "Punch the wrong-question vs right-question framing. Operator language only. End with one specific instance.",
    compositions: ["declaration"],
  },
  {
    slug: "hot_take",
    label: "Hot Take — Contrarian",
    pillar: "Strategy",
    kind: "single",
    description: "Sharp, contrarian one-liner. The kind that makes 70% of people uncomfortable.",
    voiceHint: "Be confrontational without being mean. Frame against patterns, never specific people.",
    compositions: ["declaration"],
  },
  {
    slug: "reframe",
    label: "Reframe — They Said / Actually",
    pillar: "Strategy",
    kind: "single",
    description: "What people are told vs what actually works. Split-screen contrast.",
    voiceHint: "Two columns of equal weight. Don't strawman the 'they said' side -- make it accurate, then crush it.",
    compositions: ["split_contrast"],
  },
  {
    slug: "founder_lens",
    label: "Founder / Veteran Lens",
    pillar: "Founder",
    kind: "single",
    description: "Personal moment from the Army or operating life that maps to a business truth.",
    voiceHint: "Specific. Concrete. One scene. Don't moralize -- let the reader draw the line themselves.",
    compositions: ["declaration"],
  },

  // ----- CAROUSEL POSTS -----
  {
    slug: "role_acceleration",
    label: "Role-Specific Acceleration",
    pillar: "AI Enablement",
    kind: "carousel",
    slideCount: 6,
    description: "How AI shows up for one specific role (CEO / CMO / Head of Sales / Ops Lead / Exec Assistant / CFO). 6 slides: hook, 4 acceleration plays, CTA.",
    voiceHint: "Pick ONE role. Be specific about the role's actual daily pain. Each play should be a 1-week move, not a 'transformation initiative.'",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "numbered_step", "carousel_cta"],
  },
  {
    slug: "quick_wins",
    label: "Pick & Shovel Quick Wins",
    pillar: "Build",
    kind: "carousel",
    slideCount: 7,
    description: "5 small things an operator can build/automate THIS WEEK. Hook + 5 plays + CTA.",
    voiceHint: "Every play must be specific enough to start tomorrow. Name tools where helpful. No vague 'improve X' language. Show the wedge, not the platform.",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "numbered_step", "numbered_step", "carousel_cta"],
  },
  {
    slug: "diagnostic",
    label: "Operator Diagnostic",
    pillar: "Strategy",
    kind: "carousel",
    slideCount: 5,
    description: "3-4 questions to ask yourself about your business. Each question reveals a hidden gap.",
    voiceHint: "Questions, not statements. Each one should make the reader uncomfortable in a productive way. End with the question that matters most.",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "carousel_cta"],
  },
  {
    slug: "behind_the_build",
    label: "Behind the Build",
    pillar: "Build",
    kind: "carousel",
    slideCount: 5,
    description: "What we shipped this week. Real spec, real tools, real result.",
    voiceHint: "Mention the specific business problem, the solution, the tools, the result. Numbers if you have them. Modest about generalizing -- 'worked for us, might work for you.'",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "carousel_cta"],
  },
  {
    slug: "compliance_gtm",
    label: "Compliance GTM",
    pillar: "Compliance",
    kind: "carousel",
    slideCount: 5,
    description: "For regulated industries (healthcare, finance, legal, defense). AI playbook that doesn't get you sued.",
    voiceHint: "Take compliance seriously. No 'just be careful' hand-waving. Specific guardrails, specific frameworks. Mention HIPAA / SOC2 / FedRAMP / FINRA where relevant.",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "carousel_cta"],
  },
];

export function getPostType(slug: string): PostTypeDef {
  const t = POST_TYPES.find((p) => p.slug === slug);
  if (!t) throw new Error(`Unknown post type: ${slug}`);
  return t;
}
