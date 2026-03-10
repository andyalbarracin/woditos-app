-- ============================================================
-- WODITOS — RLS POLICIES
-- Archivo: 03_rls_policies.sql
-- Ejecutar DESPUÉS de 02_functions.sql
-- ============================================================

-- ─── USERS ───────────────────────────────────────────────────
CREATE POLICY "users_insert_self" ON public.users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_select" ON public.users FOR SELECT USING (
  (id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach','staff']))
);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());

-- ─── PROFILES ────────────────────────────────────────────────
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (
  (user_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach','staff']))
);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (user_id = auth.uid());

-- ─── GROUPS ──────────────────────────────────────────────────
CREATE POLICY "groups_insert" ON public.groups FOR INSERT WITH CHECK (
  get_my_role() = ANY (ARRAY['super_admin','coach'])
);
CREATE POLICY "groups_select" ON public.groups FOR SELECT USING (
  is_member_of_group(id) OR (coach_id = auth.uid()) OR (get_my_role() = 'super_admin')
);
CREATE POLICY "groups_update" ON public.groups FOR UPDATE USING (
  (coach_id = auth.uid()) OR (get_my_role() = 'super_admin')
);

-- ─── GROUP_MEMBERSHIPS ───────────────────────────────────────
CREATE POLICY "memberships_insert" ON public.group_memberships FOR INSERT WITH CHECK (
  get_my_role() = ANY (ARRAY['super_admin','coach'])
);
CREATE POLICY "memberships_select" ON public.group_memberships FOR SELECT USING (
  (user_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach','staff']))
);
CREATE POLICY "memberships_update" ON public.group_memberships FOR UPDATE USING (
  get_my_role() = ANY (ARRAY['super_admin','coach'])
);

-- ─── SESSIONS ────────────────────────────────────────────────
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT WITH CHECK (
  get_my_role() = ANY (ARRAY['super_admin','coach'])
);
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT USING (
  is_member_of_group(group_id) OR (coach_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','staff']))
);
CREATE POLICY "sessions_update" ON public.sessions FOR UPDATE USING (
  (coach_id = auth.uid()) OR (get_my_role() = 'super_admin')
);

-- ─── RESERVATIONS ────────────────────────────────────────────
CREATE POLICY "reservations_insert" ON public.reservations FOR INSERT TO authenticated WITH CHECK (
  (user_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach']))
);
CREATE POLICY "reservations_select" ON public.reservations FOR SELECT USING (
  (user_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach','staff']))
);
CREATE POLICY "reservations_update" ON public.reservations FOR UPDATE USING (
  (user_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach','staff']))
);

-- ─── ATTENDANCE ──────────────────────────────────────────────
CREATE POLICY "attendance_insert" ON public.attendance FOR INSERT WITH CHECK (
  get_my_role() = ANY (ARRAY['super_admin','coach'])
);
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT USING (
  (user_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach','staff']))
);
CREATE POLICY "attendance_update" ON public.attendance FOR UPDATE USING (
  get_my_role() = ANY (ARRAY['super_admin','coach'])
);

-- ─── POSTS ───────────────────────────────────────────────────
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (author_user_id = auth.uid());
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (
  (group_id IS NULL) OR is_member_of_group(group_id) OR (get_my_role() = ANY (ARRAY['super_admin','coach']))
);
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (
  (author_user_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach']))
);
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (
  (author_user_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach']))
);

-- ─── COMMENTS ────────────────────────────────────────────────
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (author_user_id = auth.uid());
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (
  (author_user_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach']))
);

-- ─── REACTIONS ───────────────────────────────────────────────
CREATE POLICY "reactions_insert" ON public.reactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reactions_select" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "reactions_delete" ON public.reactions FOR DELETE USING (user_id = auth.uid());

-- ─── STORIES ─────────────────────────────────────────────────
CREATE POLICY "stories_insert" ON public.stories FOR INSERT WITH CHECK (author_user_id = auth.uid());
CREATE POLICY "stories_select" ON public.stories FOR SELECT USING (
  (group_id IS NULL) OR is_member_of_group(group_id) OR (get_my_role() = ANY (ARRAY['super_admin','coach']))
);

-- ─── ACHIEVEMENTS ────────────────────────────────────────────
CREATE POLICY "achievements_insert" ON public.achievements FOR INSERT WITH CHECK (
  (get_my_role() = ANY (ARRAY['super_admin','coach'])) OR (user_id = auth.uid())
);
CREATE POLICY "achievements_select" ON public.achievements FOR SELECT USING (
  (user_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['super_admin','coach']))
);

-- ─── COACH_NOTES ─────────────────────────────────────────────
CREATE POLICY "coach_notes_insert" ON public.coach_notes FOR INSERT WITH CHECK (
  (get_my_role() = ANY (ARRAY['super_admin','coach'])) AND (coach_id = auth.uid())
);
CREATE POLICY "coach_notes_select" ON public.coach_notes FOR SELECT USING (
  (coach_id = auth.uid()) OR (get_my_role() = 'super_admin') OR ((member_user_id = auth.uid()) AND (visibility_private = false))
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ─── EXERCISE_WIKI ───────────────────────────────────────────
CREATE POLICY "exercise_wiki_select" ON public.exercise_wiki FOR SELECT USING (true);
CREATE POLICY "exercise_wiki_modify" ON public.exercise_wiki FOR ALL USING (
  get_my_role() = ANY (ARRAY['super_admin','coach'])
);

-- ─── FOOD_WIKI ───────────────────────────────────────────────
CREATE POLICY "food_wiki_select" ON public.food_wiki FOR SELECT USING (true);
CREATE POLICY "food_wiki_modify" ON public.food_wiki FOR ALL USING (
  get_my_role() = ANY (ARRAY['super_admin','coach'])
);

-- ─── PUSH_SUBSCRIPTIONS ─────────────────────────────────────
CREATE POLICY "Users manage own push subscription" ON public.push_subscriptions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Coaches can read push subscriptions" ON public.push_subscriptions FOR SELECT USING (
  get_my_role() = ANY (ARRAY['super_admin','coach'])
);
