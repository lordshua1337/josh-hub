-- Seed: integrations table from CC_STATE.integrations
insert into public.integrations (id, name, icon, color, description, status) values
  ('claude-code',  'Claude Code',   'terminal',    '#D97706', 'AI coding assistant powering all builds',                       'connected'),
  ('github',       'GitHub',        'github',      '#1A1612', '20 repos, auto-push on deploy',                                 'connected'),
  ('vercel',       'Vercel',        'cloud',       '#000000', '11 apps deployed -- all V3 projects on serverless',             'connected'),
  ('github-pages', 'GitHub Pages',  'globe',       '#2563EB', 'CTAX Partner Site + josh-hub + V2 archives',                    'connected'),
  ('anthropic',    'Anthropic API', 'brain',       '#CC785C', 'Claude AI powers The Well, Uncommon Cents, StockPilot chat',    'connected'),
  ('stripe',       'Stripe',        'credit-card', '#635BFF', 'DoodleForge payment processing',                                'connected'),
  ('mcp-servers',  'MCP Servers',   'plug',        '#9333EA', 'Context7 docs, image generation, Canva, GitHub, Supabase',      'connected'),
  ('nightcrawler', 'Nightcrawler',  'moon',        '#1E293B', 'Autonomous build mode -- ships features while you sleep',       'connected'),
  ('supabase',     'Supabase',      'database',    '#3ECF8E', 'Postgres + RLS + auth + realtime. josh-hub command center DB.', 'connected');
