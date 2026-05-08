ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS limite_alerta_saldo NUMERIC NOT NULL DEFAULT 500;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ultimo_alerta_saldo TIMESTAMPTZ;

-- Recriar a função handle_new_user para suportar o limite
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_limite numeric;
BEGIN
  -- Tenta pegar o limite configurado do admin
  SELECT limite_alerta_saldo INTO v_limite FROM public.usuarios WHERE role = 'admin' LIMIT 1;
  IF v_limite IS NULL THEN
    v_limite := 500;
  END IF;

  INSERT INTO public.usuarios (id, email, role, status, tipo, limite_alerta_saldo)
  VALUES (
    NEW.id, 
    NEW.email, 
    'cliente', 
    'pendente', 
    COALESCE((NEW.raw_user_meta_data->>'tipo'), 'PF')::public.tipo_usuario,
    v_limite
  )
  ON CONFLICT (id) DO UPDATE SET 
    status = 'pendente',
    tipo = EXCLUDED.tipo;
  
  INSERT INTO public.contas (user_id, saldo, saldo_bloqueado)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Trigger para monitorar saldo e disparar alerta
CREATE OR REPLACE FUNCTION public.trigger_notify_alerta_saldo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/notify-alerta-saldo';
  payload jsonb;
  v_limite numeric;
  v_ultimo timestamptz;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.saldo < OLD.saldo THEN
    SELECT limite_alerta_saldo, ultimo_alerta_saldo INTO v_limite, v_ultimo
    FROM public.usuarios WHERE id = NEW.user_id;

    IF NEW.saldo < v_limite AND (v_ultimo IS NULL OR v_ultimo < NOW() - INTERVAL '1 day') THEN
      payload := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'contas',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD),
        'limite', v_limite
      );

      PERFORM net.http_post(
          url := edge_function_url,
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := payload
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_conta_saldo_updated_notify ON public.contas;
CREATE TRIGGER on_conta_saldo_updated_notify
  AFTER UPDATE ON public.contas
  FOR EACH ROW EXECUTE FUNCTION public.trigger_notify_alerta_saldo();
