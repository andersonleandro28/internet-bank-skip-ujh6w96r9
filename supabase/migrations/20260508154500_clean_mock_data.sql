DO $$
BEGIN
  -- Remover todos os usuários de teste conhecidos (mock)
  DELETE FROM auth.users WHERE email LIKE '%@mock.com';
END $$;
