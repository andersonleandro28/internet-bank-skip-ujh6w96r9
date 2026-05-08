CREATE OR REPLACE FUNCTION public.trigger_notify_deposito()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/notify-deposito';
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
$function$
;

DROP TRIGGER IF EXISTS on_deposito_status_change_notify_email ON public.depositos;
CREATE TRIGGER on_deposito_status_change_notify_email
  AFTER INSERT OR UPDATE ON public.depositos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_notify_deposito();
