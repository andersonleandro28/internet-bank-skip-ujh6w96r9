CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_attempts_email_idx ON public.password_reset_attempts (email);
CREATE INDEX IF NOT EXISTS password_reset_attempts_created_at_idx ON public.password_reset_attempts (created_at);

ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_attempts" ON public.password_reset_attempts;
CREATE POLICY "admin_all_attempts" ON public.password_reset_attempts
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
