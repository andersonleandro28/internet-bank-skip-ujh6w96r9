CREATE OR REPLACE FUNCTION public.inserir_transacao_atomicamente(
  p_user_id uuid,
  p_valor numeric,
  p_taxa numeric,
  p_desc_op text,
  p_desc_taxa text,
  p_descricao_extra text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_saldo_atual numeric;
  v_id_operacao uuid;
  v_id_taxa uuid;
  v_novo_saldo numeric;
BEGIN
  -- Bloqueia a conta para concorrência
  SELECT saldo INTO v_saldo_atual
  FROM public.contas
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_saldo_atual IS NULL THEN
    RAISE EXCEPTION 'Conta não encontrada';
  END IF;

  v_novo_saldo := v_saldo_atual - p_valor - p_taxa;

  IF v_novo_saldo < 0 THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  -- Inserir operação
  INSERT INTO public.transacoes (
    user_id, tipo, transacao_pai_id, descricao, descricao_taxa, valor,
    tipo_movimento, saldo_anterior, saldo_posterior, status, data_operacao
  ) VALUES (
    p_user_id, 'operacao', null, COALESCE(p_descricao_extra, p_desc_op), null, p_valor,
    'saida', v_saldo_atual, v_novo_saldo, 'concluido', now()
  ) RETURNING id INTO v_id_operacao;

  -- Inserir taxa
  INSERT INTO public.transacoes (
    user_id, tipo, transacao_pai_id, descricao, descricao_taxa, valor,
    tipo_movimento, saldo_anterior, saldo_posterior, status, data_operacao
  ) VALUES (
    p_user_id, 'taxa', v_id_operacao, COALESCE(p_descricao_extra, p_desc_op), p_desc_taxa, p_taxa,
    'saida', v_saldo_atual - p_valor, v_novo_saldo, 'concluido', now()
  ) RETURNING id INTO v_id_taxa;

  -- Atualizar conta
  UPDATE public.contas
  SET saldo = v_novo_saldo
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'operacao_id', v_id_operacao,
    'taxa_id', v_id_taxa,
    'novo_saldo', v_novo_saldo
  );
END;
$function$;
