-- Fix RLS for signup flow where user might not be authenticated yet (anon)
DROP POLICY IF EXISTS "usuarios_pf_insert" ON public.usuarios_pf;
CREATE POLICY "usuarios_pf_insert" ON public.usuarios_pf FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "usuarios_pj_insert" ON public.usuarios_pj;
CREATE POLICY "usuarios_pj_insert" ON public.usuarios_pj FOR INSERT WITH CHECK (true);
