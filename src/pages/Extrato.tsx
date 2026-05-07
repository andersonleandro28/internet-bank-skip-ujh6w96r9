import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, XCircle, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export interface Transaction {
  id: string
  source: 'requisicao' | 'deposito'
  tipo: string
  valor: number
  taxa_aplicada: number
  valor_total: number
  status: string
  created_at: string
}

const TIPOS = ['Todos', 'Boleto', 'PIX', 'TED', 'Carga USDT', 'Depósito']
const PERIODOS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: 'Tudo', days: 0 },
]

export default function Extrato() {
  const { session } = useAuth()
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tipoFiltro, setTipoFiltro] = useState('Todos')
  const [periodoFiltro, setPeriodoFiltro] = useState(30)
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    setError(null)

    try {
      const now = new Date()
      let dateFilter = new Date(0)
      if (periodoFiltro > 0) {
        dateFilter = new Date(now.setDate(now.getDate() - periodoFiltro))
      }

      const [reqsResult, depsResult] = await Promise.all([
        supabase
          .from('requisicoes')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('created_at', dateFilter.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('depositos')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('created_at', dateFilter.toISOString())
          .order('created_at', { ascending: false }),
      ])

      if (reqsResult.error) throw reqsResult.error
      if (depsResult.error) throw depsResult.error

      const requisicoes: Transaction[] = (reqsResult.data || []).map((r) => ({
        id: r.id,
        source: 'requisicao',
        tipo: r.tipo,
        valor: r.valor,
        taxa_aplicada: r.taxa_aplicada,
        valor_total: r.valor_total,
        status: r.status,
        created_at: r.created_at,
      }))

      const depositos: Transaction[] = (depsResult.data || []).map((d) => ({
        id: d.id,
        source: 'deposito',
        tipo: 'Depósito',
        valor: d.valor,
        taxa_aplicada: 0,
        valor_total: d.valor,
        status: d.status,
        created_at: d.created_at,
      }))

      const combined = [...requisicoes, ...depositos].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )

      setData(combined)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar transações.')
    } finally {
      setLoading(false)
    }
  }, [session, periodoFiltro])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [tipoFiltro, periodoFiltro])

  const filteredData = useMemo(() => {
    return data.filter((tx) => {
      if (tipoFiltro !== 'Todos') {
        if (tipoFiltro === 'Depósito' && tx.source !== 'deposito') return false
        if (tipoFiltro !== 'Depósito' && tx.tipo.toLowerCase() !== tipoFiltro.toLowerCase())
          return false
      }
      return true
    })
  }, [data, tipoFiltro])

  const paginatedData = filteredData.slice(0, page * ITEMS_PER_PAGE)
  const hasMore = paginatedData.length < filteredData.length

  const getStatusStyles = (tx: Transaction) => {
    if (tx.source === 'deposito')
      return { border: 'border-l-blue-500', badge: 'bg-blue-500 text-white' }
    if (tx.status === 'aprovado' || tx.status === 'concluido')
      return { border: 'border-l-emerald-500', badge: 'bg-emerald-500 text-white' }
    if (tx.status === 'pendente')
      return { border: 'border-l-amber-500', badge: 'bg-amber-500 text-white' }
    if (tx.status === 'reprovado' || tx.status === 'cancelado')
      return { border: 'border-l-red-500', badge: 'bg-red-500 text-white' }
    return { border: 'border-l-slate-400', badge: 'bg-slate-500 text-white' }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-slate-50 pb-24 font-sans animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-[#8B5CF6] text-white sticky top-0 z-20 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="text-white hover:bg-white/10 hover:text-white -ml-2 rounded-full"
        >
          <Link to="/">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Extrato</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white px-3 py-3 border-b border-slate-100 sticky top-[68px] z-10 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {TIPOS.map((tipo) => (
            <button
              key={tipo}
              onClick={() => setTipoFiltro(tipo)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border',
                tipoFiltro === tipo
                  ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#8B5CF6] hover:text-[#8B5CF6]',
              )}
            >
              {tipo}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto mt-1 pb-1 hide-scrollbar">
          {PERIODOS.map((per) => (
            <button
              key={per.days}
              onClick={() => setPeriodoFiltro(per.days)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border',
                periodoFiltro === per.days
                  ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#8B5CF6] hover:text-[#8B5CF6]',
              )}
            >
              {per.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-3 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-2xl border-l-4 border-slate-200 shadow-subtle flex justify-between items-center"
              >
                <div className="flex gap-3 items-center">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                </div>
                <div className="space-y-2 items-end flex flex-col">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-12 h-4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <XCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-slate-600 mb-4">{error}</p>
            <Button
              onClick={fetchData}
              variant="outline"
              className="text-[#8B5CF6] border-[#8B5CF6] hover:bg-purple-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <FileText className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium text-lg">Nenhuma transação encontrada</p>
            <p className="text-slate-400 text-sm mt-1">Tente alterar os filtros acima.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedData.map((tx) => (
              <Collapsible
                key={tx.id}
                className={cn(
                  'bg-white rounded-2xl shadow-subtle border-l-4 overflow-hidden group',
                  getStatusStyles(tx).border,
                )}
              >
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-slate-50/80',
                        tx.source === 'deposito' ? 'text-blue-500' : 'text-[#8B5CF6]',
                      )}
                    >
                      {tx.source === 'deposito' ? (
                        <ArrowDownRight className="w-6 h-6" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-base font-semibold text-slate-800 capitalize">{tx.tipo}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-base font-bold text-slate-800">
                      {tx.source === 'deposito' ? '+' : '-'}
                      {formatCurrency(tx.valor_total)}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] px-2 py-0.5 rounded font-medium capitalize',
                        getStatusStyles(tx).badge,
                      )}
                    >
                      {tx.status}
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-0 bg-white data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                  <div className="space-y-3 text-sm mt-2 pt-4 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Valor original</span>
                      <span className="text-slate-800 font-medium">{formatCurrency(tx.valor)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Taxa aplicada</span>
                      <span className="text-slate-800 font-medium">
                        {formatCurrency(tx.taxa_aplicada)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Valor total</span>
                      <span className="text-slate-800 font-medium">
                        {formatCurrency(tx.valor_total)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 mt-1 border-t border-slate-50">
                      <span className="text-slate-400">ID da transação</span>
                      <span
                        className="text-slate-400 font-mono text-xs truncate max-w-[150px]"
                        title={tx.id}
                      >
                        {tx.id}
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}

        {hasMore && !loading && !error && (
          <div className="mt-5 mb-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              className="w-full rounded-full text-[#8B5CF6] border-[#8B5CF6] hover:bg-purple-50 hover:text-[#8B5CF6] py-6 text-base font-medium transition-colors"
            >
              Carregar mais
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
