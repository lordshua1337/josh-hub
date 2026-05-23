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
    voiceHint: "Use the wrong-question vs right-question framing, in plain language. End with one specific, concrete instance.",
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
    voiceHint: "Two columns of equal weight. Don't strawman the 'they said' side -- state it accurately, then answer it honestly.",
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
    description: "How AI shows up for one specific role (CEO / CMO / Head of Sales / Ops Lead / Exec Assistant / CFO). 7 slides: hook + 4 moves + CTA + signoff.",
    voiceHint: "Pick ONE role. Be specific about the work that actually eats their week. Each move should be something they could start in a week, not a big initiative. Be honest about what each one costs to set up.",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "numbered_step", "carousel_cta", "signoff"],
    signoffNote: "tell me the role and where the time goes. I'll write back with where I'd start.",
  },
  {
    slug: "quick_wins",
    label: "Pick & Shovel Quick Wins",
    pillar: "Build",
    kind: "carousel",
    slideCount: 8,
    description: "5 small things a team can build or automate in a week. 8 slides: hook + 5 tactics + CTA + signoff.",
    voiceHint: "Every tactic must be specific enough to start tomorrow. Name the tool. Skip vague 'improve X' language. Say what it does and what it doesn't.",
    compositions: ["carousel_hook", "numbered_step", "numbered_step", "numbered_step", "numbered_step", "numbered_step", "carousel_cta", "signoff"],
    signoffNote: "stuck on the first one? send me the workflow and I'll tell you how I'd approach it.",
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
    signoffNote: "tell me the two systems you're trying to connect. I'll tell you how I'd approach it.",
  },
  {
    slug: "panel_panorama",
    label: "Panorama — Seamless Panel Carousel",
    pillar: "Brand",
    kind: "carousel",
    slideCount: 5, // 3 panels + cta + signoff (drafter sizes panels dynamically below)
    description: "One forge image stretched across multiple swipeable panels. Cinematic. Image is the message. 3-5 panels + CTA + signoff.",
    voiceHint: "Each panel gets ONE short overlay phrase (4-7 words). Read together they should make a single statement. Don't over-explain; the image carries weight.",
    compositions: ["panel_slide", "panel_slide", "panel_slide", "carousel_cta", "signoff"],
    signoffNote: "save this for the next pitch deck. then tell me what you build.",
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
    signoffNote: "tell me which framework you're under (HIPAA / SOC2 / FedRAMP) and I'll point you to where I'd start.",
  },
];

export function getPostType(slug: string): PostTypeDef {
  const t = POST_TYPES.find((p) => p.slug === slug);
  if (!t) throw new Error(`Unknown post type: ${slug}`);
  return t;
}
