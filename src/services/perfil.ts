import { supabase } from '@/lib/supabase/client'

export const getPerfilUsuario = async (userId: string) => {
  const { data: usuario, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) throw userError

  let detalhes = null

  if (usuario.tipo === 'PF') {
    const { data } = await supabase
      .from('usuarios_pf')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    detalhes = data
  } else {
    const { data } = await supabase
      .from('usuarios_pj')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    detalhes = data
  }

  return { usuario, detalhes }
}

export const getHistoricoLogins = async (userId: string) => {
  const { data, error } = await supabase
    .from('historico_logins' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  // Ignora o erro se a tabela ainda não existir para evitar quebras em ambientes sem a migration rodada
  if (error && error.code !== '42P01') throw error

  return data || []
}

export const getSpreadUSDT = async () => {
  const { data: servico } = await supabase
    .from('servicos')
    .select('id')
    .eq('nome', 'Carga USDT')
    .maybeSingle()

  if (!servico) return 0

  const { data: taxa } = await supabase
    .from('taxas_servicos')
    .select('*')
    .eq('servico_id', servico.id)
    .maybeSingle()

  return taxa?.percentual || 0
}

export const updateSpreadUSDT = async (percentual: number, adminId: string) => {
  const { data: servico } = await supabase
    .from('servicos')
    .select('id')
    .eq('nome', 'Carga USDT')
    .maybeSingle()

  if (!servico) throw new Error('Serviço Carga USDT não encontrado no sistema')

  const { data: taxa } = await supabase
    .from('taxas_servicos')
    .select('id')
    .eq('servico_id', servico.id)
    .maybeSingle()

  let registro_id = servico.id

  if (taxa) {
    registro_id = taxa.id
    const { error } = await supabase.from('taxas_servicos').update({ percentual }).eq('id', taxa.id)
    if (error) throw error
  } else {
    const { data: novaTaxa, error } = await supabase
      .from('taxas_servicos')
      .insert({
        servico_id: servico.id,
        percentual,
        valor_fixo: 0,
        descricao: 'Spread USDT',
      })
      .select('id')
      .single()
    if (error) throw error
    if (novaTaxa) registro_id = novaTaxa.id
  }

  const { error: auditError } = await supabase.from('auditoria').insert({
    admin_id: adminId,
    acao: 'atualizou_spread_usdt',
    tabela: 'taxas_servicos',
    registro_id,
    taxa_aplicada: percentual,
  })

  if (auditError) throw auditError
}
