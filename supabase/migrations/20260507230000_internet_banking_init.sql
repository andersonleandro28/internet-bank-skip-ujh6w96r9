DO $BODY$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario') THEN
    CREATE TYPE tipo_usuario AS ENUM ('PF', 'PJ');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_usuario') THEN
    CREATE TYPE status_usuario AS ENUM ('pendente', 'aprovado', 'reprovado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_usuario') THEN
    CREATE TYPE role_usuario AS ENUM ('cliente', 'admin');
  END IF;
END
$BODY$;

CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  tipo tipo_usuario NOT NULL DEFAULT 'PF',
  status status_usuario NOT NULL DEFAULT 'pendente',
  role role_usuario NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usuarios_pf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  data_nascimento DATE,
  selfie_url TEXT
);

CREATE TABLE IF NOT EXISTS public.usuarios_pj (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  razao_social TEXT NOT NULL,
  documentos_url TEXT
);

CREATE TABLE IF NOT EXISTS public.contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  saldo NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_bloqueado NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.taxas_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID REFERENCES public.servicos(id) ON DELETE CASCADE NOT NULL,
  percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
  valor_fixo NUMERIC(12,2) NOT NULL DEFAULT 0,
  descricao TEXT
);

CREATE TABLE IF NOT EXISTS public.cestas_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cestas_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cesta_id UUID REFERENCES public.cestas_clientes(id) ON DELETE CASCADE NOT NULL,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE CASCADE NOT NULL,
  taxa_percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
  taxa_fixa NUMERIC(12,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.requisicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  taxa_aplicada NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  hash_cripto TEXT,
  rede TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.usuarios(id)
);

CREATE TABLE IF NOT EXISTS public.favorecidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  chave_pix TEXT,
  conta TEXT,
  agencia TEXT,
  banco TEXT,
  nome TEXT NOT NULL,
  salvo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.depositos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.usuarios(id),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.usuarios(id),
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id UUID NOT NULL,
  taxa_aplicada NUMERIC(12,2),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Handle New User Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $func$
BEGIN
  INSERT INTO public.usuarios (id, email, role, status)
  VALUES (NEW.id, NEW.email, 'cliente', 'aprovado')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.contas (user_id, saldo, saldo_bloqueado)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT TO authenticated USING (id = auth.uid() OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE TO authenticated USING (id = auth.uid());

ALTER TABLE public.usuarios_pf ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_pf_select" ON public.usuarios_pf;
CREATE POLICY "usuarios_pf_select" ON public.usuarios_pf FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "usuarios_pf_insert" ON public.usuarios_pf;
CREATE POLICY "usuarios_pf_insert" ON public.usuarios_pf FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "usuarios_pf_update" ON public.usuarios_pf;
CREATE POLICY "usuarios_pf_update" ON public.usuarios_pf FOR UPDATE TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.usuarios_pj ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_pj_select" ON public.usuarios_pj;
CREATE POLICY "usuarios_pj_select" ON public.usuarios_pj FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "usuarios_pj_insert" ON public.usuarios_pj;
CREATE POLICY "usuarios_pj_insert" ON public.usuarios_pj FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "usuarios_pj_update" ON public.usuarios_pj;
CREATE POLICY "usuarios_pj_update" ON public.usuarios_pj FOR UPDATE TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contas_select" ON public.contas;
CREATE POLICY "contas_select" ON public.contas FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "contas_update" ON public.contas;
CREATE POLICY "contas_update" ON public.contas FOR UPDATE TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "servicos_select" ON public.servicos;
CREATE POLICY "servicos_select" ON public.servicos FOR SELECT TO authenticated USING (true);

ALTER TABLE public.taxas_servicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "taxas_servicos_select" ON public.taxas_servicos;
CREATE POLICY "taxas_servicos_select" ON public.taxas_servicos FOR SELECT TO authenticated USING (true);

ALTER TABLE public.cestas_clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cestas_clientes_select" ON public.cestas_clientes;
CREATE POLICY "cestas_clientes_select" ON public.cestas_clientes FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.cestas_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cestas_itens_select" ON public.cestas_itens;
CREATE POLICY "cestas_itens_select" ON public.cestas_itens FOR SELECT TO authenticated USING (
  cesta_id IN (SELECT id FROM public.cestas_clientes WHERE user_id = auth.uid())
);

ALTER TABLE public.requisicoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "requisicoes_select" ON public.requisicoes;
CREATE POLICY "requisicoes_select" ON public.requisicoes FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "requisicoes_insert" ON public.requisicoes;
CREATE POLICY "requisicoes_insert" ON public.requisicoes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

ALTER TABLE public.favorecidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorecidos_select" ON public.favorecidos;
CREATE POLICY "favorecidos_select" ON public.favorecidos FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "favorecidos_insert" ON public.favorecidos;
CREATE POLICY "favorecidos_insert" ON public.favorecidos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

ALTER TABLE public.depositos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "depositos_select" ON public.depositos;
CREATE POLICY "depositos_select" ON public.depositos FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "depositos_insert" ON public.depositos;
CREATE POLICY "depositos_insert" ON public.depositos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- Seed Data
DO $SEED$
DECLARE
  v_admin_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_ana_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
  v_carlos_id UUID := '00000000-0000-0000-0000-000000000003'::uuid;
  v_mariana_id UUID := '00000000-0000-0000-0000-000000000004'::uuid;
  
  v_srv_boleto UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  v_srv_pix UUID := '22222222-2222-2222-2222-222222222222'::uuid;
  v_srv_ted UUID := '33333333-3333-3333-3333-333333333333'::uuid;
  v_srv_usdt UUID := '44444444-4444-4444-4444-444444444444'::uuid;
BEGIN
  -- Services & Rates
  INSERT INTO public.servicos (id, nome, descricao, ativo) VALUES
    (v_srv_boleto, 'Boleto', 'Pagamento por boleto', true),
    (v_srv_pix, 'PIX', 'Transferência instantânea', true),
    (v_srv_ted, 'TED', 'Transferência Eletrônica Disponível', true),
    (v_srv_usdt, 'Carga USDT', 'Depósito em Cripto USDT', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.taxas_servicos (servico_id, percentual, valor_fixo, descricao) VALUES
    (v_srv_boleto, 2.0, 0, 'Taxa Boleto 2%'),
    (v_srv_pix, 1.0, 0, 'Taxa PIX 1%'),
    (v_srv_ted, 3.0, 0, 'Taxa TED 3%'),
    (v_srv_usdt, 2.0, 0, 'Taxa USDT 2%')
  ON CONFLICT DO NOTHING;

  -- Create Users in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'andersonleandro28@gmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'andersonleandro28@gmail.com', crypt('Skip@Pass', gen_salt('bf')), NOW(),
      NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Admin"}',
      false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''
    );
    UPDATE public.usuarios SET role = 'admin' WHERE id = v_admin_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ana@mock.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_ana_id, '00000000-0000-0000-0000-000000000000', 'ana@mock.com', crypt('Skip@Pass', gen_salt('bf')), NOW(),
      NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Ana Silva"}',
      false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''
    );
    INSERT INTO public.usuarios_pf (user_id, cpf, nome) VALUES (v_ana_id, '111.111.111-11', 'Ana Silva') ON CONFLICT DO NOTHING;
    UPDATE public.contas SET saldo = 15000 WHERE user_id = v_ana_id;
    INSERT INTO public.cestas_clientes (id, user_id, nome) VALUES (gen_random_uuid(), v_ana_id, 'Cesta Padrão Ana');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'carlos@mock.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_carlos_id, '00000000-0000-0000-0000-000000000000', 'carlos@mock.com', crypt('Skip@Pass', gen_salt('bf')), NOW(),
      NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Carlos Oliveira"}',
      false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''
    );
    UPDATE public.usuarios SET tipo = 'PJ' WHERE id = v_carlos_id;
    INSERT INTO public.usuarios_pj (user_id, cnpj, razao_social) VALUES (v_carlos_id, '22.222.222/0001-22', 'Carlos Oliveira ME') ON CONFLICT DO NOTHING;
    UPDATE public.contas SET saldo = 85000 WHERE user_id = v_carlos_id;
    INSERT INTO public.cestas_clientes (id, user_id, nome) VALUES (gen_random_uuid(), v_carlos_id, 'Cesta Padrão Carlos');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mariana@mock.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_mariana_id, '00000000-0000-0000-0000-000000000000', 'mariana@mock.com', crypt('Skip@Pass', gen_salt('bf')), NOW(),
      NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Mariana Santos"}',
      false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''
    );
    INSERT INTO public.usuarios_pf (user_id, cpf, nome) VALUES (v_mariana_id, '333.333.333-33', 'Mariana Santos') ON CONFLICT DO NOTHING;
    UPDATE public.contas SET saldo = 3400 WHERE user_id = v_mariana_id;
    INSERT INTO public.cestas_clientes (id, user_id, nome) VALUES (gen_random_uuid(), v_mariana_id, 'Cesta Padrão Mariana');
  END IF;

END
$SEED$;
