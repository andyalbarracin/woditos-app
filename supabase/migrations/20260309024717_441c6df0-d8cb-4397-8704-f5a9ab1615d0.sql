
-- Allow coaches to insert reservations on behalf of members
DROP POLICY IF EXISTS reservations_insert ON public.reservations;
CREATE POLICY reservations_insert ON public.reservations
FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid()) OR 
  (get_my_role() = ANY (ARRAY['super_admin'::text, 'coach'::text]))
);
