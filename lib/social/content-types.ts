// content-types.ts — the single source of truth for what a post IS.
//
// Each content type carries a full specification: its purpose, the narrative
// arc its slides must form, what one body slide represents (and its real
// label — never "move N of N"), the 2-3 grounding specifics the wizard asks
// for, a hard specificity bar that gets injected into the generation prompt,
// few-shot good-vs-generic exemplars, calibrated field caps, and which
// composition renders each slide.
//
// This replaces the old CAROUSEL_CONFIG + post-types registry. arc-spec.ts
// builds arcs + prompts from these specs; copy.ts drafts from them.

// ── Calibrated field caps (from worst-case render calibration) ───────────────
// Owned here so there's one home for the numbers. arc-spec.ts imports these.

export type FieldLimit = {
  key: string;
  role: string;                 // human description injected into the prompt
  targetWords: [number, number];
  maxWords: number;             // 0 = no word cap (char cap only)
  maxChars: number;             // HARD overflow guard
  required: boolean;
};

export const FIELD: Record<string, FieldLimit> = {
  hookHeadline: { key: "headline", role: "the opening line that makes someone stop, stated plainly (no hype)", targetWords: [5, 9], maxWords: 12, maxChars: 54, required: true },
  hookSubtitle: { key: "subtitle", role: "the second line that adds the real point under the headline", targetWords: [8, 14], maxWords: 18, maxChars: 95, required: false },
  stepTitle: { key: "title", role: "the action/point, named in plain words (keep it tight, ~5 words)", targetWords: [3, 6], maxWords: 8, maxChars: 46, required: true },
  stepSubtitle: { key: "subtitle", role: "optional one-line clarifier under the title", targetWords: [5, 9], maxWords: 11, maxChars: 60, required: false },
  stepBody: { key: "body", role: "1-2 plain sentences that actually teach it: name the concrete tool/mechanism and one real number or artifact, and be honest about the tradeoff", targetWords: [18, 30], maxWords: 38, maxChars: 200, required: true },
  ctaCloser: { key: "closer", role: "the closing line that lands the point, calm not salesy", targetWords: [6, 10], maxWords: 12, maxChars: 50, required: true },
  ctaAction: { key: "cta", role: "one clear, low-pressure next step (a question to sit with, or a simple way to reach out)", targetWords: [5, 9], maxWords: 12, maxChars: 50, required: true },
  contrastSaid: { key: "theySaid", role: "the popular belief, stated fairly (not a strawman)", targetWords: [5, 11], maxWords: 14, maxChars: 58, required: true },
  contrastTrue: { key: "trueLine", role: "what's actually true, the specific reframe", targetWords: [5, 9], maxWords: 11, maxChars: 60, required: true },
  declHeadline: { key: "headline", role: "the one-line belief, rewritten punchy (never the topic verbatim)", targetWords: [4, 8], maxWords: 10, maxChars: 42, required: true },
  declSubtitle: { key: "subtitle", role: "the supporting line that earns the claim", targetWords: [8, 16], maxWords: 22, maxChars: 100, required: false },
};

// ── Spec shape ───────────────────────────────────────────────────────────────

export type GroundingField = {
  key: string;          // form field key, also referenced in the prompt
  label: string;        // wizard label
  placeholder: string;  // wizard hint
  required: boolean;
};

export type BodyUnit = {
  singular: string;     // "tactic"
  plural: string;       // "tactics"
  eyebrowLabel: string; // the slide overline — a real label, never a count
};

export type BodyMode = "parallel" | "sequential" | "contrast" | "conceptual";

export type ContentTypeSpec = {
  slug: string;
  label: string;
  pillar: string;
  kind: "single" | "carousel";
  purpose: string;
  slideRange?: { min: number; max: number; default: number };
  bodyMode?: BodyMode;                 // carousels only
  bodyUnit?: BodyUnit;                 // carousels only
  arcGoal: string;                     // the spine the slides must form
  grounding: GroundingField[];         // 2-3 specifics asked up front
  specificityBar: string;              // injected into ideation — the "is this real?" gate
  exemplars: { good: string[]; generic: string[] };
  bodyFields: FieldLimit[];            // caps for a body slide (carousels)
  singleFields?: FieldLimit[];         // caps for a single post
  design: {                            // composition per slide role
    hook?: string;
    body: string;
    cta?: string;
    single?: string;
  };
};

// ── The 8 types ──────────────────────────────────────────────────────────────

export const CONTENT_TYPES: ContentTypeSpec[] = [
  {
    slug: "tactical_playbook",
    label: "Tactical Playbook",
    pillar: "Build",
    kind: "carousel",
    purpose: "N specific, independent moves a reader can run this week for one situation or role. The workhorse growth post.",
    slideRange: { min: 5, max: 9, default: 7 },
    bodyMode: "parallel",
    bodyUnit: { singular: "tactic", plural: "tactics", eyebrowLabel: "tactic" },
    arcGoal: "independent, do-it-this-week tactics for the stated role/workflow, most useful first, no overlap",
    grounding: [
      { key: "audience", label: "Who's it for", placeholder: "e.g. Head of Sales at a B2B services firm", required: true },
      { key: "painful_workflow", label: "The workflow that's eating their time", placeholder: "e.g. manually building weekly client reports", required: true },
      { key: "known_tool", label: "A tool you'd actually reach for (optional)", placeholder: "e.g. Zapier, Claude, Gong, Airtable", required: false },
    ],
    specificityBar:
      "Each tactic must name a specific tool + the exact thing it does + one real number, output, or artifact. If a smart operator reads it and thinks 'no shit,' it FAILS. 'Talk to sales and find your drop-off points' fails. 'Pipe every closed-won deal into a Claude prompt that drafts the 60-day renewal email from that account's original pain points' passes.",
    exemplars: {
      good: [
        "Build a Zapier flow that turns each Gong call transcript into a 3-bullet CRM note within 5 minutes of hangup, so reps stop skipping notes.",
        "Feed last quarter's won and lost proposals into Claude and ask it to name the 3 phrases that show up in wins but not losses. Put those in your template.",
      ],
      generic: [
        "Use AI to improve your sales process.",
        "Automate your reporting to save time.",
      ],
    },
    bodyFields: [FIELD.stepTitle, FIELD.stepSubtitle, FIELD.stepBody],
    design: { hook: "carousel_hook", body: "numbered_step", cta: "carousel_cta" },
  },
  {
    slug: "teardown",
    label: "Teardown / Case Study",
    pillar: "Build",
    kind: "carousel",
    purpose: "One real build told straight: what broke, what you did, what it moved. Proof you do the work.",
    slideRange: { min: 5, max: 7, default: 6 },
    bodyMode: "sequential",
    bodyUnit: { singular: "beat", plural: "beats", eyebrowLabel: "the build" },
    arcGoal: "one true story in order: the problem that was bleeding, the approach, the tools wired, the result with a real number",
    grounding: [
      { key: "what_broke", label: "What was broken / bleeding", placeholder: "e.g. ops lead hand-keyed quotes from CRM into QuickBooks, 9 hrs/wk", required: true },
      { key: "what_built", label: "What you built", placeholder: "e.g. a sync that pushes closed quotes straight into invoices", required: true },
      { key: "result", label: "The result (a real number)", placeholder: "e.g. 80 hours/month back, zero re-keying errors", required: true },
    ],
    specificityBar:
      "Every beat must reference THIS specific build — real tools, real numbers, real friction. No generic narration like 'they had some inefficiencies.' Name the system, the hours, the dollar figure, the tool. If a beat could describe any company, rewrite it.",
    exemplars: {
      good: [
        "The problem: their ops lead spent 9 hours a week hand-keying won quotes from HubSpot into QuickBooks, and ~1 in 12 had a typo.",
        "We wired a Make scenario: quote marked closed-won in HubSpot fires a webhook that creates the QuickBooks invoice with line items intact.",
      ],
      generic: [
        "They were struggling with inefficiency in their workflow.",
        "We used AI to make things better and saw great results.",
      ],
    },
    bodyFields: [FIELD.stepTitle, FIELD.stepSubtitle, FIELD.stepBody],
    design: { hook: "carousel_hook", body: "numbered_step", cta: "carousel_cta" },
  },
  {
    slug: "diagnostic",
    label: "Diagnostic",
    pillar: "Strategy",
    kind: "carousel",
    purpose: "N sharp questions that show a reader where their business actually stands. Productively uncomfortable.",
    slideRange: { min: 5, max: 7, default: 6 },
    bodyMode: "parallel",
    bodyUnit: { singular: "question", plural: "questions", eyebrowLabel: "question" },
    arcGoal: "self-audit questions that expose a hidden gap each, sharpest one last",
    grounding: [
      { key: "area", label: "The business area", placeholder: "e.g. readiness to adopt AI without wasting 6 months", required: true },
      { key: "good_looks_like", label: "What 'good' looks like (optional)", placeholder: "e.g. one owner per tool, data in one place", required: false },
    ],
    specificityBar:
      "Each question must point at a concrete, checkable thing — a specific artifact, person, number, or process — not a vibe. 'Are you using AI effectively?' fails. 'If your best rep quit tomorrow, how much of what they know is written down anywhere?' passes. A good question makes the reader go quiet, not nod.",
    exemplars: {
      good: [
        "What's the one report your team rebuilds by hand every month that nobody has questioned in a year?",
        "If your best rep quit tomorrow, how much of what they know is written down anywhere a tool could use?",
      ],
      generic: [
        "Are you ready for the future of AI?",
        "Is your business using technology well?",
      ],
    },
    bodyFields: [FIELD.stepTitle, FIELD.stepSubtitle, FIELD.stepBody],
    design: { hook: "carousel_hook", body: "numbered_step", cta: "carousel_cta" },
  },
  {
    slug: "myth_vs_reality",
    label: "Myth vs Reality",
    pillar: "Strategy",
    kind: "carousel",
    purpose: "N popular beliefs in your space, each fairly stated then flipped to what's actually true.",
    slideRange: { min: 5, max: 8, default: 6 },
    bodyMode: "contrast",
    bodyUnit: { singular: "myth", plural: "myths", eyebrowLabel: "what they say" },
    arcGoal: "common beliefs stated fairly, each flipped to a specific truth; the sharpest correction last",
    grounding: [
      { key: "audience", label: "Who believes these", placeholder: "e.g. founders sold on 'AI strategy' decks", required: true },
      { key: "core_belief", label: "The belief you're countering", placeholder: "e.g. you need a data strategy before you can use AI", required: true },
    ],
    specificityBar:
      "State the myth the way a smart person actually believes it — no strawmen. The reality must be a SPECIFIC reframe with a concrete alternative, not just 'it's the opposite.' 'Myth: AI is hard. Reality: AI is easy' fails. 'Myth: you need a data strategy first. Reality: you need one painful workflow and two weeks of measuring it' passes.",
    exemplars: {
      good: [
        "They say: you need clean data before AI is worth it. Truth: you need one ugly workflow and a way to measure it for two weeks.",
        "They say: AI will replace the role. Truth: it removes the 6 hours of that role nobody wanted, and the person finally does the job.",
      ],
      generic: [
        "Myth: AI is scary. Reality: AI is your friend.",
        "Myth: AI is expensive. Reality: AI is cheap.",
      ],
    },
    bodyFields: [FIELD.contrastSaid, FIELD.contrastTrue],
    design: { hook: "carousel_hook", body: "split_contrast", cta: "carousel_cta" },
  },
  {
    slug: "framework_explainer",
    label: "Framework Explainer",
    pillar: "Strategy",
    kind: "carousel",
    purpose: "One named mental model broken into its parts — teaches a repeatable way to think about a problem.",
    slideRange: { min: 5, max: 8, default: 7 },
    bodyMode: "conceptual",
    bodyUnit: { singular: "part", plural: "parts", eyebrowLabel: "the framework" },
    arcGoal: "the parts of one named framework in logical order, each part standing on its own but building the whole",
    grounding: [
      { key: "framework_name", label: "The framework name", placeholder: "e.g. The Boring-Work Audit", required: true },
      { key: "problem_solved", label: "The problem it solves", placeholder: "e.g. teams point AI at the wrong work", required: true },
    ],
    specificityBar:
      "Each part must be a concrete, do-able step with a clear input and output — not a platitude. 'Step 1: Plan. Step 2: Execute' fails. Each part names what the reader actually does and what they end up holding. The framework should feel earned, like you've run it 30 times.",
    exemplars: {
      good: [
        "Part 1 — List the work nobody wants to own. The recurring tasks people quietly dread are where AI pays off first.",
        "Part 2 — Time-box each one. If it eats under 30 min a week, skip it. AI ROI lives in the multi-hour drains.",
      ],
      generic: [
        "Step 1: Understand your business.",
        "Step 2: Apply AI everywhere you can.",
      ],
    },
    bodyFields: [FIELD.stepTitle, FIELD.stepSubtitle, FIELD.stepBody],
    design: { hook: "carousel_hook", body: "numbered_step", cta: "carousel_cta" },
  },
  {
    slug: "stack_breakdown",
    label: "Stack Breakdown",
    pillar: "Build",
    kind: "carousel",
    purpose: "The exact tools for one job — each with what it does, why it, and the cost reality. High save-and-share value.",
    slideRange: { min: 5, max: 9, default: 7 },
    bodyMode: "parallel",
    bodyUnit: { singular: "tool", plural: "tools", eyebrowLabel: "the stack" },
    arcGoal: "the specific tools that do one job, each with its exact role + price reality, ordered by where you'd start",
    grounding: [
      { key: "job", label: "The job to be done", placeholder: "e.g. run inbound lead follow-up for a 10-person team", required: true },
      { key: "tools", label: "Tools you'd actually name (optional)", placeholder: "e.g. Fathom, Clay, Instantly, Claude", required: false },
    ],
    specificityBar:
      "Every tool must be named with the exact thing it does, a real price ballpark, and what it replaces. 'ChatGPT — great for lots of things' fails. 'Fathom — auto-summarizes every Zoom into action items, ~$19/user/mo, replaces the recap nobody wrote' passes. No tool without a concrete job.",
    exemplars: {
      good: [
        "Fathom — records and summarizes every call into action items, ~$19/user/mo, kills the 'wait, what did we agree to' thread.",
        "Clay — enriches inbound leads with firmographics before they hit your CRM, ~$149/mo, so reps stop hand-Googling companies.",
      ],
      generic: [
        "ChatGPT — it can do almost anything.",
        "A good CRM — every business needs one.",
      ],
    },
    bodyFields: [FIELD.stepTitle, FIELD.stepSubtitle, FIELD.stepBody],
    design: { hook: "carousel_hook", body: "numbered_step", cta: "carousel_cta" },
  },
  {
    slug: "hot_take",
    label: "Hot Take / Declaration",
    pillar: "Strategy",
    kind: "single",
    purpose: "One sharp belief, typographic. Stakes a position that makes the right people nod and the wrong people uncomfortable.",
    arcGoal: "a single defensible, specific belief that reframes how the reader sees the topic",
    grounding: [
      { key: "belief", label: "The belief", placeholder: "e.g. most 'AI strategies' are slide decks that change nothing on Monday", required: true },
      { key: "provokes", label: "Who it provokes (optional)", placeholder: "e.g. consultants selling AI strategy decks", required: false },
    ],
    specificityBar:
      "The take must be a specific, falsifiable position — not a platitude. 'AI is the future' fails (nobody disagrees). 'Most AI strategies are a deck that lets everyone feel busy without changing what anyone does Monday' passes. It should cost you a little to say it.",
    exemplars: {
      good: [
        "Most 'AI strategies' are a slide deck that lets everyone feel busy without changing what anyone does on Monday.",
        "If your AI pilot needs a steering committee, it's already dead. The ones that work start with one annoyed person and a Tuesday.",
      ],
      generic: [
        "AI is the future of business.",
        "Companies that don't adopt AI will fall behind.",
      ],
    },
    bodyFields: [],
    singleFields: [FIELD.declHeadline, FIELD.declSubtitle],
    design: { body: "declaration", single: "declaration" },
  },
  {
    slug: "founder_story",
    label: "Founder Story",
    pillar: "Founder",
    kind: "single",
    purpose: "A real moment (Army, operating, a client) that maps cleanly onto a business truth. Earns trust, not applause.",
    arcGoal: "one concrete scene that lands a single business lesson without moralizing",
    grounding: [
      { key: "moment", label: "The moment / scene", placeholder: "e.g. a mission where the plan died on contact but the rehearsal saved it", required: true },
      { key: "lesson", label: "The business lesson it maps to", placeholder: "e.g. AI rollouts survive on rehearsal, not the plan", required: true },
    ],
    specificityBar:
      "Lead with a concrete scene (a place, a moment, a detail), not an abstraction. Let the reader draw the line to business — don't over-explain it. 'My background taught me discipline' fails. 'In the Army the plan never survived first contact; what survived was the rehearsal' passes.",
    exemplars: {
      good: [
        "In the Army the plan never survived first contact. What survived was the rehearsal. Same with every AI rollout I've run.",
        "My first deployment, the gear that mattered wasn't the fancy kit. It was the stuff we'd used so much we didn't think about it.",
      ],
      generic: [
        "My background in the military taught me a lot about business.",
        "Discipline is the key to success in everything.",
      ],
    },
    bodyFields: [],
    singleFields: [FIELD.declHeadline, FIELD.declSubtitle],
    design: { body: "declaration", single: "declaration" },
  },
];

// ── Lookups + helpers ────────────────────────────────────────────────────────

export function getContentType(slug: string): ContentTypeSpec | undefined {
  return CONTENT_TYPES.find((t) => t.slug === slug);
}

export const CAROUSEL_TYPES = CONTENT_TYPES.filter((t) => t.kind === "carousel");
export const SINGLE_TYPES = CONTENT_TYPES.filter((t) => t.kind === "single");

// Clamp a requested slide count into a type's valid range.
export function clampSlideCount(slug: string, requested: number | undefined): number {
  const spec = getContentType(slug);
  const range = spec?.slideRange;
  if (!range) return requested ?? 6;
  if (!requested || isNaN(requested)) return range.default;
  return Math.max(range.min, Math.min(range.max, Math.round(requested)));
}

// Body slides = total minus hook + cta + signoff (3 fixed frames).
export function bodyCountFor(slug: string, slideCount: number): number {
  return Math.max(1, slideCount - 3);
}

// Signoff line per type — rendered on the auto-appended final slide. Low
// pressure, in-voice, never a hard CTA.
export const SIGNOFF_NOTES: Record<string, string> = {
  tactical_playbook: "tell me the role and where the time goes. I'll tell you where I'd start.",
  teardown: "tell me the two systems you're trying to connect. I'll tell you how I'd approach it.",
  diagnostic: "answer one of these honestly in a reply. I'll tell you what I'd do next.",
  myth_vs_reality: "which one did you believe? reply and I'll show you what changed my mind.",
  framework_explainer: "tell me where your team gets stuck and I'll tell you which part to run first.",
  stack_breakdown: "tell me the job and your budget. I'll tell you the leanest stack I'd run.",
  hot_take: "agree, or think I'm wrong? reply and tell me why.",
  founder_story: "if this lands, tell me the moment it reminded you of.",
};

export function signoffNoteFor(slug: string): string {
  return SIGNOFF_NOTES[slug] || "reply and tell me what you're working on. I'll point you at the first step.";
}
