-- Function to trigger the webhook when a new PF or PJ profile is inserted
CREATE OR REPLACE FUNCTION public.trigger_notify_cadastro_pf_pj()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/enviar_email_confirmacao_cadastro';
  payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    payload := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
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

-- Drop and recreate trigger for PF
DROP TRIGGER IF EXISTS on_usuario_pf_inserted_email ON public.usuarios_pf;
CREATE TRIGGER on_usuario_pf_inserted_email
  AFTER INSERT ON public.usuarios_pf
  FOR EACH ROW EXECUTE FUNCTION public.trigger_notify_cadastro_pf_pj();

-- Drop and recreate trigger for PJ
DROP TRIGGER IF EXISTS on_usuario_pj_inserted_email ON public.usuarios_pj;
CREATE TRIGGER on_usuario_pj_inserted_email
  AFTER INSERT ON public.usuarios_pj
  FOR EACH ROW EXECUTE FUNCTION public.trigger_notify_cadastro_pf_pj();
