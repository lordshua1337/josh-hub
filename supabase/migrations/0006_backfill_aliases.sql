-- Backfill: aliases the initial seed missed, then re-detect project_slug
-- for previously-unmatched xp_events. Brings 57 unmatched events down to ~34
-- (the remainder are genuine system/tool events that don't belong to a project).

insert into public.project_aliases (alias, project_slug) values
  ('bashbox',            'bashbox'),
  ('event bus',          'event-bus'),
  ('auth + billing kit', 'auth-billing-kit'),
  ('auth billing kit',   'auth-billing-kit'),
  ('holdinginsightcard', 'stock-pilot'),
  ('insight card',       'stock-pilot'),
  ('cfra',               'stock-pilot'),
  ('starmine',           'stock-pilot'),
  ('benchmark tape',     'stock-pilot'),
  ('herosection',        'ctax-partner-site'),
  ('page builder',       'ctax-partner-site'),
  ('portal dashboard',   'ctax-partner-site'),
  ('scroll',             'ctax-partner-site'),
  ('cinematic',          'ctax-partner-site'),
  ('snap-scroll',        'ctax-partner-site'),
  ('lightbulb',          'ctax-partner-site'),
  ('boho',               'ctax-partner-site'),
  ('aeo',                'ctax-partner-site'),
  ('business planner',   'ctax-partner-site'),
  ('joshuatree',         'josh-hub')
on conflict (alias) do nothing;

update public.xp_events as x
set project_slug = (
  select pa.project_slug from public.project_aliases pa
  where position(pa.alias in lower(x.event)) > 0
  order by length(pa.alias) desc
  limit 1
)
where project_slug is null;
