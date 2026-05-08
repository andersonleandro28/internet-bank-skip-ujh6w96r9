CREATE OR REPLACE FUNCTION public.admin_update_user_email(p_user_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE auth.users
  SET email = p_email
  WHERE id = p_user_id;

  UPDATE public.usuarios
  SET email = p_email
  WHERE id = p_user_id;
END;
$function$;
