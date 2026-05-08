import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'

export interface Conta {
  id: string
  saldo: number
  saldo_bloqueado: number
}

export interface Requisicao {
  id: string
  tipo: string
  valor: number
  taxa_aplicada: number
  valor_total: number
  status: string
  created_at: string
  metadados?: any
}

export interface UsuarioInfo {
  status: 'pendente' | 'aprovado' | 'reprovado'
}

interface BankContextType {
  conta: Conta | null
  usuario: UsuarioInfo | null
  requisicoes: Requisicao[]
  refreshData: () => Promise<void>
  loading: boolean
  error: string | null
}

const BankContext = createContext<BankContextType | undefined>(undefined)

export const useBank = () => {
  const context = useContext(BankContext)
  if (!context) throw new Error('useBank must be used within a BankProvider')
  return context
}

export const BankProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth()
  const [conta, setConta] = useState<Conta | null>(null)
  const [usuario, setUsuario] = useState<UsuarioInfo | null>(null)
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshData = async () => {
    if (!session?.user?.id) return
    setLoading(true)
    setError(null)

    try {
      const { data: uData, error: uError } = await supabase
        .from('usuarios')
        .select('status')
        .eq('id', session.user.id)
        .single()

      if (uError) throw uError
      if (uData) setUsuario(uData as UsuarioInfo)

      const { data: cData, error: cError } = await supabase
        .from('contas')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (cError && cError.code !== 'PGRST116') throw cError // Ignore no rows error
      if (cData) setConta(cData)

      const { data: rData, error: rError } = await supabase
        .from('requisicoes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (rError) throw rError
      if (rData) setRequisicoes(rData as Requisicao[])
    } catch (err: any) {
      console.error('Erro ao buscar dados do banco:', err)
      setError(err.message || 'Erro ao carregar os dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      refreshData()
    } else {
      setConta(null)
      setUsuario(null)
      setRequisicoes([])
      setLoading(false)
      setError(null)
    }
  }, [session])

  return (
    <BankContext.Provider value={{ conta, usuario, requisicoes, refreshData, loading, error }}>
      {children}
    </BankContext.Provider>
  )
}
