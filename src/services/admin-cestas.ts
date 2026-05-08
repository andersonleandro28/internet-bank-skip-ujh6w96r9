import { supabase } from '@/lib/supabase/client'

export interface ClientItem {
  id: string
  email: string
  nome: string
  tipo: string
}

export interface Servico {
  id: string
  nome: string
  ativo: boolean
}

export interface CestaItem {
  id?: string
  cesta_id?: string
  servico_id: string
  taxa_percentual: number
  taxa_fixa: number
  ativo: boolean
}

export interface Cesta {
  id: string
  user_id: string
  nome: string
  ativo: boolean
  itens: CestaItem[]
}

export const adminCestasService = {
  async getClientes(): Promise<ClientItem[]> {
    const { data: pfData, error: pfError } = await supabase
      .from('usuarios_pf')
      .select('user_id, nome, usuarios!inner(email, tipo)')

    const { data: pjData, error: pjError } = await supabase
      .from('usuarios_pj')
      .select('user_id, razao_social, usuarios!inner(email, tipo)')

    if (pfError) throw pfError
    if (pjError) throw pjError

    const clientes: ClientItem[] = [
      ...(pfData || []).map((pf: any) => ({
        id: pf.user_id,
        nome: pf.nome,
        email: pf.usuarios?.email || pf.usuarios?.[0]?.email,
        tipo: pf.usuarios?.tipo || pf.usuarios?.[0]?.tipo,
      })),
      ...(pjData || []).map((pj: any) => ({
        id: pj.user_id,
        nome: pj.razao_social,
        email: pj.usuarios?.email || pj.usuarios?.[0]?.email,
        tipo: pj.usuarios?.tipo || pj.usuarios?.[0]?.tipo,
      })),
    ]

    return clientes.sort((a, b) => a.nome.localeCompare(b.nome))
  },

  async getServicos(): Promise<Servico[]> {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    return data || []
  },

  async getCestasPorCliente(userId: string): Promise<Cesta[]> {
    const { data, error } = await supabase
      .from('cestas_clientes')
      .select(`
        *,
        cestas_itens (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((cesta) => ({
      ...cesta,
      itens: cesta.cestas_itens || [],
    }))
  },

  async salvarCesta(cesta: Partial<Cesta>, adminId: string): Promise<Cesta> {
    const isNew = !cesta.id

    const cestaPayload = {
      user_id: cesta.user_id!,
      nome: cesta.nome!,
      ativo: cesta.ativo ?? true,
    } as any

    if (cesta.id) {
      cestaPayload.id = cesta.id
    }

    const { data: cestaData, error: cestaError } = await supabase
      .from('cestas_clientes')
      .upsert(cestaPayload)
      .select()
      .single()

    if (cestaError) throw cestaError

    if (cesta.itens && cesta.itens.length > 0) {
      const itensToUpsert = cesta.itens.map((item) => ({
        ...(item.id ? { id: item.id } : {}),
        cesta_id: cestaData.id,
        servico_id: item.servico_id,
        taxa_percentual: item.taxa_percentual,
        taxa_fixa: item.taxa_fixa,
        ativo: item.ativo,
      }))

      const { error: itensError } = await supabase.from('cestas_itens').upsert(itensToUpsert)

      if (itensError) throw itensError
    }

    await supabase.from('auditoria').insert({
      admin_id: adminId,
      acao: isNew ? 'criou_cesta' : 'alterou_cesta',
      tabela: 'cestas_clientes',
      registro_id: cestaData.id,
    })

    const { data: fullCesta } = await supabase
      .from('cestas_clientes')
      .select(`*, cestas_itens (*)`)
      .eq('id', cestaData.id)
      .single()

    return {
      ...fullCesta,
      itens: fullCesta?.cestas_itens || [],
    } as Cesta
  },
}
