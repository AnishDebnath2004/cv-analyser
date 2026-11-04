-- ==============================================================
-- PathFinder AI - Supabase PostgreSQL Database Schema
-- ==============================================================
-- Paste and run this script in your Supabase Project's SQL Editor
-- (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================

-- 1. Create Public User Profiles Table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text unique not null,
  avatar_url text,
  headline text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Automatically sync newly registered Supabase auth users to public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.created_at
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function on every new auth signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Create CV Evaluations Table to store candidate analysis history
create table if not exists public.cv_evaluations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  candidate_name text,
  top_match_title text,
  top_match_score double precision,
  primary_domain text,
  total_skills integer default 0,
  verified_skills jsonb default '[]'::jsonb,
  critical_skill_gaps jsonb default '[]'::jsonb,
  executive_strengths jsonb default '[]'::jsonb,
  career_pathways jsonb default '[]'::jsonb,
  resume_optimization_tips jsonb default '[]'::jsonb,
  evaluation_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.cv_evaluations enable row level security;

-- 5. RLS Security Policies
-- Profiles:
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- CV Evaluations:
drop policy if exists "Users can view own CV evaluations" on public.cv_evaluations;
create policy "Users can view own CV evaluations"
  on public.cv_evaluations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own CV evaluations" on public.cv_evaluations;
create policy "Users can insert own CV evaluations"
  on public.cv_evaluations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own CV evaluations" on public.cv_evaluations;
create policy "Users can delete own CV evaluations"
  on public.cv_evaluations for delete
  using (auth.uid() = user_id);

-- ==============================================================
-- 6. Auto-Confirm Users (Eliminates 'email_not_confirmed' barrier)
-- ==============================================================
-- Immediately confirm any previously registered users who are stuck unconfirmed:
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

-- Automatically confirm all future signups without waiting for email confirmation:
create or replace function public.auto_confirm_new_users()
returns trigger as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute procedure public.auto_confirm_new_users();


