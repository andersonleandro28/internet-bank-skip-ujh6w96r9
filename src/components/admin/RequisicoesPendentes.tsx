import { useState, useEffect, useCallback } from 'react'
import { Check, X, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase/client'
import { aprovarRequisicao, reprovarRequisicao } from '@/services/admin'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'

type RequisicaoPendente = {
  id: string
  tipo: string
  valor: number
  taxa_aplicada: number
  valor_total: number
  status: string
  created_at: string
  cliente_nome?: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function RequisicoesPendentes() {
  const { user } = useAuth()
  const [requisicoes, setRequisicoes] = useState<RequisicaoPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('pendente')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroData, setFiltroData] = useState('')

  const fetchRequisicoes = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('requisicoes')
        .select(`
          id, tipo, valor, taxa_aplicada, valor_total, status, created_at,
          usuarios!requisicoes_user_id_fkey(
            tipo,
            usuarios_pf(nome),
            usuarios_pj(razao_social)
          )
        `)
        .order('created_at', { ascending: false })

      if (filtroStatus !== 'todos') query = query.eq('status', filtroStatus)
      if (filtroTipo !== 'todos') query = query.eq('tipo', filtroTipo)
      if (filtroData) {
        const startDate = new Date(filtroData)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(filtroData)
        endDate.setHours(23, 59, 59, 999)
        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      const formatados = (data || []).map((r: any) => {
        const u = r.usuarios
        const isPF = u?.tipo === 'PF'
        const nome = isPF ? u?.usuarios_pf?.[0]?.nome : u?.usuarios_pj?.[0]?.razao_social
        return {
          id: r.id,
          tipo: r.tipo,
          valor: r.valor,
          taxa_aplicada: r.taxa_aplicada,
          valor_total: r.valor_total,
          status: r.status,
          created_at: r.created_at,
          cliente_nome: nome || 'Cliente não encontrado',
        }
      })
      setRequisicoes(formatados)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar requisições')
    } finally {
      setLoading(false)
    }
  }, [filtroStatus, filtroTipo, filtroData])

  useEffect(() => {
    fetchRequisicoes()
  }, [fetchRequisicoes])

  const handleAprovar = async (id: string) => {
    if (!user) return
    try {
      await aprovarRequisicao(id, user.id)
      toast.success('Requisição executada com sucesso')
      fetchRequisicoes()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao aprovar requisição')
    }
  }

  const handleReprovar = async (id: string) => {
    if (!user) return
    try {
      await reprovarRequisicao(id, user.id)
      toast.success('Requisição reprovada e saldo estornado')
      fetchRequisicoes()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao reprovar requisição')
    }
  }

  const statuses = [
    { value: 'todos', label: 'Todos os Status' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'aprovado', label: 'Aprovados' },
    { value: 'reprovado', label: 'Reprovados' },
  ]

  const tipos = [
    { value: 'todos', label: 'Todos os Tipos' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'pix', label: 'PIX' },
    { value: 'ted', label: 'TED' },
    { value: 'carga_usdt', label: 'Carga USDT' },
  ]

  return (
    <div className="space-y-6">
      <div className="px-3 sm:px-6 space-y-4">
        <div className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setFiltroStatus(s.value)}
              className={cn(
                'px-5 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
                filtroStatus === s.value
                  ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#8B5CF6] hover:text-[#8B5CF6]',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tipos.map((t) => (
            <button
              key={t.value}
              onClick={() => setFiltroTipo(t.value)}
              className={cn(
                'px-5 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
                filtroTipo === t.value
                  ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#8B5CF6] hover:text-[#8B5CF6]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="max-w-[200px] bg-white border-slate-200 focus-visible:ring-[#8B5CF6] rounded-xl h-11"
          />
          {filtroData && (
            <Button
              variant="ghost"
              onClick={() => setFiltroData('')}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Limpar Data
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 px-3 sm:px-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl bg-white" />
          ))}
        </div>
      ) : requisicoes.length === 0 ? (
        <div className="px-3 sm:px-6">
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">Nenhuma requisição encontrada</h3>
            <p className="text-slate-500">Não há transações pendentes com os filtros atuais.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 px-3 sm:px-6">
          {requisicoes.map((req) => (
            <Card
              key={req.id}
              className={cn(
                'overflow-hidden shadow-subtle hover:shadow-md transition-all',
                req.status === 'pendente' && 'border-l-4 border-l-yellow-400',
                req.status === 'aprovado' && 'border-l-4 border-l-green-500',
                req.status === 'reprovado' && 'border-l-4 border-l-red-500',
              )}
            >
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800 text-lg">{req.cliente_nome}</span>
                    <Badge
                      className={cn(
                        'text-white border-transparent px-2 py-0.5 text-xs font-medium uppercase shadow-none',
                        req.status === 'pendente' && 'bg-yellow-500 hover:bg-yellow-600',
                        req.status === 'aprovado' && 'bg-green-500 hover:bg-green-600',
                        req.status === 'reprovado' && 'bg-red-500 hover:bg-red-600',
                      )}
                    >
                      {req.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-slate-600 border-slate-300 uppercase text-xs"
                    >
                      {req.tipo.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      {format(new Date(req.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-medium">
                        Valor Original
                      </div>
                      <div className="font-medium text-slate-700">{formatCurrency(req.valor)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-medium">
                        Taxa Aplicada
                      </div>
                      <div className="font-medium text-red-500">
                        {formatCurrency(req.taxa_aplicada)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-medium">
                        Valor Total
                      </div>
                      <div className="font-bold text-[#8B5CF6]">
                        {formatCurrency(req.valor_total)}
                      </div>
                    </div>
                  </div>
                </div>

                {req.status === 'pendente' && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button
                      className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white transition-colors h-11 px-6 shadow-sm"
                      onClick={() => handleReprovar(req.id)}
                    >
                      <X className="w-5 h-5 mr-2" /> Reprovar
                    </Button>
                    <Button
                      className="w-full sm:w-auto bg-[#8B5CF6] hover:bg-[#7c3aed] text-white transition-colors h-11 px-6 shadow-sm"
                      onClick={() => handleAprovar(req.id)}
                    >
                      <Check className="w-5 h-5 mr-2" /> Executado
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
