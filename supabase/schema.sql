-- Run this once in the Supabase SQL editor.
-- Single-table design: each user owns one row holding their full data blob.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- Each user can only see and modify their own row.
drop policy if exists "user_data: read own" on public.user_data;
create policy "user_data: read own"
  on public.user_data
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_data: insert own" on public.user_data;
create policy "user_data: insert own"
  on public.user_data
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_data: update own" on public.user_data;
create policy "user_data: update own"
  on public.user_data
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_data: delete own" on public.user_data;
create policy "user_data: delete own"
  on public.user_data
  for delete
  using (auth.uid() = user_id);
