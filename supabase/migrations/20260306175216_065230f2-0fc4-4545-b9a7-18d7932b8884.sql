
-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- USERS (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'member' check (role in ('super_admin','coach','staff','member')),
  email text not null,
  phone text,
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  created_at timestamptz default now()
);

-- PROFILES
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade unique not null,
  full_name text not null,
  avatar_url text,
  birth_date date,
  emergency_contact text,
  experience_level text check (experience_level in ('basic','intermediate','advanced')),
  goals text,
  private_health_notes text,
  join_date date default current_date,
  updated_at timestamptz default now()
);

-- GROUPS
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  group_type text not null check (group_type in ('running','functional','hybrid')),
  location text,
  capacity int not null default 20,
  coach_id uuid references public.users(id),
  cover_image_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now()
);

-- GROUP MEMBERSHIPS
create table public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  membership_status text not null default 'active' check (membership_status in ('active','inactive','pending')),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- SESSIONS
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  coach_id uuid references public.users(id),
  title text not null,
  session_type text not null check (session_type in ('running','functional','amrap','emom','hiit','technique')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  capacity int not null default 20,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled')),
  created_at timestamptz default now()
);
create index idx_sessions_start_time on public.sessions(start_time);
create index idx_sessions_group_start on public.sessions(group_id, start_time);

-- RESERVATIONS
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  reservation_status text not null default 'confirmed' check (reservation_status in ('confirmed','waitlist','cancelled')),
  created_at timestamptz default now(),
  cancelled_at timestamptz,
  unique(session_id, user_id)
);

-- ATTENDANCE
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  attendance_status text not null check (attendance_status in ('present','absent','late','excused')),
  checkin_time timestamptz,
  notes text,
  unique(session_id, user_id)
);

-- POSTS
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid references public.users(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade,
  content_text text,
  media_url text,
  post_type text not null default 'text' check (post_type in ('text','photo','milestone','announcement')),
  visibility text not null default 'group' check (visibility in ('group','all_members')),
  created_at timestamptz default now()
);
create index idx_posts_created on public.posts(created_at desc);

-- STORIES
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid references public.users(id) on delete cascade not null,
  group_id uuid references public.groups(id),
  media_url text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

-- COMMENTS
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_user_id uuid references public.users(id) on delete cascade not null,
  content_text text not null,
  created_at timestamptz default now()
);

-- REACTIONS
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  reaction_type text not null default 'like',
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- EXERCISE WIKI
create table public.exercise_wiki (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  goal text,
  muscle_group text,
  difficulty_level text not null check (difficulty_level in ('basic','intermediate','advanced')),
  description text not null,
  technique text,
  common_mistakes text,
  media_url text,
  contraindications text,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- FOOD WIKI
create table public.food_wiki (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  benefits text not null,
  best_time_to_consume text,
  performance_relation text,
  examples text,
  notes text,
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  action_url text,
  created_at timestamptz default now()
);
create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- COACH NOTES
create table public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.users(id) on delete cascade not null,
  member_user_id uuid references public.users(id) on delete cascade not null,
  group_id uuid references public.groups(id),
  note_text text not null,
  visibility_private boolean default true,
  created_at timestamptz default now()
);

-- ACHIEVEMENTS
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  achievement_type text not null,
  title text not null,
  description text,
  earned_at timestamptz default now()
);

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.sessions enable row level security;
alter table public.reservations enable row level security;
alter table public.attendance enable row level security;
alter table public.posts enable row level security;
alter table public.stories enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.notifications enable row level security;
alter table public.coach_notes enable row level security;
alter table public.exercise_wiki enable row level security;
alter table public.food_wiki enable row level security;
alter table public.achievements enable row level security;

-- HELPER: get current user role
create or replace function public.get_my_role()
returns text as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer stable;

-- HELPER: is user in group?
create or replace function public.is_member_of_group(p_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_memberships
    where group_id = p_group_id
    and user_id = auth.uid()
    and membership_status = 'active'
  );
$$ language sql security definer stable;

-- RLS POLICIES

-- USERS
create policy "users_select" on public.users
  for select using (id = auth.uid() or get_my_role() in ('super_admin','coach','staff'));
create policy "users_update_own" on public.users
  for update using (id = auth.uid());
create policy "users_insert_self" on public.users
  for insert with check (id = auth.uid());

-- PROFILES
create policy "profiles_select" on public.profiles
  for select using (user_id = auth.uid() or get_my_role() in ('super_admin','coach','staff'));
create policy "profiles_insert" on public.profiles
  for insert with check (user_id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (user_id = auth.uid());

-- GROUPS
create policy "groups_select" on public.groups
  for select using (is_member_of_group(id) or coach_id = auth.uid() or get_my_role() = 'super_admin');
create policy "groups_insert" on public.groups
  for insert with check (get_my_role() in ('super_admin','coach'));
create policy "groups_update" on public.groups
  for update using (coach_id = auth.uid() or get_my_role() = 'super_admin');

-- GROUP MEMBERSHIPS
create policy "memberships_select" on public.group_memberships
  for select using (user_id = auth.uid() or get_my_role() in ('super_admin','coach','staff'));
create policy "memberships_insert" on public.group_memberships
  for insert with check (get_my_role() in ('super_admin','coach'));
create policy "memberships_update" on public.group_memberships
  for update using (get_my_role() in ('super_admin','coach'));

-- SESSIONS
create policy "sessions_select" on public.sessions
  for select using (is_member_of_group(group_id) or coach_id = auth.uid() or get_my_role() in ('super_admin','staff'));
create policy "sessions_insert" on public.sessions
  for insert with check (get_my_role() in ('super_admin','coach'));
create policy "sessions_update" on public.sessions
  for update using (coach_id = auth.uid() or get_my_role() = 'super_admin');

-- RESERVATIONS
create policy "reservations_select" on public.reservations
  for select using (user_id = auth.uid() or get_my_role() in ('super_admin','coach','staff'));
create policy "reservations_insert" on public.reservations
  for insert with check (user_id = auth.uid());
create policy "reservations_update" on public.reservations
  for update using (user_id = auth.uid() or get_my_role() in ('super_admin','coach','staff'));

-- ATTENDANCE
create policy "attendance_select" on public.attendance
  for select using (user_id = auth.uid() or get_my_role() in ('super_admin','coach','staff'));
create policy "attendance_insert" on public.attendance
  for insert with check (get_my_role() in ('super_admin','coach'));
create policy "attendance_update" on public.attendance
  for update using (get_my_role() in ('super_admin','coach'));

-- POSTS
create policy "posts_select" on public.posts
  for select using ((group_id is null) or is_member_of_group(group_id) or get_my_role() in ('super_admin','coach'));
create policy "posts_insert" on public.posts
  for insert with check (author_user_id = auth.uid());
create policy "posts_update" on public.posts
  for update using (author_user_id = auth.uid() or get_my_role() in ('super_admin','coach'));
create policy "posts_delete" on public.posts
  for delete using (author_user_id = auth.uid() or get_my_role() in ('super_admin','coach'));

-- STORIES
create policy "stories_select" on public.stories
  for select using ((group_id is null) or is_member_of_group(group_id) or get_my_role() in ('super_admin','coach'));
create policy "stories_insert" on public.stories
  for insert with check (author_user_id = auth.uid());

-- COMMENTS
create policy "comments_select" on public.comments
  for select using (true);
create policy "comments_insert" on public.comments
  for insert with check (author_user_id = auth.uid());
create policy "comments_delete" on public.comments
  for delete using (author_user_id = auth.uid() or get_my_role() in ('super_admin','coach'));

-- REACTIONS
create policy "reactions_select" on public.reactions
  for select using (true);
create policy "reactions_insert" on public.reactions
  for insert with check (user_id = auth.uid());
create policy "reactions_delete" on public.reactions
  for delete using (user_id = auth.uid());

-- NOTIFICATIONS
create policy "notifications_own" on public.notifications
  for all using (user_id = auth.uid());

-- COACH NOTES
create policy "coach_notes_select" on public.coach_notes
  for select using (coach_id = auth.uid() or get_my_role() = 'super_admin' or (member_user_id = auth.uid() and visibility_private = false));
create policy "coach_notes_insert" on public.coach_notes
  for insert with check (get_my_role() in ('super_admin','coach') and coach_id = auth.uid());

-- EXERCISE WIKI (public read)
create policy "exercise_wiki_select" on public.exercise_wiki
  for select using (true);
create policy "exercise_wiki_modify" on public.exercise_wiki
  for all using (get_my_role() in ('super_admin','coach'));

-- FOOD WIKI (public read)
create policy "food_wiki_select" on public.food_wiki
  for select using (true);
create policy "food_wiki_modify" on public.food_wiki
  for all using (get_my_role() in ('super_admin','coach'));

-- ACHIEVEMENTS
create policy "achievements_select" on public.achievements
  for select using (user_id = auth.uid() or get_my_role() in ('super_admin','coach'));
create policy "achievements_insert" on public.achievements
  for insert with check (get_my_role() in ('super_admin','coach') or user_id = auth.uid());

-- FUNCTIONS

-- Get member stats
create or replace function public.get_member_stats(p_user_id uuid)
returns json as $$
declare
  v_total int;
  v_present int;
  v_streak int;
begin
  select count(*) into v_total from attendance where user_id = p_user_id;
  select count(*) into v_present from attendance where user_id = p_user_id and attendance_status = 'present';

  with daily as (
    select date_trunc('day', checkin_time) as d
    from attendance
    where user_id = p_user_id and attendance_status = 'present'
    group by 1 order by 1 desc
  ),
  gaps as (
    select d, lag(d) over (order by d desc) as prev_d from daily
  )
  select count(*) into v_streak
  from (select d from gaps where prev_d is null or (prev_d - d) <= interval '2 days') s;

  return json_build_object(
    'total_sessions', v_total,
    'present_sessions', v_present,
    'attendance_percentage', case when v_total > 0 then round((v_present::numeric / v_total) * 100) else 0 end,
    'current_streak', coalesce(v_streak, 0)
  );
end;
$$ language plpgsql security definer;

-- Get group stats
create or replace function public.get_group_stats(p_group_id uuid)
returns json as $$
declare
  v_total_members int;
  v_sessions_30d int;
  v_avg_attendance numeric;
begin
  select count(*) into v_total_members from group_memberships where group_id = p_group_id and membership_status = 'active';
  select count(*) into v_sessions_30d from sessions where group_id = p_group_id and start_time >= now() - interval '30 days' and status = 'completed';

  select avg(present_count::numeric / capacity * 100) into v_avg_attendance
  from (
    select s.capacity, count(a.id) filter (where a.attendance_status = 'present') as present_count
    from sessions s left join attendance a on a.session_id = s.id
    where s.group_id = p_group_id and s.start_time >= now() - interval '30 days'
    group by s.id, s.capacity
  ) sub;

  return json_build_object(
    'total_members', v_total_members,
    'sessions_last_30d', v_sessions_30d,
    'avg_attendance_pct', round(coalesce(v_avg_attendance, 0))
  );
end;
$$ language plpgsql security definer;

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'member');
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
