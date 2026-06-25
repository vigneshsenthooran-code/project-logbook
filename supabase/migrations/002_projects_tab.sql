-- Adds project metadata (description, cover, start date, archiving) and the
-- global custom-presets table introduced by the Projects tab.
-- Run this once in the Supabase SQL editor if your project already exists
-- (schema.sql alone won't add columns to an existing `projects` table).

alter table projects add column if not exists description text;
alter table projects add column if not exists cover_attachment_id uuid;
alter table projects add column if not exists start_date date;
alter table projects add column if not exists archived boolean not null default false;

create table if not exists presets (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  categories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table presets enable row level security;

create policy "own rows" on presets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
