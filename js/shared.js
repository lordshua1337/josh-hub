// ===== SHARED JS -- josh-hub Command Center =====

// === COMMAND CENTER DATA ENGINE ===
var CC_STATE = {
  xp: 8080, level: 9, title: 'Apprentice',
  total_tasks_completed: 161, skills_created: 68, commits_made: 127,
  plans_executed: 6, deploys: 18,
  skills: [
    { name: 'ab-test-setup', cat: 'CRO' }, { name: 'ai-agent-builder', cat: 'AI' },
    { name: 'ai-tooling-audit', cat: 'AI' }, { name: 'analytics-tracking', cat: 'Analytics' },
    { name: 'attribution-modeling', cat: 'Analytics' }, { name: 'brand-voice-system', cat: 'Marketing' },
    { name: 'call-tracking-setup', cat: 'Analytics' }, { name: 'chat-widget-cro', cat: 'CRO' },
    { name: 'checkout-abandonment-cro', cat: 'CRO' }, { name: 'cohort-analysis', cat: 'Analytics' },
    { name: 'cold-outreach-sequence', cat: 'Outreach' }, { name: 'command-center', cat: 'System' },
    { name: 'community-led-growth', cat: 'Growth' }, { name: 'competitive-positioning-map', cat: 'Strategy' },
    { name: 'competitor-alternatives', cat: 'SEO' }, { name: 'content-strategy', cat: 'Marketing' },
    { name: 'copy-editing', cat: 'Writing' }, { name: 'copywriting', cat: 'Writing' },
    { name: 'crm-workflow-builder', cat: 'Automation' }, { name: 'dashboard-builder', cat: 'UI' },
    { name: 'data-pipeline-setup', cat: 'Data' }, { name: 'email-sequence', cat: 'Marketing' },
    { name: 'face-lift', cat: 'Design' }, { name: 'form-cro', cat: 'CRO' },
    { name: 'free-tool-strategy', cat: 'Growth' }, { name: 'headline-testing', cat: 'CRO' },
    { name: 'heatmap-analysis', cat: 'Analytics' }, { name: 'infinite-improver', cat: 'System' },
    { name: 'influencer-outreach-system', cat: 'Outreach' }, { name: 'intake-form-builder', cat: 'UI' },
    { name: 'launch-strategy', cat: 'Strategy' }, { name: 'lead-nurture-sequence', cat: 'Marketing' },
    { name: 'lead-response-automation', cat: 'Automation' }, { name: 'lead-scoring-model', cat: 'Data' },
    { name: 'marketing-ideas', cat: 'Marketing' }, { name: 'marketing-psychology', cat: 'Marketing' },
    { name: 'messaging-hierarchy', cat: 'Writing' }, { name: 'narrative-framework', cat: 'Writing' },
    { name: 'offer-optimization', cat: 'CRO' }, { name: 'onboarding-cro', cat: 'CRO' },
    { name: 'page-cro', cat: 'CRO' }, { name: 'paid-ads', cat: 'Ads' },
    { name: 'paywall-upgrade-cro', cat: 'CRO' }, { name: 'popup-cro', cat: 'CRO' },
    { name: 'pricing-strategy', cat: 'Strategy' }, { name: 'product-hunt-launch', cat: 'Growth' },
    { name: 'product-marketing-context', cat: 'Marketing' }, { name: 'programmatic-seo', cat: 'SEO' },
    { name: 'quiz-funnel-builder', cat: 'CRO' }, { name: 'referral-program', cat: 'Growth' },
    { name: 'revenue-forecasting', cat: 'Analytics' }, { name: 'schema-markup', cat: 'SEO' },
    { name: 'seo-audit', cat: 'SEO' }, { name: 'signup-flow-cro', cat: 'CRO' },
    { name: 'social-content', cat: 'Marketing' }, { name: 'sync-hub', cat: 'System' },
    { name: 'trust-signal-audit', cat: 'CRO' }, { name: 'viral-loop-design', cat: 'Growth' },
    { name: 'webhook-integrations', cat: 'Data' }, { name: 'xp', cat: 'System' },
    { name: 'zapier-make-architect', cat: 'Automation' }
  ],
  repos: [
    { name: 'ctax-partner-site', url: 'https://github.com/lordshua1337/ctax-partner-site', live: 'https://lordshua1337.github.io/ctax-partner-site/' },
    { name: 'doodleforge', url: 'https://github.com/lordshua1337/doodleforge', live: 'https://doodleforge.vercel.app' },
    { name: 'the-well', url: 'https://github.com/lordshua1337/the-well', live: 'https://the-well-eight.vercel.app' },
    { name: 'uncommon-cents', url: 'https://github.com/lordshua1337/uncommon-cents', live: 'https://uncommon-cents.vercel.app' },
    { name: 'stock-pilot', url: 'https://github.com/lordshua1337/stock-pilot', live: 'https://stock-pilot-puce.vercel.app' },
    { name: 'josh-hub', url: 'https://github.com/lordshua1337/josh-hub', live: 'https://lordshua1337.github.io/josh-hub/' },
{ name: 'ad-intelligence', url: 'https://github.com/lordshua1337/ad-intelligence', live: 'https://lordshua1337.github.io/ad-intelligence/' },
    { name: 'cash-cow', url: 'https://github.com/lordshua1337/cash-cow', live: 'https://lordshua1337.github.io/cash-cow/' },
    { name: 'pipeline-simulator', url: 'https://github.com/lordshua1337/pipeline-simulator', live: 'https://lordshua1337.github.io/pipeline-simulator/' },
    { name: 'image-forge', url: 'https://github.com/lordshua1337/image-forge', live: 'https://lordshua1337.github.io/image-forge/' },
    { name: 'cashcow-v3', url: 'https://github.com/lordshua1337/cashcow-v3', live: null },
    { name: 'occulus', url: 'https://github.com/lordshua1337/occulus', live: null },
    { name: 'ctax-v3', url: 'https://github.com/lordshua1337/ctax-v3', live: null }
  ],
  // Planned projects -- BUILD QUEUE (order = priority, top = next)
  planned_projects: [],
  // Future projects (ideas, not yet specced)
  future_projects: [
    {
      name: 'headless-cms',
      title: 'Headless CMS',
      desc: 'Custom headless content management system -- API-first, multi-tenant, structured content types, media pipeline, webhook-driven publishing.',
      stack: ['Next.js', 'Supabase', 'TypeScript'],
      phases: 0,
      status: 'future',
      gradient: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
      icon: 'database'
    }
  ],
  // Infrastructure (standalone packages/functions -- populated when built)
  infrastructure: [
    {
      name: 'auth-billing-kit',
      title: 'Auth + Billing Kit',
      desc: 'Supabase Auth + Stripe subscriptions + tier gating + usage tracking. Drop into any Next.js SaaS in 30 minutes.',
      stack: ['Next.js', 'Supabase Auth', 'Stripe', 'TypeScript'],
      status: 'built',
      gradient: 'linear-gradient(90deg, #635BFF, #0A2540)',
      icon: 'credit-card',
      consumers: ['cash-cow', 'occulus', 'doodleforge', 'ctax-v3', 'pipeline-simulator']
    },
    {
      name: 'event-bus',
      title: 'Webhook Event Bus',
      desc: 'Central pub/sub router for inter-app communication. Fan-out delivery, 3x retries, dead letter queue, typed SDK, monitoring dashboard.',
      stack: ['Next.js', 'Supabase', 'Inngest', 'TypeScript'],
      status: 'built',
      gradient: 'linear-gradient(90deg, #06b6d4, #0ea5e9)',
      icon: 'plug',
      consumers: ['cash-cow', 'ad-intelligence', 'pipeline-simulator', 'image-forge', 'occulus']
    }
  ],
  // Connected integrations
  integrations: [
    { id: 'claude-code', name: 'Claude Code', icon: 'terminal', desc: 'AI coding assistant powering all builds', color: '#D97706' },
    { id: 'github', name: 'GitHub', icon: 'github', desc: '11 repos, auto-push on deploy', color: '#1A1612' },
    { id: 'vercel', name: 'Vercel', icon: 'cloud', desc: '4 apps deployed (DoodleForge, The Well, Uncommon Cents, StockPilot)', color: '#000' },
    { id: 'github-pages', name: 'GitHub Pages', icon: 'globe', desc: 'CTAX Partner Site + josh-hub + Pick & Shovel Suite (5 apps)', color: '#2563EB' },
    { id: 'anthropic', name: 'Anthropic API', icon: 'brain', desc: 'Claude AI powers The Well, Uncommon Cents, StockPilot chat', color: '#CC785C' },
    { id: 'stripe', name: 'Stripe', icon: 'credit-card', desc: 'DoodleForge payment processing', color: '#635BFF' },
    { id: 'mcp-servers', name: 'MCP Servers', icon: 'plug', desc: 'Context7 docs, image generation, Canva', color: '#9333EA' },
    { id: 'nightcrawler', name: 'Nightcrawler', icon: 'moon', desc: 'Autonomous build mode -- ships features while you sleep', color: '#1E293B' }
  ],
  xp_log: [
    { date: '2026-03-03', event: 'Omni Focus sweep -- 12-repo Code Foundation + Security audit', xp: 30, type: 'audit' },
    { date: '2026-03-03', event: 'fix: stock-pilot ticker validation on /api/market', xp: 20, type: 'bugfix' },
    { date: '2026-03-03', event: 'fix: doodleforge /api/generate MIME + size validation', xp: 20, type: 'bugfix' },
    { date: '2026-03-03', event: 'fix: ctax-partner-site copyAllScripts + avatar XSS + ad-maker MIME', xp: 20, type: 'bugfix' },
    { date: '2026-03-03', event: 'CTAX AI Tools Upgrade -- ICP context bridge, Save to Portal, Script Builder/Client Qualifier/Knowledge Base ICP injection, badge system', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: CTAX AI Tools Upgrade -- ICP-driven tool overhaul build #13', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Partner Portal Templates -- 6 landing page templates, template catalog, design specs, Supabase auth', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: Partner Portal Templates -- build #12', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Marcom Engine V3 -- mission control, connection health, 7 integrations, engine locking, Inngest, approval queue', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: Marcom Engine V3 -- marketing OS build #11', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Image Forge V3 -- Supabase auth, design sync, brand kits, asset library, analytics', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: Image Forge V3 -- backend build #10', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Ad Intelligence V3 -- Supabase auth, competitor sync, briefs, alerts, analytics', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: Ad Intelligence V3 -- backend build #9', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Pipeline Simulator V3 -- Supabase auth, cloud sync, simulation persistence, analytics', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: Pipeline Simulator V3 -- backend build #8', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Uncommon Cents V3 -- Supabase auth, sync, saved calculations, analytics, dashboard', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: Uncommon Cents V3 -- backend build #7', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'The Well V3 -- Supabase auth, cloud sync, community reflections, analytics, dashboard', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: The Well V3 -- backend build #6', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'DoodleForge V3 -- Supabase auth, credit system, Daily Guess game, share galleries, Doodie redesign', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: DoodleForge V3 -- Doodie redesign build #5', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'StockPilot V3 -- Supabase auth, Alpha Vantage market data, Claude AI thesis, Flight Plan, portfolio intelligence', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: StockPilot V3 -- greenfield backend build #4', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Occulus V3 -- CRM pipeline, scenario lab, stress test, rebalancer, AI reports, compliance logs', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: Occulus V3 -- greenfield SaaS build #3', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Cash Cow V3 -- AI product discovery, Supabase auth, Claude research/ideation/briefs, cow branding', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: Cash Cow V3 -- greenfield SaaS build #1', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Event Bus -- pub/sub router, Inngest delivery, dashboard, typed SDK', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: Event Bus -- infrastructure package #2', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Auth + Billing Kit -- Supabase Auth, Stripe subs, tier gating, usage tracking, billing UI', xp: 85, type: 'feature' },
    { date: '2026-03-03', event: 'project: Auth + Billing Kit -- infrastructure package #1', xp: 35, type: 'project' },
    { date: '2026-03-03', event: 'Deployed Image Forge to GitHub Pages (Pick & Shovel #5)', xp: 40, type: 'deployment' },
    { date: '2026-03-03', event: 'Image Forge v1 -- canvas editor, 13 templates, brand kit, platform resize', xp: 35, type: 'feature' },
    { date: '2026-03-03', event: 'project: Image Forge -- Pick & Shovel Suite #5', xp: 50, type: 'project' },
    { date: '2026-03-03', event: 'Deployed Pipeline Simulator to GitHub Pages (Pick & Shovel #4)', xp: 40, type: 'deployment' },
    { date: '2026-03-03', event: 'Pipeline Simulator v1 -- Kanban + Monte Carlo revenue simulation', xp: 35, type: 'feature' },
    { date: '2026-03-03', event: 'project: Pipeline Simulator -- Pick & Shovel Suite #4', xp: 50, type: 'project' },
    { date: '2026-03-03', event: 'Deployed Cash Cow to GitHub Pages (Pick & Shovel #3)', xp: 40, type: 'deployment' },
    { date: '2026-03-03', event: 'Cash Cow v1 -- AI product idea generator, 15 niches, validation scoring', xp: 35, type: 'feature' },
    { date: '2026-03-03', event: 'project: Cash Cow -- Pick & Shovel Suite #3', xp: 50, type: 'project' },
    { date: '2026-03-03', event: 'Plan: CTAX AI Tools Upgrade -- 6-phase ICP-driven overhaul, full audit + spec', xp: 15, type: 'plan' },
    { date: '2026-03-02', event: 'HoldingInsightCard 4-layer component + benchmark tape', xp: 35, type: 'feature' },
    { date: '2026-03-02', event: 'Populated S&P/CFRA, StarMine, Congressional, Options blocks', xp: 35, type: 'feature' },
    { date: '2026-03-02', event: 'Spacing fix below insight card', xp: 20, type: 'bugfix' },
    { date: '2026-03-02', event: 'Deployed StockPilot (insight cards + benchmark tape)', xp: 40, type: 'deployment' },
    { date: '2026-03-02', event: 'Installed /face-lift skill', xp: 15, type: 'skill_created' },
    { date: '2026-03-02', event: 'Plan: The Well Phase 7 -- Scripture Misuse', xp: 15, type: 'plan' },
    { date: '2026-03-02', event: 'Plan: Uncommon Cents Phase 7 -- Expansion Pack', xp: 15, type: 'plan' },
    { date: '2026-03-02', event: 'Deployed StockPilot (85 stocks + benchmarks)', xp: 40, type: 'deployment' },
    { date: '2026-03-02', event: 'StockPilot expansion -- 42 new stocks, 12 benchmarks', xp: 35, type: 'feature' },
    { date: '2026-03-02', event: 'Subagent system -- 4 agents + routing rules', xp: 25, type: 'config' },
    { date: '2026-03-02', event: 'Plan: StockPilot Phase 6 roadmap', xp: 15, type: 'plan' },
    { date: '2026-03-02', event: 'UI/UX Pro Max search engine refactor', xp: 25, type: 'refactor' },
    { date: '2026-03-02', event: 'UI/UX Pro Max Tier 3+4 (7 CSVs)', xp: 35, type: 'feature' },
    { date: '2026-03-02', event: 'UI/UX Pro Max Tier 2 adaptive style engine', xp: 35, type: 'feature' },
    { date: '2026-03-02', event: 'UI/UX Pro Max Tier 1 core expansion (10 CSVs)', xp: 35, type: 'feature' },
    { date: '2026-03-02', event: 'Skill library setup -- 6 SKILL.md files', xp: 25, type: 'config' },
    { date: '2026-03-02', event: 'Partner Portal super-skill', xp: 15, type: 'skill_created' },
    { date: '2026-03-02', event: 'Compliance Wrapper super-skill', xp: 15, type: 'skill_created' },
    { date: '2026-03-02', event: 'RAG Pipeline super-skill', xp: 15, type: 'skill_created' },
    { date: '2026-03-02', event: '/sync-hub skill + auto-sync system', xp: 50, type: 'feature' },
    { date: '2026-03-02', event: 'Database Schema super-skill', xp: 15, type: 'skill_created' },
    { date: '2026-03-02', event: 'AI Tool Pipeline super-skill', xp: 15, type: 'skill_created' },
    { date: '2026-03-02', event: 'Uncommon Cents content expansion -- 67 new concepts', xp: 35, type: 'feature' },
    { date: '2026-03-02', event: 'Nightcrawler Max R4-6 -- 11 feat commits', xp: 385, type: 'feature' },
    { date: '2026-03-01', event: 'StockPilot v2 -- detail pages + 20 stocks', xp: 70, type: 'feature' },
    { date: '2026-03-01', event: 'The Well v2 -- word corrections + cards', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Uncommon Cents v2 -- calculators + concepts', xp: 105, type: 'feature' },
    { date: '2026-03-01', event: 'imagegen-mcp project setup', xp: 50, type: 'project' },
    { date: '2026-03-01', event: 'HeroSection React component', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Boho wave dividers + palette system', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Hero-section-system playbook', xp: 25, type: 'playbook_created' },
    { date: '2026-03-01', event: 'Page builder premium rebuild', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Client-facing copy rewrite', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'ICP Builder PDF footer', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'ICP Builder fixes (4 bugs)', xp: 80, type: 'bugfix' },
    { date: '2026-03-01', event: 'ICP Builder loader animation', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'ICP Builder PDF pagination rewrite', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'DoodleForge neumorphic polish', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'DoodleForge dark premium redesign', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Twinkling stars + shooting stars (CTAX)', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'AI scroll copy rewrite (CTAX)', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'DoodleForge build spec + EPIC mode', xp: 15, type: 'docs' },
    { date: '2026-03-01', event: 'The Well content expansion (9 words + 15 cards)', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Deployed The Well to Vercel', xp: 40, type: 'deployment' },
    { date: '2026-03-01', event: '3D holo cards + contrast overhaul (CTAX)', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Portfolio link + copy URL', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Public project showcase page', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Immersive snap-scroll experience', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'DoodleForge pastel redesign + Wall of Shame', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'CSS scroll-snap sections', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Deployed DoodleForge to Vercel', xp: 40, type: 'deployment' },
    { date: '2026-03-01', event: 'Deployed 4 apps to Vercel', xp: 160, type: 'deployment' },
    { date: '2026-03-01', event: 'SVG pixel space invader', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Created ai-tooling-audit skill', xp: 15, type: 'skill_created' },
    { date: '2026-03-01', event: 'Installed infinite-improver skill', xp: 15, type: 'skill_created' },
    { date: '2026-03-01', event: 'Cinematic scroll rewrite + dropdowns', xp: 35, type: 'feature' },
    { date: '2026-03-01', event: 'Created 55 growth/marketing skills', xp: 825, type: 'skills_batch' },
    { date: '2026-03-01', event: 'Plan: ICP cinematic scroll', xp: 15, type: 'plan' },
    { date: '2026-02-28', event: 'Portal dashboard with KPIs', xp: 35, type: 'feature' },
    { date: '2026-02-28', event: 'Pro subscription gating + paywall', xp: 35, type: 'feature' },
    { date: '2026-02-28', event: 'ICP Builder immersive scroll', xp: 35, type: 'feature' },
    { date: '2026-02-28', event: 'Plan: ICP builder scroll', xp: 15, type: 'plan' },
    { date: '2026-02-27', event: 'Page builder publish flow', xp: 35, type: 'feature' },
    { date: '2026-02-27', event: 'Dark mode support', xp: 35, type: 'feature' },
    { date: '2026-02-27', event: 'Redesign 30-day challenge UX', xp: 35, type: 'feature' },
    { date: '2026-02-27', event: 'Lightbulb widget fix', xp: 20, type: 'bugfix' },
    { date: '2026-02-26', event: 'AEO pages implementation', xp: 35, type: 'feature' },
    { date: '2026-02-26', event: 'Rebuild business planner PDF', xp: 35, type: 'feature' },
    { date: '2026-02-26', event: 'Project setup: ctax-partner-site', xp: 50, type: 'project' },
    { date: '2026-02-26', event: 'Context optimization & plugin cleanup', xp: 25, type: 'config' }
  ]
};

// === PROGRESSIVE SPRITE SYSTEM ===
var CHAR_SPRITES = [
  { min: 1, w: 5, h: 4, rows: ['.XXX.','XX.XX','XXXXX','.X.X.'] },
  { min: 3, w: 7, h: 6, rows: ['..X.X..', '.XXXXX.', 'XX.X.XX', 'XXXXXXX', '.X.X.X.', 'X.....X'] },
  { min: 5, w: 9, h: 7, rows: ['...X.X...','..XXXXX..', '.XX.X.XX.', 'XXXXXXXXX', 'X.XXXXX.X', '.X.....X.', 'X.X...X.X'] },
  { min: 7, w: 11, h: 8, rows: ['..X.....X..','...X...X...','..XXXXXXX..', '.XX.XXX.XX.','XXXXXXXXXXX','X.XXXXXXX.X','X.X.....X.X','..XX...XX..'] },
  { min: 10, w: 13, h: 9, rows: ['X...........X','.X.........X.','..XXXXXXXXX..','.XX..XXX..XX.','XXXXXXXXXXXXX','X..XXXXXXX..X','X.XX.....XX.X','..X.X...X.X..','.X.........X.'] },
  { min: 15, w: 15, h: 10, rows: ['X.............X','.X...........X.','..XXXXXXXXXXX..','.XXX..XXX..XXX.','XXXXXXXXXXXXXXX','XX.XXXXXXXXX.XX','X.XX.......XX.X','..X.XX...XX.X..','.X...........X.','X.X.........X.X'] },
  { min: 20, w: 17, h: 11, rows: ['X...............X','.X.............X.','..X...........X..','...XXXXXXXXXXX...','..XXX..XXX..XXX..', '.XXXXXXXXXXXXXXX.','XXXXXXXXXXXXXXXXX','XX.XXXXXXXXXXX.XX','X.XXX.......XXX.X','..X..XX...XX..X..','X.X...........X.X'] },
  { min: 30, w: 19, h: 12, rows: ['X.................X','.X...............X.','..X.............X..','...X...........X...','....XXXXXXXXXXX....','...XXX..XXX..XXX...','..XXXXXXXXXXXXXXX..','.XXXXXXXXXXXXXXXXX.','XXXXXXXXXXXXXXXXXXX','XXX.XXXXXXXXXXX.XXX','X.XXXX.......XXXX.X','..XX..XX...XX..XX..'] },
  { min: 50, w: 21, h: 13, rows: ['X...................X','.X.................X.','..X...............X..','...X.............X...','....XXXXXXXXXXXXX....','...XXXX..XXX..XXXX...','..XXXXXXXXXXXXXXXXX..','.XXXXXXXXXXXXXXXXXXX.','XXXXXXXXXXXXXXXXXXXXX','XX..XXXXXXXXXXXXX..XX','X.XXXXX.......XXXXX.X','..XX..XXX...XXX..XX..','X..X.............X..X'] },
  { min: 75, w: 23, h: 15, rows: ['X.....................X','.X...................X.','..X.................X..','...X...............X...','....X.............X....','.....XXXXXXXXXXXXX.....','....XXXXX..X..XXXXX....','...XXXXXXXXXXXXXXXXX...','..XXXXXXXXXXXXXXXXXXX..','.XXXXXXXXXXXXXXXXXXXXX.','XXXXXXXXXXXXXXXXXXXXXXX','XXX..XXXXXXXXXXXXX..XXX','X.XXXXXX.......XXXXXX.X','..XXX..XXX...XXX..XXX..','X...X.............X...X'] }
];

function renderSprite(level) {
  var sprite = CHAR_SPRITES[0];
  for (var i = CHAR_SPRITES.length - 1; i >= 0; i--) {
    if (level >= CHAR_SPRITES[i].min) {
      sprite = CHAR_SPRITES[i];
      break;
    }
  }
  var svg = '<svg viewBox="0 0 ' + sprite.w + ' ' + sprite.h + '" fill="var(--accent)" shape-rendering="crispEdges">';
  for (var y = 0; y < sprite.rows.length; y++) {
    var row = sprite.rows[y];
    var x = 0;
    while (x < row.length) {
      if (row[x] === 'X') {
        var runLen = 1;
        while (x + runLen < row.length && row[x + runLen] === 'X') runLen++;
        svg += '<rect x="' + x + '" y="' + y + '" width="' + runLen + '" height="1"/>';
        x += runLen;
      } else {
        x++;
      }
    }
  }
  svg += '</svg>';
  return svg;
}

// === SVG ICON HELPER ===
var ICONS = {
  terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 3 1.5 5 3 6.5V22h8v-6.5c1.5-1.5 3-3.5 3-6.5a7 7 0 0 0-7-7z"/><line x1="9" y1="22" x2="15" y2="22"/></svg>',
  'credit-card': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
};

function getIcon(name) {
  return ICONS[name] || ICONS.globe;
}

// === DARK MODE ===
function initTheme() {
  var saved = localStorage.getItem('jh-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateThemeIcon();
}

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme');
  if (current === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('jh-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('jh-theme', 'dark');
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
}

// === LOCK SCREEN ===
function initLock() {
  var lock = document.getElementById('lock');
  var dash = document.getElementById('dash');
  if (!lock || !dash) return;

  if (sessionStorage.getItem('hub_unlocked')) {
    lock.style.display = 'none';
    dash.style.display = 'block';
    dash.classList.add('revealed');
    return;
  }

  var code = [1, 3, 3, 7];
  var progress = 0;
  var pieces = document.querySelectorAll('.piece');
  var dots = document.querySelectorAll('.ldot');
  var inner = document.querySelector('.lock-inner');
  var ring = document.querySelector('.lock-ring');
  var locked = true;

  document.addEventListener('keydown', function(e) {
    if (!locked) return;
    var num = parseInt(e.key);
    if (isNaN(num)) return;
    if (num === code[progress]) {
      pieces[progress].classList.add('in');
      dots[progress].classList.add('filled');
      progress++;
      if (progress === 4) {
        locked = false;
        setTimeout(function() { pieces.forEach(function(p) { p.classList.add('merge'); }); }, 350);
        setTimeout(function() { ring.classList.add('spin'); }, 600);
        setTimeout(function() { ring.classList.add('glow'); }, 800);
        setTimeout(function() { lock.classList.add('unlocked'); }, 1200);
        setTimeout(function() {
          lock.style.display = 'none';
          dash.style.display = 'block';
          dash.offsetHeight;
          dash.classList.add('revealed');
          sessionStorage.setItem('hub_unlocked', '1');
        }, 1800);
      }
    } else {
      inner.classList.add('shake');
      setTimeout(function() { inner.classList.remove('shake'); }, 500);
      pieces.forEach(function(p) { p.classList.remove('in'); });
      dots.forEach(function(d) { d.classList.remove('filled'); });
      progress = 0;
    }
  });
}

// === COPY UTILITY ===
function copyText(text) {
  navigator.clipboard.writeText(text).then(function() {
    showToast('Copied: ' + text);
  }).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied: ' + text);
  });
}

function showToast(msg) {
  var toast = document.getElementById('copy-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

// === FACE-LIFT: INTERACTIVE LAYERS ===
function initFaceLift() {
  // Scroll-triggered reveals
  var reveals = document.querySelectorAll('.fl-reveal');
  if (reveals.length) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('fl-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function(el, i) {
      el.style.transitionDelay = (i * 0.08) + 's';
      observer.observe(el);
    });
  }

  // Number counting animation
  var statNums = document.querySelectorAll('.stat-num');
  var counted = false;
  if (statNums.length) {
    var countObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !counted) {
          counted = true;
          statNums.forEach(function(el) {
            var raw = el.textContent.replace(/,/g, '');
            var target = parseInt(raw, 10);
            if (isNaN(target)) return;
            var duration = 1200;
            var start = performance.now();
            var comma = el.textContent.indexOf(',') !== -1;
            function step(now) {
              var elapsed = now - start;
              var progress = Math.min(elapsed / duration, 1);
              var eased = 1 - Math.pow(1 - progress, 3);
              var current = Math.round(eased * target);
              el.textContent = comma ? current.toLocaleString() : current;
              if (progress < 1) requestAnimationFrame(step);
            }
            el.textContent = '0';
            requestAnimationFrame(step);
          });
          countObserver.disconnect();
        }
      });
    }, { threshold: 0.3 });
    var statsBar = document.querySelector('.stats-bar');
    if (statsBar) countObserver.observe(statsBar);
  }

  // XP bar entrance
  var fill = document.querySelector('.xp-bar-fill');
  if (fill) {
    var targetWidth = fill.style.width;
    fill.classList.add('fl-bar-waiting');
    var barObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          setTimeout(function() {
            fill.classList.remove('fl-bar-waiting');
            fill.style.width = targetWidth;
          }, 300);
          barObserver.disconnect();
        }
      });
    }, { threshold: 0.3 });
    var hero = fill.closest('.xp-hero');
    if (hero) barObserver.observe(hero);
  }

  // Button ripple
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.act-btn, .quick-card');
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
    var ripple = document.createElement('span');
    ripple.className = 'fl-ripple';
    var size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(function() { ripple.remove(); }, 500);
  });

  // Scroll-aware navbar
  var nav = document.querySelector('.nav');
  if (nav) {
    var scrolled = false;
    function check() {
      var y = window.scrollY || window.pageYOffset;
      if (y > 20 && !scrolled) { nav.classList.add('fl-scrolled'); scrolled = true; }
      else if (y <= 20 && scrolled) { nav.classList.remove('fl-scrolled'); scrolled = false; }
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  }
}

// === HELPERS ===
function tagClass(type) {
  var map = { feature: 'feat', bugfix: 'fix', deployment: 'deploy', skill_created: 'skill', skills_batch: 'skill', plan: 'plan', config: 'config', refactor: 'refactor', project: 'project' };
  return map[type] || 'feat';
}

function trendClass(type) {
  var map = { feature: 'feat', bugfix: 'fix', deployment: 'deploy', skill_created: 'skill', skills_batch: 'skill', plan: 'plan', config: 'config', refactor: 'refactor', project: 'project', docs: 'docs', playbook_created: 'playbook' };
  return map[type] || 'feat';
}

function detectProject(event) {
  var e = event.toLowerCase();
  if (e.indexOf('stockpilot') > -1 || e.indexOf('stock-pilot') > -1 || e.indexOf('stock pilot') > -1) return 'StockPilot';
  if (e.indexOf('uncommon cents') > -1 || e.indexOf('uncommon-cents') > -1) return 'Uncommon Cents';
  if (e.indexOf('the well') > -1 || e.indexOf('the-well') > -1 || e.indexOf('well v2') > -1 || e.indexOf('scripture') > -1 || e.indexOf('word correction') > -1) return 'The Well';
  if (e.indexOf('doodleforge') > -1 || e.indexOf('doodle') > -1) return 'DoodleForge';
  if (e.indexOf('ctax') > -1 || e.indexOf('partner') > -1 || e.indexOf('icp') > -1 || e.indexOf('30-day') > -1) return 'CTAX Partner Site';
  if (e.indexOf('ui/ux') > -1 || e.indexOf('pro max') > -1) return 'UI/UX Pro Max';
  if (e.indexOf('skill') > -1 || e.indexOf('command') > -1 || e.indexOf('sync-hub') > -1) return 'Skills/Tooling';
  if (e.indexOf('nightcrawler') > -1) return 'Nightcrawler';
  if (e.indexOf('trend sniper') > -1 || e.indexOf('trend-sniper') > -1 || e.indexOf('cash cow') > -1 || e.indexOf('cash-cow') > -1) return 'Cash Cow';
  if (e.indexOf('ad intelligence') > -1 || e.indexOf('ad-intelligence') > -1) return 'Ad Intelligence';
  if (e.indexOf('pipeline simulator') > -1 || e.indexOf('pipeline-simulator') > -1) return 'Pipeline Simulator';
  if (e.indexOf('image forge') > -1 || e.indexOf('image-forge') > -1) return 'Image Forge';
  if (e.indexOf('pick & shovel') > -1 || e.indexOf('pick and shovel') > -1) return 'Pick & Shovel Suite';
  if (e.indexOf('hero') > -1 || e.indexOf('boho') > -1 || e.indexOf('imagegen') > -1) return 'Image Gen';
  if (e.indexOf('subagent') > -1 || e.indexOf('claude') > -1 || e.indexOf('context') > -1) return 'Claude Config';
  return 'Other';
}

// === INIT ===
initTheme();
