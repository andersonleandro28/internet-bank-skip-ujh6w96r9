CREATE TABLE IF NOT EXISTS public.boletos_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  codigo_barras text NOT NULL,
  data_captura timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.boletos_pendentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boletos_pendentes_insert" ON public.boletos_pendentes;
CREATE POLICY "boletos_pendentes_insert" ON public.boletos_pendentes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "boletos_pendentes_select" ON public.boletos_pendentes;
CREATE POLICY "boletos_pendentes_select" ON public.boletos_pendentes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "boletos_pendentes_admin_all" ON public.boletos_pendentes;
CREATE POLICY "boletos_pendentes_admin_all" ON public.boletos_pendentes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
