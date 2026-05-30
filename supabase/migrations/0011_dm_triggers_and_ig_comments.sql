-- Keyword -> reply pairs the DM responder fires on. Replaces the hardcoded
-- TRIGGER_REPLIES in lib/social/dm.ts so triggers can be added/removed from
-- /content/dms without a code change. Matches are case-insensitive on
-- short inbound DMs (the matcher in dm.ts guards against false positives).
create table if not exists public.dm_triggers (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  response text not null,
  description text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists dm_triggers_keyword_lower_idx
  on public.dm_triggers (lower(keyword));
alter table public.dm_triggers enable row level security;
drop trigger if exists dm_triggers_set_updated_at on public.dm_triggers;
create trigger dm_triggers_set_updated_at
  before update on public.dm_triggers
  for each row execute function public.set_updated_at();

-- Seed the existing audit trigger so behavior is preserved on day one.
insert into public.dm_triggers (keyword, response, description)
values (
  'audit',
  'Happy to help. Send me a quick list of the tools your team runs on and the two things eating the most time each week, and I''ll send back a short written diagnostic in a couple days. No call needed unless you want one.',
  'Tool stack audit (seeded from legacy hardcoded trigger)'
)
on conflict do nothing;

-- IG comments capture. ig-webhook writes rows here from the `changes` array
-- (field=comments). Triage pipeline mirrors ig_messages so the cron can
-- reuse the classifier + draft engine without a separate code path.
create table if not exists public.ig_comments (
  id uuid primary key default gen_random_uuid(),
  ig_comment_id text not null unique,
  parent_media_id text,
  parent_comment_id text,
  ig_user_id text,
  sender_id text,
  sender_username text,
  body text not null default '',
  raw_event jsonb,
  received_at timestamptz,
  category text,
  category_confidence real,
  category_reasoning text,
  draft_reply text,
  reply_status text default 'pending',
  sent_at timestamptz,
  send_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ig_comments_status_idx
  on public.ig_comments (reply_status, received_at desc);
create index if not exists ig_comments_received_idx
  on public.ig_comments (received_at desc);
alter table public.ig_comments enable row level security;
drop trigger if exists ig_comments_set_updated_at on public.ig_comments;
create trigger ig_comments_set_updated_at
  before update on public.ig_comments
  for each row execute function public.set_updated_at();
