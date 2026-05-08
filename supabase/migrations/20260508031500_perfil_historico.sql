-- Cria a tabela de histórico de logins para registrar os acessos dos usuários
CREATE TABLE IF NOT EXISTS public.historico_logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    ip TEXT,
    dispositivo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilita RLS
ALTER TABLE public.historico_logins ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "historico_logins_select" ON public.historico_logins;
CREATE POLICY "historico_logins_select" ON public.historico_logins
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "historico_logins_insert" ON public.historico_logins;
CREATE POLICY "historico_logins_insert" ON public.historico_logins
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Garante que o serviço Carga USDT exista para que o Admin possa configurá-lo na tela
DO $$
DECLARE
  v_servico_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.servicos WHERE nome = 'Carga USDT') THEN
    INSERT INTO public.servicos (nome, descricao, ativo)
    VALUES ('Carga USDT', 'Serviço de Carga via USDT', true)
    RETURNING id INTO v_servico_id;
    
    INSERT INTO public.taxas_servicos (servico_id, percentual, valor_fixo, descricao)
    VALUES (v_servico_id, 0, 0, 'Spread USDT');
  END IF;
END $$;
