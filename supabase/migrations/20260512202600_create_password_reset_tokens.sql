CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_token_idx ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx ON public.password_reset_tokens(expires_at);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_token" ON public.password_reset_tokens;
CREATE POLICY "public_select_token" ON public.password_reset_tokens
    FOR SELECT TO public 
    USING (expires_at > NOW() AND used_at IS NULL);

DROP POLICY IF EXISTS "public_insert_token" ON public.password_reset_tokens;
CREATE POLICY "public_insert_token" ON public.password_reset_tokens
    FOR INSERT TO public 
    WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_token" ON public.password_reset_tokens;
CREATE POLICY "public_update_token" ON public.password_reset_tokens
    FOR UPDATE TO public 
    USING (expires_at > NOW() AND used_at IS NULL)
    WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_token" ON public.password_reset_tokens;
CREATE POLICY "admin_delete_token" ON public.password_reset_tokens
    FOR DELETE TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.role = 'admin'
    ));

CREATE OR REPLACE FUNCTION public.trigger_clean_expired_tokens()
RETURNS trigger AS $$
BEGIN
    DELETE FROM public.password_reset_tokens
    WHERE expires_at < NOW() OR used_at < NOW() - INTERVAL '24 hours';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_token_insert_clean ON public.password_reset_tokens;
CREATE TRIGGER on_token_insert_clean
    AFTER INSERT ON public.password_reset_tokens
    FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_clean_expired_tokens();
