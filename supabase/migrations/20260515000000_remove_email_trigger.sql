-- Desabilita a trigger que enviaria o e-mail via banco, já que agora o frontend chama a Edge Function diretamente.
DROP TRIGGER IF EXISTS on_usuario_inserted_notify ON public.usuarios;
DROP FUNCTION IF EXISTS public.trigger_enviar_email_confirmacao_cadastro();
