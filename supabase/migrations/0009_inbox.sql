-- Inbox triage + drafting (rebuilt in-hub).
-- Cron polls Fastmail, classifies, drafts a reply, parks the draft in Fastmail's
-- Drafts mailbox. Hub UI shows pending drafts; one-click Send submits the parked
-- draft via JMAP EmailSubmission/set.

create table public.inbox_emails (
  id uuid primary key default gen_random_uuid(),
  fastmail_id text not null unique,           -- original email id from Fastmail
  thread_id text,
  from_address text not null,
  from_name text,
  to_address text,
  subject text,
  body_preview text,
  body_full text,
  received_at timestamptz,
  category text,                              -- sales_inquiry / support_request / ...
  category_confidence real,
  category_reasoning text,
  action_taken text,                          -- 'draft' | 'archive' | 'delete' | 'no_action'
  draft_response text,                        -- the body we drafted
  fastmail_draft_id text,                     -- id of the parked draft in Fastmail
  draft_status text not null default 'pending', -- 'pending' | 'sent' | 'discarded' | 'failed'
  sent_at timestamptz,
  discarded_at timestamptz,
  send_error text,
  classified_at timestamptz,
  drafted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inbox_emails_status_idx on public.inbox_emails (draft_status, received_at desc);
create index inbox_emails_category_idx on public.inbox_emails (category, received_at desc);
create index inbox_emails_received_idx on public.inbox_emails (received_at desc);

alter table public.inbox_emails enable row level security;

create trigger inbox_emails_set_updated_at
  before update on public.inbox_emails
  for each row execute function public.set_updated_at();