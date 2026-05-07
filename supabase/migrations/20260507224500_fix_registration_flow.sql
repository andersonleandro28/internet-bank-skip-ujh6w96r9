-- Adicionar políticas para permitir inserção defensiva pelo frontend (usuários recém-registrados que ainda não confirmaram e-mail)
DROP POLICY IF EXISTS "usuarios_insert" ON public.usuarios;
CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "contas_insert" ON public.contas;
CREATE POLICY "contas_insert" ON public.contas FOR INSERT WITH CHECK (true);

-- Garantir que a trigger existe para inserções no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, role, status, tipo)
  VALUES (
    NEW.id, 
    NEW.email, 
    'cliente', 
    'pendente', 
    COALESCE((NEW.raw_user_meta_data->>'tipo'), 'PF')::public.tipo_usuario
  )
  ON CONFLICT (id) DO UPDATE SET 
    status = 'pendente',
    tipo = EXCLUDED.tipo;
  
  INSERT INTO public.contas (user_id, saldo, saldo_bloqueado)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
