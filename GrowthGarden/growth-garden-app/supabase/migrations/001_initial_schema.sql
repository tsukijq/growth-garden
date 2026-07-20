-- GrowthGarden Database Schema
-- Migration: Initial schema for all tables, constraints, and RLS policies
-- Matches design document data models exactly

-- ============================
-- Extensions
-- ============================
create extension if not exists "pgcrypto";

-- ============================
-- Tables
-- ============================

-- profiles: extends Supabase auth.users with timezone
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

-- habits: one per plant
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 1 and char_length(name) <= 50),
  schedule_type text not null check (schedule_type in ('daily', 'weekly', 'custom')),
  schedule_days int[] default null,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  current_streak int not null default 0,
  is_wilting boolean not null default false,
  paused_at timestamptz default null,
  paused_streak int default null,
  paused_growth_stage text default null,
  archived_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- completions: tracks habit completions per day
create table if not exists completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  completed_date date not null,
  created_at timestamptz not null default now()
);

-- Unique constraint: one completion per habit per day
alter table completions add constraint completions_habit_date_unique unique (habit_id, completed_date);

-- rare_flowers: unlocked by streak milestones
create table if not exists rare_flowers (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  milestone int not null check (milestone in (30, 60, 100)),
  variant_id text not null,
  is_active_display boolean not null default false,
  unlocked_at timestamptz not null default now()
);

-- Unique constraint: one rare flower per habit per milestone
alter table rare_flowers add constraint rare_flowers_habit_milestone_unique unique (habit_id, milestone);

-- garden_share_settings: per-user sharing configuration
create table if not exists garden_share_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  is_sharing_enabled boolean not null default false,
  share_link_id text unique default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: one share setting per user
alter table garden_share_settings add constraint garden_share_settings_user_unique unique (user_id);

-- friend_connections: tracks friend requests and connections
create table if not exists friend_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_connections_no_self check (requester_id != recipient_id)
);

-- Unique constraint: one connection per requester-recipient pair
alter table friend_connections add constraint friend_connections_pair_unique unique (requester_id, recipient_id);

-- reminders: per-habit reminder configuration
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reminder_time time not null default '09:00',
  is_enabled boolean not null default true,
  retry_count int not null default 0,
  last_sent_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: one reminder per habit
alter table reminders add constraint reminders_habit_unique unique (habit_id);

-- ============================
-- Indexes for performance
-- ============================
create index if not exists idx_habits_user_id on habits(user_id);
create index if not exists idx_habits_status on habits(status);
create index if not exists idx_completions_habit_id on completions(habit_id);
create index if not exists idx_completions_user_id on completions(user_id);
create index if not exists idx_completions_date on completions(completed_date);
create index if not exists idx_rare_flowers_habit_id on rare_flowers(habit_id);
create index if not exists idx_friend_connections_requester on friend_connections(requester_id);
create index if not exists idx_friend_connections_recipient on friend_connections(recipient_id);
create index if not exists idx_reminders_user_id on reminders(user_id);
create index if not exists idx_garden_share_settings_link on garden_share_settings(share_link_id);

-- ============================
-- Row Level Security
-- ============================

alter table profiles enable row level security;
alter table habits enable row level security;
alter table completions enable row level security;
alter table rare_flowers enable row level security;
alter table garden_share_settings enable row level security;
alter table friend_connections enable row level security;
alter table reminders enable row level security;

-- profiles: users can only read/update their own profile
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- habits: users can CRUD their own habits
create policy "Users can manage own habits"
  on habits for all
  using (auth.uid() = user_id);

-- completions: users can manage their own completions
create policy "Users can manage own completions"
  on completions for all
  using (auth.uid() = user_id);

-- rare_flowers: users can read their own flowers (via habit ownership)
create policy "Users can read own flowers"
  on rare_flowers for select
  using (
    auth.uid() = (select user_id from habits where id = habit_id)
  );

create policy "Users can insert own flowers"
  on rare_flowers for insert
  with check (
    auth.uid() = (select user_id from habits where id = habit_id)
  );

create policy "Users can update own flowers"
  on rare_flowers for update
  using (
    auth.uid() = (select user_id from habits where id = habit_id)
  );

-- garden_share_settings: users manage their own settings
create policy "Users can manage own share settings"
  on garden_share_settings for all
  using (auth.uid() = user_id);

-- friend_connections: users can see connections they're part of
create policy "Users can see own connections"
  on friend_connections for select
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "Users can create friend requests"
  on friend_connections for insert
  with check (auth.uid() = requester_id);

create policy "Users can update connections they're part of"
  on friend_connections for update
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "Users can delete connections they're part of"
  on friend_connections for delete
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- reminders: users manage their own reminders
create policy "Users can manage own reminders"
  on reminders for all
  using (auth.uid() = user_id);

-- ============================
-- Trigger: auto-create profile on auth.users insert
-- ============================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, timezone, created_at)
  values (new.id, coalesce(new.raw_user_meta_data->>'timezone', 'UTC'), now());
  return new;
end;
$$;

-- Drop existing trigger if it exists, then create
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================
-- Helper function: update updated_at timestamp
-- ============================

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers to relevant tables
create trigger habits_updated_at
  before update on habits
  for each row execute function public.update_updated_at_column();

create trigger garden_share_settings_updated_at
  before update on garden_share_settings
  for each row execute function public.update_updated_at_column();

create trigger friend_connections_updated_at
  before update on friend_connections
  for each row execute function public.update_updated_at_column();

create trigger reminders_updated_at
  before update on reminders
  for each row execute function public.update_updated_at_column();
