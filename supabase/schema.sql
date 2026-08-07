-- Study Timer — Supabase schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  mode text not null default 'pomodoro',
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_seconds integer not null,
  date date not null,
  created_at timestamptz not null default now()
);

create table if not exists pomodoro_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  work_minutes integer not null default 25,
  break_minutes integer not null default 5,
  long_break_minutes integer not null default 15,
  intervals_until_long_break integer not null default 4,
  auto_start_next_phase boolean not null default true
);

alter table subjects enable row level security;
alter table sessions enable row level security;
alter table pomodoro_settings enable row level security;

create policy "Users manage own subjects" on subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own sessions" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own pomodoro settings" on pomodoro_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
