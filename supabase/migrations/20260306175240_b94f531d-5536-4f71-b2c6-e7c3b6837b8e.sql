
-- Fix search_path for all functions
create or replace function public.get_my_role()
returns text as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer stable set search_path = public;

create or replace function public.is_member_of_group(p_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_memberships
    where group_id = p_group_id
    and user_id = auth.uid()
    and membership_status = 'active'
  );
$$ language sql security definer stable set search_path = public;

create or replace function public.get_member_stats(p_user_id uuid)
returns json as $$
declare
  v_total int;
  v_present int;
  v_streak int;
begin
  select count(*) into v_total from public.attendance where user_id = p_user_id;
  select count(*) into v_present from public.attendance where user_id = p_user_id and attendance_status = 'present';
  with daily as (
    select date_trunc('day', checkin_time) as d from public.attendance
    where user_id = p_user_id and attendance_status = 'present' group by 1 order by 1 desc
  ), gaps as (
    select d, lag(d) over (order by d desc) as prev_d from daily
  )
  select count(*) into v_streak from (select d from gaps where prev_d is null or (prev_d - d) <= interval '2 days') s;
  return json_build_object('total_sessions', v_total, 'present_sessions', v_present,
    'attendance_percentage', case when v_total > 0 then round((v_present::numeric / v_total) * 100) else 0 end,
    'current_streak', coalesce(v_streak, 0));
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.get_group_stats(p_group_id uuid)
returns json as $$
declare
  v_total_members int; v_sessions_30d int; v_avg_attendance numeric;
begin
  select count(*) into v_total_members from public.group_memberships where group_id = p_group_id and membership_status = 'active';
  select count(*) into v_sessions_30d from public.sessions where group_id = p_group_id and start_time >= now() - interval '30 days' and status = 'completed';
  select avg(present_count::numeric / capacity * 100) into v_avg_attendance from (
    select s.capacity, count(a.id) filter (where a.attendance_status = 'present') as present_count
    from public.sessions s left join public.attendance a on a.session_id = s.id
    where s.group_id = p_group_id and s.start_time >= now() - interval '30 days' group by s.id, s.capacity
  ) sub;
  return json_build_object('total_members', v_total_members, 'sessions_last_30d', v_sessions_30d, 'avg_attendance_pct', round(coalesce(v_avg_attendance, 0)));
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role) values (new.id, new.email, 'member');
  insert into public.profiles (user_id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;
