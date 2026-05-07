DO $$
BEGIN
  -- Insert default services if they do not exist
  INSERT INTO public.servicos (id, nome, descricao, ativo) VALUES
    ('b3b64c89-222a-45c1-8409-775b48154e23'::uuid, 'Boleto', 'Pagamento de boletos', true),
    ('d2b8b931-15cf-4dfd-b4ad-1c5c56b7385a'::uuid, 'PIX', 'Transferências PIX', true),
    ('a1c1d852-32a8-48b2-9df7-22d765873911'::uuid, 'TED', 'Transferências TED', true),
    ('f4b6f123-4567-890a-bcde-f01234567890'::uuid, 'Carga USDT', 'Depósito em Cripto', true)
  ON CONFLICT (nome) DO NOTHING;

  -- Insert taxas_servicos safely for new services
  INSERT INTO public.taxas_servicos (servico_id, percentual, valor_fixo)
  SELECT id, 0, 0 FROM public.servicos
  WHERE id NOT IN (SELECT servico_id FROM public.taxas_servicos);
END $$;

-- Make sure the current seed user is an admin to use the panel
UPDATE public.usuarios SET role = 'admin' WHERE email = 'andersonleandro28@gmail.com';

-- Fix RLS for servicos
DROP POLICY IF EXISTS "servicos_update" ON public.servicos;
CREATE POLICY "servicos_update" ON public.servicos
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Fix RLS for taxas_servicos
DROP POLICY IF EXISTS "taxas_servicos_update" ON public.taxas_servicos;
CREATE POLICY "taxas_servicos_update" ON public.taxas_servicos
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "taxas_servicos_insert" ON public.taxas_servicos;
CREATE POLICY "taxas_servicos_insert" ON public.taxas_servicos
  FOR INSERT TO authenticated WITH CHECK (is_admin());

-- Fix RLS for auditoria
DROP POLICY IF EXISTS "auditoria_insert" ON public.auditoria;
CREATE POLICY "auditoria_insert" ON public.auditoria
  FOR INSERT TO authenticated WITH CHECK (is_admin());
