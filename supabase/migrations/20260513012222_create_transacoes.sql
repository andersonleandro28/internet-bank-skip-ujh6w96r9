CREATE TABLE IF NOT EXISTS public.transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('operacao', 'taxa')),
  transacao_pai_id UUID REFERENCES public.transacoes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  descricao_taxa TEXT,
  valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
  tipo_movimento TEXT NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida')),
  saldo_anterior NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_posterior NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'cancelado')),
  data_operacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transacoes_user_id_idx ON public.transacoes USING btree (user_id);
CREATE INDEX IF NOT EXISTS transacoes_transacao_pai_id_idx ON public.transacoes USING btree (transacao_pai_id);
CREATE INDEX IF NOT EXISTS transacoes_data_operacao_idx ON public.transacoes USING btree (data_operacao);
CREATE INDEX IF NOT EXISTS transacoes_status_idx ON public.transacoes USING btree (status);

ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transacoes_select" ON public.transacoes;
CREATE POLICY "transacoes_select" ON public.transacoes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "transacoes_insert" ON public.transacoes;
CREATE POLICY "transacoes_insert" ON public.transacoes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "transacoes_update" ON public.transacoes;
CREATE POLICY "transacoes_update" ON public.transacoes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status != 'concluido')
  WITH CHECK (user_id = auth.uid() AND status != 'concluido');

DROP POLICY IF EXISTS "transacoes_delete" ON public.transacoes;
CREATE POLICY "transacoes_delete" ON public.transacoes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'cancelado');

DO $$
DECLARE
  v_user_id UUID;
  v_op1_id UUID := gen_random_uuid();
  v_op2_id UUID := gen_random_uuid();
  v_op3_id UUID := gen_random_uuid();
BEGIN
  -- Insert or get seed user
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andersonleandro28@gmail.com' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'andersonleandro28@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Anderson Leandro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

  -- Ensure public.usuarios exists
  INSERT INTO public.usuarios (id, email, role, status, tipo)
  VALUES (v_user_id, 'andersonleandro28@gmail.com', 'cliente', 'aprovado', 'PF')
  ON CONFLICT (id) DO UPDATE SET status = 'aprovado';

  -- Seed mock transactions if table is empty for this user
  IF NOT EXISTS (SELECT 1 FROM public.transacoes WHERE user_id = v_user_id) THEN
    -- 1. PIX Enviado
    INSERT INTO public.transacoes (id, user_id, tipo, transacao_pai_id, descricao, valor, tipo_movimento, saldo_anterior, saldo_posterior, status, data_operacao)
    VALUES (v_op1_id, v_user_id, 'operacao', NULL, 'PIX Enviado', 500.00, 'saida', 2000.00, 1500.00, 'concluido', NOW() - INTERVAL '3 days');
    
    INSERT INTO public.transacoes (id, user_id, tipo, transacao_pai_id, descricao, descricao_taxa, valor, tipo_movimento, saldo_anterior, saldo_posterior, status, data_operacao)
    VALUES (gen_random_uuid(), v_user_id, 'taxa', v_op1_id, 'Taxa de PIX', 'PIX', 2.50, 'saida', 1500.00, 1497.50, 'concluido', NOW() - INTERVAL '3 days');

    -- 2. Boleto Pago
    INSERT INTO public.transacoes (id, user_id, tipo, transacao_pai_id, descricao, valor, tipo_movimento, saldo_anterior, saldo_posterior, status, data_operacao)
    VALUES (v_op2_id, v_user_id, 'operacao', NULL, 'Boleto Pago', 1200.00, 'saida', 1497.50, 297.50, 'concluido', NOW() - INTERVAL '2 days');
    
    INSERT INTO public.transacoes (id, user_id, tipo, transacao_pai_id, descricao, descricao_taxa, valor, tipo_movimento, saldo_anterior, saldo_posterior, status, data_operacao)
    VALUES (gen_random_uuid(), v_user_id, 'taxa', v_op2_id, 'Taxa de Boleto', 'Boleto', 5.00, 'saida', 297.50, 292.50, 'concluido', NOW() - INTERVAL '2 days');

    -- 3. Recarga Cartão
    INSERT INTO public.transacoes (id, user_id, tipo, transacao_pai_id, descricao, valor, tipo_movimento, saldo_anterior, saldo_posterior, status, data_operacao)
    VALUES (v_op3_id, v_user_id, 'operacao', NULL, 'Recarga Cartão', 300.00, 'saida', 292.50, -7.50, 'concluido', NOW() - INTERVAL '1 day');
    
    INSERT INTO public.transacoes (id, user_id, tipo, transacao_pai_id, descricao, descricao_taxa, valor, tipo_movimento, saldo_anterior, saldo_posterior, status, data_operacao)
    VALUES (gen_random_uuid(), v_user_id, 'taxa', v_op3_id, 'Taxa de Recarga Cartão', 'Cartão', 1.50, 'saida', -7.50, -9.00, 'concluido', NOW() - INTERVAL '1 day');
  END IF;
END $$;
