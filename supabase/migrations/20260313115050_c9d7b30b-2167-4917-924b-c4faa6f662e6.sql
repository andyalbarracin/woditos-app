DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'attendance'
      AND policyname = 'attendance_delete'
  ) THEN
    CREATE POLICY "attendance_delete"
      ON public.attendance
      FOR DELETE
      TO public
      USING (get_my_role() = ANY (ARRAY['super_admin'::text, 'coach'::text]));
  END IF;
END $$;