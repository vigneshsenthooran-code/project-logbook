-- Project Logbook (Quire) — Supabase schema + RLS
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists projects (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  description text,
  cover_attachment_id uuid,
  start_date date,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  folder_id uuid
);

create table if not exists folders (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists presets (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  categories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists configs (
  project_id uuid primary key references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  active_preset text not null,
  categories jsonb not null default '[]'::jsonb
);

create table if not exists entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  type text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  body text not null default '',
  category_id text not null,
  sub_heading_id text,
  attachment_ids text[] not null default '{}',
  link jsonb,
  citation text,
  relates_to text
);
create index if not exists entries_by_project on entries(project_id);
create index if not exists entries_by_category on entries(category_id);
create index if not exists entries_by_created on entries(created_at);

create table if not exists attachments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references entries(id) on delete cascade,
  name text not null,
  mime text not null,
  storage_path text not null
);

create table if not exists todos (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  due_date date,
  created_at timestamptz not null
);
create index if not exists todos_by_project on todos(project_id);

create table if not exists calendar_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  date date not null,
  note text
);
create index if not exists calendar_events_by_project on calendar_events(project_id);

create table if not exists meta (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_project_id uuid
);

-- Row Level Security: every row is only visible/writable by the user who owns it.
alter table projects enable row level security;
alter table folders enable row level security;
alter table presets enable row level security;
alter table configs enable row level security;
alter table entries enable row level security;
alter table attachments enable row level security;
alter table todos enable row level security;
alter table calendar_events enable row level security;
alter table meta enable row level security;

create policy "own rows" on projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on folders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on presets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on configs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on attachments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on todos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on meta for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket for attachments (private; access goes through signed URLs / RLS-style storage policies).
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "own attachment files read"
  on storage.objects for select
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own attachment files write"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own attachment files delete"
  on storage.objects for delete
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
