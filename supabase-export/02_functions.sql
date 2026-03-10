-- ============================================================
-- WODITOS — FUNCIONES Y TRIGGERS
-- Archivo: 02_functions.sql
-- Ejecutar DESPUÉS de 01_schema.sql
-- ============================================================

-- ─── Función: handle_new_user (trigger en auth.users) ────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, email, role) VALUES (new.id, new.email, 'member');
  INSERT INTO public.profiles (user_id, full_name) VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;

-- ─── Trigger: on_auth_user_created ───────────────────────────
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Función: get_my_role ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ─── Función: is_member_of_group ─────────────────────────────
CREATE OR REPLACE FUNCTION public.is_member_of_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_memberships
    WHERE group_id = p_group_id
    AND user_id = auth.uid()
    AND membership_status = 'active'
  );
$$;

-- ─── Función: get_member_stats ───────────────────────────────
CREATE OR REPLACE FUNCTION public.get_member_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total int;
  v_present int;
  v_streak int;
BEGIN
  SELECT count(*) INTO v_total FROM public.attendance WHERE user_id = p_user_id;
  SELECT count(*) INTO v_present FROM public.attendance WHERE user_id = p_user_id AND attendance_status = 'present';
  WITH daily AS (
    SELECT date_trunc('day', checkin_time) AS d FROM public.attendance
    WHERE user_id = p_user_id AND attendance_status = 'present' GROUP BY 1 ORDER BY 1 DESC
  ), gaps AS (
    SELECT d, lag(d) OVER (ORDER BY d DESC) AS prev_d FROM daily
  )
  SELECT count(*) INTO v_streak FROM (SELECT d FROM gaps WHERE prev_d IS NULL OR (prev_d - d) <= interval '2 days') s;
  RETURN json_build_object('total_sessions', v_total, 'present_sessions', v_present,
    'attendance_percentage', CASE WHEN v_total > 0 THEN round((v_present::numeric / v_total) * 100) ELSE 0 END,
    'current_streak', coalesce(v_streak, 0));
END;
$$;

-- ─── Función: get_group_stats ────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_group_stats(p_group_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_members int; v_sessions_30d int; v_avg_attendance numeric;
BEGIN
  SELECT count(*) INTO v_total_members FROM public.group_memberships WHERE group_id = p_group_id AND membership_status = 'active';
  SELECT count(*) INTO v_sessions_30d FROM public.sessions WHERE group_id = p_group_id AND start_time >= now() - interval '30 days' AND status = 'completed';
  SELECT avg(present_count::numeric / capacity * 100) INTO v_avg_attendance FROM (
    SELECT s.capacity, count(a.id) FILTER (WHERE a.attendance_status = 'present') AS present_count
    FROM public.sessions s LEFT JOIN public.attendance a ON a.session_id = s.id
    WHERE s.group_id = p_group_id AND s.start_time >= now() - interval '30 days' GROUP BY s.id, s.capacity
  ) sub;
  RETURN json_build_object('total_members', v_total_members, 'sessions_last_30d', v_sessions_30d, 'avg_attendance_pct', round(coalesce(v_avg_attendance, 0)));
END;
$$;
