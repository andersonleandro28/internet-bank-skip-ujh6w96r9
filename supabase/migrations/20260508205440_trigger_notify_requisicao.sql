-- Habilita a extensão pg_net para permitir chamadas HTTP (webhooks) a partir do banco de dados
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Função que dispara o webhook para a Edge Function de notificação de requisições
CREATE OR REPLACE FUNCTION public.trigger_notify_requisicao()
RETURNS trigger AS $function$
DECLARE
  edge_function_url text := 'https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/notify-requisicao';
  payload jsonb;
BEGIN
  -- Apenas disparar se o status mudou para aprovado ou reprovado
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
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger caso ele já exista para garantir idempotência na migração
DROP TRIGGER IF EXISTS on_requisicao_status_change_notify_email ON public.requisicoes;

-- Cria o trigger na tabela requisicoes
CREATE TRIGGER on_requisicao_status_change_notify_email
  AFTER UPDATE ON public.requisicoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_requisicao();
