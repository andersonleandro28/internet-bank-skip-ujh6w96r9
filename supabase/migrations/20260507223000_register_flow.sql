DO $$
BEGIN
  -- Fix auditoria RLS to avoid "TABLES WITH RLS ENABLED BUT NO POLICIES"
  DROP POLICY IF EXISTS "auditoria_select" ON public.auditoria;
  CREATE POLICY "auditoria_select" ON public.auditoria FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.role = 'admin')
  );
END $$;

-- Recreate handle_new_user to handle "pendente" status and tipo_usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, role, status, tipo)
  VALUES (
    NEW.id, 
    NEW.email, 
    'cliente', 
    'pendente', 
    COALESCE((NEW.raw_user_meta_data->>'tipo'), 'PF')::public.tipo_usuario
  )
  ON CONFLICT (id) DO UPDATE SET 
    status = 'pendente',
    tipo = EXCLUDED.tipo;
  
  INSERT INTO public.contas (user_id, saldo, saldo_bloqueado)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Storage for uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;
CREATE POLICY "Anyone can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Anyone can update" ON storage.objects;
CREATE POLICY "Anyone can update" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads');
