-- Leads from every contact form across every project.
-- First source wired: prometheusconsulting.ai/lets-talk (Fastmail email parser).
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,           -- fastmail message id or form-side request id
  source text not null,              -- 'prometheus-consulting' | 'bashbox' | 'ctax-partner-site' | ...
  source_url text,                   -- /lets-talk, /contact, etc.
  name text,
  email text,
  company text,
  need text,                          -- the dropdown value: 'Custom / not sure yet', 'General inquiry', etc.
  message text,
  raw_subject text,
  raw_body text,
  status text not null default 'new', -- 'new' | 'contacted' | 'qualified' | 'closed' | 'lost'
  received_at timestamptz not null,
  contacted_at timestamptz,
  qualified_at timestamptz,
  closed_at timestamptz,
  notes text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_received_idx on public.leads (received_at desc);
create index leads_source_idx on public.leads (source, received_at desc);
create index leads_status_idx on public.leads (status, received_at desc);
create index leads_email_idx on public.leads (email);

alter table public.leads enable row level security;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();