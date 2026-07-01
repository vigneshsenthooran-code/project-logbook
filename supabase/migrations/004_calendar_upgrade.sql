-- Promotes calendar_events to a universal, cross-project calendar that absorbs
-- to-dos as tasks, and adds a single global term/period. Run this once in the
-- Supabase SQL editor if your project already exists.

alter table calendar_events alter column project_id drop not null;
alter table calendar_events add column if not exists end_date date;
alter table calendar_events add column if not exists time text;
alter table calendar_events add column if not exists reminder boolean not null default false;
alter table calendar_events add column if not exists kind text not null default 'event';
alter table calendar_events add column if not exists done boolean not null default false;
alter table calendar_events add column if not exists category_id text;
alter table calendar_events add column if not exists recurrence jsonb;

create table if not exists periods (
  user_id uuid primary key references auth.users(id) on delete cascade,
  start_date date not null,
  week_count integer not null,
  break_weeks integer[] not null default '{}',
  labels jsonb
);

alter table periods enable row level security;

create policy "own rows" on periods for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
