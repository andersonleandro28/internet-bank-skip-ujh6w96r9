ALTER TABLE public.requisicoes ADD COLUMN IF NOT EXISTS metadados JSONB DEFAULT '{}'::jsonb;
