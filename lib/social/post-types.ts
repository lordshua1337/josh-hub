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
  signoffNote?: string;      // carousel-specific note rendered on the auto-appended signoff slide
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
    slideCount: 7,
    description: "How AI shows up for one specific role (CEO / CMO / Head of Sales / Ops Lead / Exec Assistant / CFO). 7 slides: hook + 4 plays + CTA + signoff.",
    voiceHint: "Pick ONE role. Be specific about the role's actual daily pain. Each play should be a 1-week move, not a 'transformation initiative.'",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "numbered_step", "carousel_cta", "signoff"],
    signoffNote: "tell me the role and the pain. I'll write back with the first play.",
  },
  {
    slug: "quick_wins",
    label: "Pick & Shovel Quick Wins",
    pillar: "Build",
    kind: "carousel",
    slideCount: 8,
    description: "5 small things an operator can build/automate THIS WEEK. 8 slides: hook + 5 plays + CTA + signoff.",
    voiceHint: "Every play must be specific enough to start tomorrow. Name tools where helpful. No vague 'improve X' language. Show the wedge, not the platform.",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "numbered_step", "numbered_step", "carousel_cta", "signoff"],
    signoffNote: "stuck on the first one? send the workflow. I'll send the wedge.",
  },
  {
    slug: "diagnostic",
    label: "Operator Diagnostic",
    pillar: "Strategy",
    kind: "carousel",
    slideCount: 6,
    description: "3-4 questions to ask yourself about your business. Each question reveals a hidden gap. 6 slides: hook + 3 questions + CTA + signoff.",
    voiceHint: "Questions, not statements. Each one should make the reader uncomfortable in a productive way. End with the question that matters most.",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "carousel_cta", "signoff"],
    signoffNote: "answer one of them honestly in a reply. I'll tell you what I'd do next.",
  },
  {
    slug: "behind_the_build",
    label: "Behind the Build",
    pillar: "Build",
    kind: "carousel",
    slideCount: 6,
    description: "What we shipped this week. Real spec, real tools, real result. 6 slides: hook + 3 build notes + CTA + signoff.",
    voiceHint: "Mention the specific business problem, the solution, the tools, the result. Numbers if you have them. Modest about generalizing -- 'worked for us, might work for you.'",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "carousel_cta", "signoff"],
    signoffNote: "name your two systems. I'll scope a similar bridge inside 48 hours.",
  },
  {
    slug: "compliance_gtm",
    label: "Compliance GTM",
    pillar: "Compliance",
    kind: "carousel",
    slideCount: 6,
    description: "For regulated industries (healthcare, finance, legal, defense). AI playbook that doesn't get you sued. 6 slides: hook + 3 guardrails + CTA + signoff.",
    voiceHint: "Take compliance seriously. No 'just be careful' hand-waving. Specific guardrails, specific frameworks. Mention HIPAA / SOC2 / FedRAMP / FINRA where relevant.",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "carousel_cta", "signoff"],
    signoffNote: "name your framework (HIPAA / SOC2 / FedRAMP). I'll send the salvage plan.",
  },
];

export function getPostType(slug: string): PostTypeDef {
  const t = POST_TYPES.find((p) => p.slug === slug);
  if (!t) throw new Error(`Unknown post type: ${slug}`);
  return t;
}
