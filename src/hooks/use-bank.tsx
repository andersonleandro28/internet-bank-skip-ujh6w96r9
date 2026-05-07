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
}

interface BankContextType {
  conta: Conta | null
  requisicoes: Requisicao[]
  refreshData: () => Promise<void>
  loading: boolean
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
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([])
  const [loading, setLoading] = useState(true)

  const refreshData = async () => {
    if (!session?.user?.id) return
    setLoading(true)

    const { data: cData } = await supabase
      .from('contas')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (cData) setConta(cData)

    const { data: rData } = await supabase
      .from('requisicoes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (rData) setRequisicoes(rData as Requisicao[])

    setLoading(false)
  }

  useEffect(() => {
    if (session) {
      refreshData()
    } else {
      setConta(null)
      setRequisicoes([])
      setLoading(false)
    }
  }, [session])

  return (
    <BankContext.Provider value={{ conta, requisicoes, refreshData, loading }}>
      {children}
    </BankContext.Provider>
  )
}
