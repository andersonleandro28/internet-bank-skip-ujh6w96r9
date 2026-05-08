import { useState, useEffect, useCallback } from 'react'
import { Check, X, Inbox, Copy, ChevronDown, ChevronUp } from 'lucide-react'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type RequisicaoPendente = {
  id: string
  tipo: string
  valor: number
  taxa_aplicada: number
  valor_total: number
  status: string
  created_at: string
  cliente_nome?: string
  hash_cripto?: string
  rede?: string
  metadados?: any
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copiado para a área de transferência')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 ml-2 hover:bg-slate-200"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-slate-500" />
      )}
    </Button>
  )
}

const MetadataDisplay = ({ req }: { req: RequisicaoPendente }) => {
  const meta = req.metadados || {}

  if (req.tipo === 'pix') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase">Chave PIX</span>
          <div className="flex items-center text-sm font-medium text-slate-800 mt-1">
            {meta.chave_pix || '-'}
            {meta.chave_pix && <CopyButton text={meta.chave_pix} />}
          </div>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase">Favorecido</span>
          <div className="text-sm font-medium text-slate-800 mt-1">{meta.favorecido || '-'}</div>
        </div>
      </div>
    )
  }

  if (req.tipo === 'ted') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase">Banco</span>
          <div className="text-sm font-medium text-slate-800 mt-1">{meta.banco || '-'}</div>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase">Agência</span>
          <div className="flex items-center text-sm font-medium text-slate-800 mt-1">
            {meta.agencia || '-'}
            {meta.agencia && <CopyButton text={meta.agencia} />}
          </div>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase">Conta</span>
          <div className="flex items-center text-sm font-medium text-slate-800 mt-1">
            {meta.conta || '-'}
            {meta.conta && <CopyButton text={meta.conta} />}
          </div>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase">Favorecido</span>
          <div className="text-sm font-medium text-slate-800 mt-1 truncate" title={meta.favorecido}>
            {meta.favorecido || '-'}
          </div>
        </div>
      </div>
    )
  }

  if (req.tipo === 'boleto') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="sm:col-span-2">
          <span className="text-xs text-slate-500 font-medium uppercase">Código de Barras</span>
          <div className="flex items-center text-sm font-mono font-medium text-slate-800 mt-1 break-all">
            {meta.codigo_barras || '-'}
            {meta.codigo_barras && <CopyButton text={meta.codigo_barras} />}
          </div>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase">Beneficiário</span>
          <div className="text-sm font-medium text-slate-800 mt-1">{meta.beneficiario || '-'}</div>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase">Vencimento</span>
          <div className="text-sm font-medium text-slate-800 mt-1">
            {meta.vencimento ? new Date(meta.vencimento).toLocaleDateString('pt-BR') : '-'}
          </div>
        </div>
      </div>
    )
  }

  if (req.tipo === 'carga_usdt') {
    const hash = meta.hash_cripto || req.hash_cripto
    const rede = meta.rede || req.rede
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="sm:col-span-2">
          <span className="text-xs text-slate-500 font-medium uppercase">Carteira USDT</span>
          <div className="flex items-center text-sm font-mono font-medium text-slate-800 mt-1 break-all">
            {hash || '-'}
            {hash && <CopyButton text={hash} />}
          </div>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase">Rede</span>
          <div className="text-sm font-medium text-slate-800 mt-1 capitalize">{rede || '-'}</div>
        </div>
      </div>
    )
  }

  return null
}

export function RequisicoesPendentes() {
  const { user } = useAuth()
  const [requisicoes, setRequisicoes] = useState<RequisicaoPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('pendente')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroData, setFiltroData] = useState('')
  const [expandedReq, setExpandedReq] = useState<string | null>(null)

  const fetchRequisicoes = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('requisicoes')
        .select(`
          id, tipo, valor, taxa_aplicada, valor_total, status, created_at, hash_cripto, rede, metadados,
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
          hash_cripto: r.hash_cripto,
          rede: r.rede,
          metadados: r.metadados,
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

  const handleAprovar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleReprovar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
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

  const toggleExpand = (id: string) => {
    setExpandedReq(expandedReq === id ? null : id)
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
            <Collapsible
              key={req.id}
              open={expandedReq === req.id}
              onOpenChange={() => toggleExpand(req.id)}
            >
              <Card
                className={cn(
                  'overflow-hidden shadow-subtle hover:shadow-md transition-all cursor-pointer',
                  req.status === 'pendente' && 'border-l-4 border-l-yellow-400',
                  req.status === 'aprovado' && 'border-l-4 border-l-green-500',
                  req.status === 'reprovado' && 'border-l-4 border-l-red-500',
                  expandedReq === req.id && 'ring-2 ring-[#8B5CF6]/20',
                )}
              >
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between sm:justify-start gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-800 text-lg">
                              {req.cliente_nome}
                            </span>
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
                          <div className="sm:hidden text-slate-400">
                            {expandedReq === req.id ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-slate-600 border-slate-300 uppercase text-xs"
                          >
                            {req.tipo.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {format(new Date(req.created_at), "dd 'de' MMM 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div>
                            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-medium">
                              Valor Original
                            </div>
                            <div className="font-medium text-slate-700">
                              {formatCurrency(req.valor)}
                            </div>
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

                      <div className="hidden sm:flex items-center text-slate-400 pl-4 border-l border-slate-100">
                        {expandedReq === req.id ? (
                          <ChevronUp className="w-6 h-6" />
                        ) : (
                          <ChevronDown className="w-6 h-6" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-slate-100 pt-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">
                      Detalhes da Operação
                    </h4>

                    <MetadataDisplay req={req} />

                    {req.status === 'pendente' && (
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full mt-6">
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors h-11 px-6 shadow-sm"
                          onClick={(e) => handleReprovar(req.id, e)}
                        >
                          <X className="w-5 h-5 mr-2" /> Reprovar
                        </Button>
                        <Button
                          className="w-full sm:w-auto bg-[#8B5CF6] hover:bg-[#7c3aed] text-white transition-colors h-11 px-6 shadow-sm"
                          onClick={(e) => handleAprovar(req.id, e)}
                        >
                          <Check className="w-5 h-5 mr-2" /> Marcar como Executado
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  )
}
