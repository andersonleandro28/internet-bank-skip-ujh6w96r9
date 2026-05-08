DO $$
BEGIN
  -- Tentar criar a extensão pg_cron e pg_net se não existir
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Extensões pg_cron ou pg_net não puderam ser criadas. Algumas hospedagens bloqueiam isso por padrão.';
END $$;

DO $$
BEGIN
  -- Tentar remover o cron anterior se existir
  PERFORM cron.unschedule('relatorio-mensal-job');
EXCEPTION WHEN OTHERS THEN
  -- Ignorar se não existir ou se pg_cron não estiver instalado
END $$;

DO $$
BEGIN
  -- Agendar para todo dia 1º de cada mês às 08:00
  PERFORM cron.schedule(
    'relatorio-mensal-job',
    '0 8 1 * *',
    'SELECT net.http_post(
        url:=''https://hwqaevtrzwfqeldprbsy.supabase.co/functions/v1/relatorio-mensal'',
        headers:=''{"Content-Type": "application/json"}''::jsonb
    )'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Falha ao agendar cron. Certifique-se que pg_cron esta habilitado no banco de dados.';
END $$;
