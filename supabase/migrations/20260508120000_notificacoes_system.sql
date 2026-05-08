-- CREATE TABLE
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('sucesso', 'aviso', 'erro')),
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEX
CREATE INDEX IF NOT EXISTS notificacoes_user_id_idx ON public.notificacoes(user_id);

-- RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notificacoes_select" ON public.notificacoes;
CREATE POLICY "notificacoes_select" ON public.notificacoes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notificacoes_update" ON public.notificacoes;
CREATE POLICY "notificacoes_update" ON public.notificacoes
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- TRIGGER: notify_depositos
CREATE OR REPLACE FUNCTION public.notify_depositos() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
    VALUES (NEW.user_id, 'sucesso', 'Depósito de R$ ' || NEW.valor || ' recebido com sucesso', '/extrato');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deposito_inserted ON public.depositos;
CREATE TRIGGER on_deposito_inserted
  AFTER INSERT ON public.depositos
  FOR EACH ROW EXECUTE FUNCTION public.notify_depositos();

-- TRIGGER: notify_requisicoes_update
CREATE OR REPLACE FUNCTION public.notify_requisicoes_update() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pendente' AND NEW.status = 'aprovado' THEN
    INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
    VALUES (NEW.user_id, 'sucesso', 'Sua requisição de R$ ' || NEW.valor_total || ' foi aprovada', '/extrato');
  ELSIF OLD.status = 'pendente' AND NEW.status = 'reprovado' THEN
    INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
    VALUES (NEW.user_id, 'erro', 'Sua requisição de R$ ' || NEW.valor_total || ' foi reprovada', '/extrato');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_requisicao_updated ON public.requisicoes;
CREATE TRIGGER on_requisicao_updated
  AFTER UPDATE ON public.requisicoes
  FOR EACH ROW EXECUTE FUNCTION public.notify_requisicoes_update();

-- TRIGGER: notify_usuarios_update
CREATE OR REPLACE FUNCTION public.notify_usuarios_update() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pendente' AND NEW.status = 'aprovado' THEN
    INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
    VALUES (NEW.id, 'sucesso', 'Seu cadastro foi aprovado! Bem-vindo', '/perfil');
  ELSIF OLD.status = 'pendente' AND NEW.status = 'reprovado' THEN
    INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
    VALUES (NEW.id, 'erro', 'Seu cadastro foi reprovado', '/perfil');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_usuario_updated ON public.usuarios;
CREATE TRIGGER on_usuario_updated
  AFTER UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.notify_usuarios_update();

-- TRIGGER: notify_admin_new_requisicao
CREATE OR REPLACE FUNCTION public.notify_admin_new_requisicao() RETURNS TRIGGER AS $$
DECLARE
  v_nome text;
BEGIN
  SELECT COALESCE(pf.nome, pj.razao_social, 'Cliente') INTO v_nome
  FROM public.usuarios u
  LEFT JOIN public.usuarios_pf pf ON u.id = pf.user_id
  LEFT JOIN public.usuarios_pj pj ON u.id = pj.user_id
  WHERE u.id = NEW.user_id
  LIMIT 1;

  INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
  SELECT id, 'aviso', 'Nova requisição de ' || v_nome || ' aguardando análise', '/admin/painel'
  FROM public.usuarios WHERE role = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_requisicao_inserted ON public.requisicoes;
CREATE TRIGGER on_requisicao_inserted
  AFTER INSERT ON public.requisicoes
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_requisicao();

-- TRIGGER: notify_admin_new_usuario_pf
CREATE OR REPLACE FUNCTION public.notify_admin_new_usuario_pf() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
  SELECT id, 'aviso', 'Novo cadastro de ' || NEW.nome || ' aguardando aprovação', '/admin/clientes'
  FROM public.usuarios WHERE role = 'admin';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_usuario_pf_inserted ON public.usuarios_pf;
CREATE TRIGGER on_usuario_pf_inserted
  AFTER INSERT ON public.usuarios_pf
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_usuario_pf();

-- TRIGGER: notify_admin_new_usuario_pj
CREATE OR REPLACE FUNCTION public.notify_admin_new_usuario_pj() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notificacoes (user_id, tipo, mensagem, link)
  SELECT id, 'aviso', 'Novo cadastro de ' || NEW.razao_social || ' aguardando aprovação', '/admin/clientes'
  FROM public.usuarios WHERE role = 'admin';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_usuario_pj_inserted ON public.usuarios_pj;
CREATE TRIGGER on_usuario_pj_inserted
  AFTER INSERT ON public.usuarios_pj
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_usuario_pj();

-- ENABLE REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notificacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
  END IF;
END $$;
