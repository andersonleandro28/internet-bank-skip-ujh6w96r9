DO $$
BEGIN
  -- Criação segura de função para requisições de transferência
END $$;

CREATE OR REPLACE FUNCTION public.criar_requisicao_transferencia(
  p_user_id uuid,
  p_tipo text,
  p_valor numeric,
  p_taxa numeric,
  p_metadados jsonb
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_saldo_atual numeric;
  v_novo_saldo numeric;
  v_valor_total numeric;
  v_req_id uuid;
BEGIN
  -- Validação de segurança e integridade
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser maior que zero';
  END IF;

  IF p_taxa < 0 THEN
    RAISE EXCEPTION 'Taxa não pode ser negativa';
  END IF;

  v_valor_total := p_valor + p_taxa;

  -- Bloqueia a conta para evitar condição de corrida
  SELECT saldo INTO v_saldo_atual
  FROM public.contas
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_saldo_atual IS NULL THEN
    RAISE EXCEPTION 'Conta não encontrada';
  END IF;

  v_novo_saldo := v_saldo_atual - v_valor_total;

  IF v_novo_saldo < 0 THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  -- Deduz o saldo, efetivamente bloqueando o valor para a requisição pendente
  UPDATE public.contas
  SET saldo = v_novo_saldo
  WHERE user_id = p_user_id;

  -- Insere a requisição com status pendente para análise pelo Admin
  INSERT INTO public.requisicoes (
    user_id, tipo, valor, taxa_aplicada, valor_total, status, metadados
  ) VALUES (
    p_user_id, p_tipo, p_valor, p_taxa, v_valor_total, 'pendente', p_metadados
  ) RETURNING id INTO v_req_id;

  RETURN jsonb_build_object(
    'requisicao_id', v_req_id,
    'novo_saldo', v_novo_saldo
  );
END;
$function$;
