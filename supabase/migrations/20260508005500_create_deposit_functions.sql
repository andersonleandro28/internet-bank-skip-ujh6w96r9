-- Function to perform deposit securely
CREATE OR REPLACE FUNCTION public.realizar_deposito(p_cliente_id uuid, p_valor numeric, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_deposito_id uuid;
BEGIN
  -- Verify if caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Update account balance
  UPDATE public.contas
  SET saldo = saldo + p_valor
  WHERE user_id = p_cliente_id;

  -- Insert deposit record
  INSERT INTO public.depositos (admin_id, user_id, valor, status, confirmed_at)
  VALUES (p_admin_id, p_cliente_id, p_valor, 'confirmado', NOW())
  RETURNING id INTO v_deposito_id;

  -- Insert audit log
  INSERT INTO public.auditoria (admin_id, acao, tabela, registro_id)
  VALUES (p_admin_id, 'depositou_saldo', 'depositos', v_deposito_id);
END;
$function$;
