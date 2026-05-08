import { supabase } from '@/lib/supabase/client'

export type ClienteData = {
  id: string
  email: string
  nome?: string
}

export const getClientes = async (): Promise<{ data: ClienteData[]; error: any }> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      id, 
      email, 
      usuarios_pf ( nome ),
      usuarios_pj ( razao_social )
    `)
    .eq('role', 'cliente')

  if (error) return { data: [], error }

  const clientesFormatados = (data as any[]).map((d) => ({
    id: d.id,
    email: d.email,
    nome: d.usuarios_pf?.[0]?.nome || d.usuarios_pj?.[0]?.razao_social || d.email,
  }))

  return { data: clientesFormatados, error: null }
}

export const getServicos = async () => {
  return await supabase.from('servicos').select('*').eq('ativo', true)
}

export const getCestasByUserId = async (userId: string) => {
  return await supabase
    .from('cestas_clientes')
    .select(`
      id, user_id, nome, ativo, created_at,
      cestas_itens ( id, cesta_id, servico_id, taxa_percentual, taxa_fixa, ativo )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export const criarCesta = async (cesta: any, itens: any[], adminId: string) => {
  const { data: novaCesta, error: erroCesta } = await supabase
    .from('cestas_clientes')
    .insert(cesta)
    .select()
    .single()

  if (erroCesta) throw erroCesta

  if (itens.length > 0) {
    const itensParaInserir = itens.map((i) => ({ ...i, cesta_id: novaCesta.id }))
    const { error: erroItens } = await supabase.from('cestas_itens').insert(itensParaInserir)
    if (erroItens) throw erroItens
  }

  await supabase.from('auditoria').insert({
    acao: 'criou_cesta',
    tabela: 'cestas_clientes',
    registro_id: novaCesta.id,
    admin_id: adminId,
  })

  return novaCesta
}

export const atualizarCesta = async (
  cestaId: string,
  cesta: any,
  itens: any[],
  adminId: string,
) => {
  const { error: erroCesta } = await supabase
    .from('cestas_clientes')
    .update(cesta)
    .eq('id', cestaId)

  if (erroCesta) throw erroCesta

  const { error: erroDel } = await supabase.from('cestas_itens').delete().eq('cesta_id', cestaId)
  if (erroDel) throw erroDel

  if (itens.length > 0) {
    const itensParaInserir = itens.map((i) => ({ ...i, cesta_id: cestaId }))
    const { error: erroItens } = await supabase.from('cestas_itens').insert(itensParaInserir)
    if (erroItens) throw erroItens
  }

  await supabase.from('auditoria').insert({
    acao: 'alterou_cesta',
    tabela: 'cestas_clientes',
    registro_id: cestaId,
    admin_id: adminId,
  })
}
