-- Adds project folders, used to group projects on the Projects page.
-- Run this once in the Supabase SQL editor if your project already exists.

alter table projects add column if not exists folder_id uuid;

create table if not exists folders (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

alter table folders enable row level security;

create policy "own rows" on folders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
