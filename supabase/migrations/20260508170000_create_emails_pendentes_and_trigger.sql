CREATE TABLE IF NOT EXISTS public.emails_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE,
  email text NOT NULL,
  assunto text NOT NULL,
  template text NOT NULL,
  tentativas int DEFAULT 0,
  erro text,
  status text DEFAULT 'pendente',
  created_at timestamptz DEFAULT now()
);

-- Permissões básicas para admins poderem ler e tentar reenviar
DROP POLICY IF EXISTS "admin_all_emails_pendentes" ON public.emails_pendentes;
CREATE POLICY "admin_all_emails_pendentes" ON public.emails_pendentes
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.role = 'admin'
    )
  );

ALTER TABLE public.emails_pendentes ENABLE ROW LEVEL SECURITY;
