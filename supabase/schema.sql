-- Study Timer — Supabase schema
-- Run in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run any time a new table/policy is added — existing tables and
-- policies are skipped or replaced rather than erroring.

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

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  title text not null,
  exam_date date not null,
  created_at timestamptz not null default now()
);

-- One row per user: the currently running/paused pomodoro, mirrored here so
-- every signed-in device can see and continue the same timer in real time.
create table if not exists active_timer (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  phase text not null default 'work',
  phase_end_at timestamptz,
  remaining_seconds integer,
  is_running boolean not null default false,
  completed_count integer not null default 0,
  session_start timestamptz,
  -- Marks the phase_end_at already texted to the user, so the once-a-minute
  -- notification check doesn't re-send while a phone is locked/app closed.
  last_notified_end_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Safety net for anyone who ran an earlier version of this schema before
-- last_notified_end_at existed.
alter table active_timer add column if not exists last_notified_end_at timestamptz;

-- One row per browser/device that opted into push notifications.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table subjects enable row level security;
alter table sessions enable row level security;
alter table pomodoro_settings enable row level security;
alter table exams enable row level security;
alter table active_timer enable row level security;
alter table push_subscriptions enable row level security;

drop policy if exists "Users manage own subjects" on subjects;
create policy "Users manage own subjects" on subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own sessions" on sessions;
create policy "Users manage own sessions" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own pomodoro settings" on pomodoro_settings;
create policy "Users manage own pomodoro settings" on pomodoro_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own exams" on exams;
create policy "Users manage own exams" on exams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own active timer" on active_timer;
create policy "Users manage own active timer" on active_timer
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own push subscriptions" on push_subscriptions;
create policy "Users manage own push subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Lets Supabase Realtime push row changes to other signed-in devices.
-- ALTER PUBLICATION has no IF NOT EXISTS, so this checks first to stay
-- safe to re-run.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'active_timer'
  ) then
    alter publication supabase_realtime add table active_timer;
  end if;
end $$;
