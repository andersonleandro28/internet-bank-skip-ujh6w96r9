-- Admin full access to cestas_clientes
DROP POLICY IF EXISTS "cestas_clientes_admin_all" ON public.cestas_clientes;
CREATE POLICY "cestas_clientes_admin_all" ON public.cestas_clientes
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Admin full access to cestas_itens
DROP POLICY IF EXISTS "cestas_itens_admin_all" ON public.cestas_itens;
CREATE POLICY "cestas_itens_admin_all" ON public.cestas_itens
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Admin select access to usuarios_pf
DROP POLICY IF EXISTS "usuarios_pf_admin_select" ON public.usuarios_pf;
CREATE POLICY "usuarios_pf_admin_select" ON public.usuarios_pf
  FOR SELECT TO authenticated USING (is_admin());

-- Admin select access to usuarios_pj
DROP POLICY IF EXISTS "usuarios_pj_admin_select" ON public.usuarios_pj;
CREATE POLICY "usuarios_pj_admin_select" ON public.usuarios_pj
  FOR SELECT TO authenticated USING (is_admin());
