DO $$
BEGIN
  -- PF
  ALTER TABLE public.usuarios_pf ADD COLUMN IF NOT EXISTS documento_identidade_url TEXT;

  -- PJ
  ALTER TABLE public.usuarios_pj ADD COLUMN IF NOT EXISTS resp_nome TEXT;
  ALTER TABLE public.usuarios_pj ADD COLUMN IF NOT EXISTS resp_cpf TEXT;
  ALTER TABLE public.usuarios_pj ADD COLUMN IF NOT EXISTS resp_data_nascimento DATE;
  ALTER TABLE public.usuarios_pj ADD COLUMN IF NOT EXISTS resp_selfie_url TEXT;
  ALTER TABLE public.usuarios_pj ADD COLUMN IF NOT EXISTS resp_documento_url TEXT;
END $$;
