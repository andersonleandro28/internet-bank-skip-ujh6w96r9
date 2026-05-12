DO $$
BEGIN
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS telefone TEXT;
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS endereco_rua TEXT;
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS endereco_numero TEXT;
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS endereco_complemento TEXT;
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS endereco_cep TEXT;
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS endereco_cidade TEXT;
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS endereco_estado TEXT;
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT;
END $$;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar public view" ON storage.objects;
CREATE POLICY "Avatar public view" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar insert" ON storage.objects;
CREATE POLICY "Avatar insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar update" ON storage.objects;
CREATE POLICY "Avatar update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;
CREATE POLICY "Avatar delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');
