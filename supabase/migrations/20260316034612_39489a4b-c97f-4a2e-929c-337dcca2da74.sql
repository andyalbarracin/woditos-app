-- Fix: Allow coaches to INSERT notifications for any user
CREATE POLICY "coaches_insert_notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('coach', 'super_admin')
  )
  OR user_id = auth.uid()
);

-- Drop the old overly restrictive ALL policy and recreate as SELECT-only
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;

CREATE POLICY "notifications_own_select" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notifications_own_update" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_own_delete" ON public.notifications
FOR DELETE TO authenticated
USING (user_id = auth.uid());