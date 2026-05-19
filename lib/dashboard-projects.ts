// Hardcoded showcase entries for the dashboard "Projects" section.
// These supplement CC_STATE.repos with display-only fields (gradients, taglines,
// "Run Dev" commands). Will be replaced by Supabase-backed entries in P6.

export type DashboardProject = {
  title: string;
  desc: string;
  badge: "Active" | "Built";
  gradient: string;
  meta: { dot: "active" | "warning" | "muted"; label: string }[];
  live?: string;
  github?: string;
  liveLabel?: string;
  pathCopy?: string;
  devCmd?: string;
  aeoLinks?: { label: string; href: string }[];
};

export const DASHBOARD_PROJECTS: DashboardProject[] = [
  {
    title: "Community Tax Partner Site",
    desc: "Enterprise partner program SPA -- referral portal, dashboard, AI tools, gamification, CE training, and marketing kit.",
    badge: "Active",
    gradient: "linear-gradient(90deg, #D97706, #F59E0B)",
    meta: [
      { dot: "active", label: "24 JS modules" },
      { dot: "muted", label: "6 CSS files" },
      { dot: "warning", label: "SPA" },
    ],
    live: "https://ctax-partner-site.vercel.app",
    github: "https://github.com/lordshua1337/ctax-partner-site",
    pathCopy: "~/projects/ctax-partner-site",
  },
  {
    title: "DoodleForge",
    desc: "AI-powered kids' drawing transformer. Forge color palette, gallery lightbox, vault system, 12 art styles, face-lift polish, scroll-reveal animations, Daily Guess game.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #FF3B30, #FF6B5B)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "Stripe + Replicate" },
      { dot: "active", label: "V3 Backend" },
    ],
    live: "https://doodleforge.vercel.app",
    github: "https://github.com/lordshua1337/doodleforge",
    devCmd: "cd ~/projects/doodleforge && npm run dev",
  },
  {
    title: "The Well",
    desc: "Spiritual teaching app. 60+ concepts, 49 passage dossiers, 9 word corrections, bookmarking, full-text search, reading progress, Path/Practices/Human Jesus/Living Words/Restoration modules.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #2D6A4F, #40916C)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "Claude API" },
      { dot: "active", label: "V3 Backend" },
    ],
    live: "https://the-well-eight.vercel.app",
    github: "https://github.com/lordshua1337/the-well",
    devCmd: "cd ~/projects/the-well && npm run dev -- -p 3002",
  },
  {
    title: "Uncommon Cents",
    desc: "Financial education app. 14 domains, 132 concepts, money script quiz, 12 wealth strategies, 10 fraud defenses, operating loop, expansion pack, AI chat advisor.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #16A34A, #22C55E)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "132 Concepts" },
      { dot: "active", label: "V3 Backend" },
    ],
    live: "https://uncommon-cents.vercel.app",
    github: "https://github.com/lordshua1337/uncommon-cents",
    devCmd: "cd ~/projects/uncommon-cents && npm run dev -- -p 3003",
  },
  {
    title: "StockPilot",
    desc: "AI stock research + portfolio builder. 85 stocks, Financial DNA assessment, market simulator, earnings calendar, investment pipeline, archetype coaching, AI signals, advisor sharing.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #00C853, #69F0AE)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "85 stocks + AI signals" },
      { dot: "active", label: "V3 Backend" },
    ],
    live: "https://stock-pilot-puce.vercel.app",
    github: "https://github.com/lordshua1337/stock-pilot",
    devCmd: "cd ~/projects/stock-pilot && npm run dev -- -p 3004",
  },
  {
    title: "Ad Intelligence",
    desc: "Competitive ad spy tool. Real Meta/Google/SEMrush links, company search, competitor tracking, weekly briefs. Pick & Shovel Suite #2.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #fb923c, #ea580c)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "Real intel links" },
      { dot: "warning", label: "P&S #2" },
    ],
    live: "https://ad-intelligence-one.vercel.app",
    github: "https://github.com/lordshua1337/ad-intelligence",
  },
  {
    title: "Cash Cow",
    desc: "AI product idea generator. 15 niches, revenue estimates, validation scoring, build spec generator. Cow-themed. Pick & Shovel Suite #3.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #a3e635, #65a30d)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "15 niches" },
      { dot: "warning", label: "P&S #3" },
    ],
    live: "https://cash-cow.vercel.app",
    github: "https://github.com/lordshua1337/cash-cow",
  },
  {
    title: "Pipeline Simulator",
    desc: "Kanban pipeline with Monte Carlo revenue simulation. Drag-and-drop stages, probability modeling, revenue projections. Pick & Shovel Suite #4.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #d946ef, #a21caf)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "dnd-kit + Monte Carlo" },
      { dot: "warning", label: "P&S #4" },
    ],
    live: "https://pipeline-simulator-woad.vercel.app",
    github: "https://github.com/lordshua1337/pipeline-simulator",
  },
  {
    title: "Image Forge",
    desc: "Canvas-based image editor. 13 templates, brand kit, layer system, platform resize to 12 formats, PNG/JPG/WebP export. Pick & Shovel Suite #5.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #f59e0b, #d97706)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "Canvas API" },
      { dot: "warning", label: "P&S #5" },
    ],
    live: "https://image-forge-mauve.vercel.app",
    github: "https://github.com/lordshua1337/image-forge",
  },
  {
    title: "Trend Sniper",
    desc: "Bloomberg-style trend dashboard. 45 mock trends, heatmap/timeline/comparison/goldmine views, watchlists, alerts, webhook stubs. Pick & Shovel Suite #1.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #1e293b, #334155)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "Dark Bloomberg theme" },
      { dot: "warning", label: "P&S #1" },
    ],
    live: "https://lordshua1337.github.io/trend-sniper/",
    github: "https://github.com/lordshua1337/trend-sniper",
  },
  {
    title: "Oculus",
    desc: "Wealth management CRM platform. Client pipeline, scenario lab, stress testing, portfolio rebalancer, AI-generated reports, compliance audit logs.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #7c3aed, #a78bfa)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "Supabase + Claude" },
      { dot: "active", label: "V3 Backend" },
    ],
    live: "https://occulus.vercel.app",
    github: "https://github.com/lordshua1337/oculus",
  },
  {
    title: "Cash Cow V3",
    desc: "AI product discovery engine V3. Supabase auth, Claude-powered research/ideation/briefs, cow branding, full-stack upgrade.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #65a30d, #a3e635)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "Supabase + Claude" },
    ],
    live: "https://lordshua1337.github.io/cashcow-v3/",
    github: "https://github.com/lordshua1337/cashcow-v3",
  },
  {
    title: "CTAX V3 Replatform",
    desc: "Full-stack partner portal replatform. Next.js + Supabase, 21 routes, 10 API handlers, Kanban admin, auth, RLS schema.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #0B5FD8, #3B82F6)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "Supabase + RLS" },
    ],
    live: "https://lordshua1337.github.io/ctax-v3/",
    github: "https://github.com/lordshua1337/ctax-v3",
  },
  {
    title: "Marcom Engine V3",
    desc: "Marketing OS. Mission control dashboard, connection health checker, 7 integrations, engine locking, approval queue, Inngest scheduling.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #ec4899, #f472b6)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "Supabase + Inngest" },
    ],
    live: "https://marcom-engine.vercel.app",
    github: "https://github.com/lordshua1337/marcom-engine",
  },
  {
    title: "Partner Portal Templates",
    desc: "6 landing page templates with full design specs, template catalog, Supabase auth integration.",
    badge: "Built",
    gradient: "linear-gradient(90deg, #0ea5e9, #38bdf8)",
    meta: [
      { dot: "active", label: "Next.js + TS" },
      { dot: "active", label: "Supabase" },
    ],
    live: "https://partner-portal-templates-lordshua1337-lordshua1337s-projects.vercel.app",
    github: "https://github.com/lordshua1337/partner-portal-templates",
  },
  {
    title: "AEO Content Pages",
    desc: "Answer Engine Optimization pages -- structured data, FAQ schemas, glossary, statistics, how-to guides.",
    badge: "Active",
    gradient: "linear-gradient(90deg, #F59E0B, #FCD34D)",
    meta: [
      { dot: "active", label: "4 pages live" },
      { dot: "muted", label: "Self-contained HTML" },
    ],
    aeoLinks: [
      { label: "FAQ", href: "https://lordshua1337.github.io/ctax-partner-site/aeo/faq-expanded.html" },
      { label: "Glossary", href: "https://lordshua1337.github.io/ctax-partner-site/aeo/glossary.html" },
      { label: "Statistics", href: "https://lordshua1337.github.io/ctax-partner-site/aeo/statistics.html" },
      { label: "How-To", href: "https://lordshua1337.github.io/ctax-partner-site/aeo/howto-referral.html" },
    ],
  },
];
