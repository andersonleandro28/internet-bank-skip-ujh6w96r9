-- Create emails_log
CREATE TABLE IF NOT EXISTS public.emails_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  status text NOT NULL,
  tentativas integer DEFAULT 1,
  proxima_tentativa timestamp with time zone,
  erro text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.emails_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_emails_log" ON public.emails_log;
CREATE POLICY "admin_all_emails_log" ON public.emails_log FOR ALL TO authenticated USING (is_admin());

-- Alter emails_pendentes
ALTER TABLE public.emails_pendentes ADD COLUMN IF NOT EXISTS tipo text;
ALTER TABLE public.emails_pendentes ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE public.emails_pendentes ADD COLUMN IF NOT EXISTS proxima_tentativa timestamp with time zone;

-- Recreate trigger functions for Edge Functions
CREATE OR REPLACE FUNCTION public.trigger_enviar_email_confirmacao_cadastro()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/enviar_email_confirmacao_cadastro';
  payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pendente' THEN
    payload := jsonb_build_object(
      'type', 'INSERT',
      'table', 'usuarios',
      'record', row_to_json(NEW)
    );
    PERFORM net.http_post(
        url := edge_function_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := payload
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_usuario_inserted_notify ON public.usuarios;
CREATE TRIGGER on_usuario_inserted_notify
  AFTER INSERT ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION trigger_enviar_email_confirmacao_cadastro();

CREATE OR REPLACE FUNCTION public.trigger_notify_requisicao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/enviar_email_requisicao_processada';
  payload jsonb;
BEGIN
  IF OLD.status != NEW.status AND NEW.status IN ('aprovado', 'reprovado') THEN
    payload := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'requisicoes',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );
    PERFORM net.http_post(
        url := edge_function_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := payload
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_notify_deposito()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/enviar_email_deposito_creditado';
  payload jsonb;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmado') OR 
     (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'confirmado') THEN
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', 'depositos',
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
    );
    PERFORM net.http_post(
        url := edge_function_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := payload
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_notify_alerta_saldo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/enviar_email_alerta_saldo_baixo';
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

-- Set up cron jobs if pg_cron exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existings to replace safely
    PERFORM cron.unschedule('relatorio_mensal_cron');
    PERFORM cron.unschedule('retry_emails_pendentes_cron');

    PERFORM cron.schedule(
      'relatorio_mensal_cron',
      '0 8 1 * *',
      'SELECT net.http_post(
          url:=''https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/enviar_relatorio_mensal'',
          headers:=''{"Content-Type": "application/json"}''::jsonb
      );'
    );

    PERFORM cron.schedule(
      'retry_emails_pendentes_cron',
      '0 * * * *',
      'SELECT net.http_post(
          url:=''https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/retry_emails_pendentes'',
          headers:=''{"Content-Type": "application/json"}''::jsonb
      );'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignora se pg_cron não estiver habilitado
  NULL;
END $$;
