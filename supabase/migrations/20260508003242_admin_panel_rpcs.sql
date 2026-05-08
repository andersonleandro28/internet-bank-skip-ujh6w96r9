-- Fix RLS Policies for Admins to view all requisicoes and contas
DROP POLICY IF EXISTS "requisicoes_admin_select" ON public.requisicoes;
CREATE POLICY "requisicoes_admin_select" ON public.requisicoes
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "contas_admin_select" ON public.contas;
CREATE POLICY "contas_admin_select" ON public.contas
  FOR SELECT TO authenticated USING (public.is_admin());

-- Fix RLS Policies for Admins to update if needed
DROP POLICY IF EXISTS "requisicoes_admin_update" ON public.requisicoes;
CREATE POLICY "requisicoes_admin_update" ON public.requisicoes
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "usuarios_admin_update" ON public.usuarios;
CREATE POLICY "usuarios_admin_update" ON public.usuarios
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Create RPC to approve user
CREATE OR REPLACE FUNCTION public.aprovar_usuario(p_user_id uuid, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_cesta_id uuid;
BEGIN
  -- Update usuario
  UPDATE public.usuarios SET status = 'aprovado' WHERE id = p_user_id;

  -- Create default cesta if not exists
  IF NOT EXISTS (SELECT 1 FROM public.cestas_clientes WHERE user_id = p_user_id AND nome = 'Cesta Padrão') THEN
    INSERT INTO public.cestas_clientes (user_id, nome, ativo)
    VALUES (p_user_id, 'Cesta Padrão', true)
    RETURNING id INTO v_cesta_id;
  END IF;

  -- Insert auditoria
  INSERT INTO public.auditoria (admin_id, acao, tabela, registro_id)
  VALUES (p_admin_id, 'aprovou_usuario', 'usuarios', p_user_id);
END;
$function$;

-- Create RPC to reject user
CREATE OR REPLACE FUNCTION public.reprovar_usuario(p_user_id uuid, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update usuario
  UPDATE public.usuarios SET status = 'reprovado' WHERE id = p_user_id;

  -- Insert auditoria
  INSERT INTO public.auditoria (admin_id, acao, tabela, registro_id)
  VALUES (p_admin_id, 'reprovou_usuario', 'usuarios', p_user_id);
END;
$function$;

-- Create RPC to approve request
CREATE OR REPLACE FUNCTION public.aprovar_requisicao(req_id uuid, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.requisicoes 
  SET status = 'aprovado', processed_by = p_admin_id, processed_at = NOW()
  WHERE id = req_id;

  -- Insert auditoria
  INSERT INTO public.auditoria (admin_id, acao, tabela, registro_id)
  VALUES (p_admin_id, 'aprovou_requisicao', 'requisicoes', req_id);
END;
$function$;

-- Create RPC to reject request and refund
CREATE OR REPLACE FUNCTION public.reprovar_requisicao(req_id uuid, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_req record;
BEGIN
  -- get the request
  SELECT * INTO v_req FROM public.requisicoes WHERE id = req_id;
  
  IF v_req.status != 'pendente' THEN
    RAISE EXCEPTION 'Requisição não está pendente';
  END IF;

  -- update requisicao
  UPDATE public.requisicoes 
  SET status = 'reprovado', processed_by = p_admin_id, processed_at = NOW()
  WHERE id = req_id;

  -- return balance to the user
  UPDATE public.contas
  SET saldo = saldo + v_req.valor_total
  WHERE user_id = v_req.user_id;

  -- insert auditoria
  INSERT INTO public.auditoria (admin_id, acao, tabela, registro_id)
  VALUES (p_admin_id, 'reprovou_requisicao', 'requisicoes', req_id);
END;
$function$;
