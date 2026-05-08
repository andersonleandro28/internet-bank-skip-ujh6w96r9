import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  Search,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  Filter,
} from 'lucide-react'

const getActionLabel = (acao: string) => {
  const map: Record<string, string> = {
    aprovou_usuario: 'Cadastro Aprovado',
    reprovou_usuario: 'Cadastro Reprovado',
    aprovou_requisicao: 'Requisição Aprovada',
    reprovou_requisicao: 'Requisição Reprovada',
    depositou_saldo: 'Depósito de Saldo',
    alterou_taxa: 'Alteração de Taxa',
  }
  return map[acao] || acao
}

function AuditCard({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(false)

  const adminName =
    item.admin?.usuarios_pf?.[0]?.nome ||
    item.admin?.usuarios_pj?.[0]?.razao_social ||
    item.admin?.email ||
    'Sistema'

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-4 flex items-center justify-between cursor-pointer bg-white group select-none">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <History className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{getActionLabel(item.acao)}</p>
                <p className="text-sm text-slate-500">
                  Por {adminName} •{' '}
                  {format(new Date(item.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-primary" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
                Tabela Afetada
              </p>
              <Badge variant="secondary" className="font-mono">
                {item.tabela}
              </Badge>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
                ID do Registro
              </p>
              <p className="font-mono text-xs break-all bg-white p-1.5 rounded border border-slate-200 shadow-sm">
                {item.registro_id}
              </p>
            </div>
            {item.taxa_aplicada !== null && (
              <div className="space-y-1">
                <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  Taxa Aplicada
                </p>
                <p className="font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                  {item.taxa_aplicada}%
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default function Auditoria() {
  const [audits, setAudits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('todos')
  const [dateFilter, setDateFilter] = useState('todos')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(handler)
  }, [search])

  const fetchAudits = useCallback(
    async (currentPage: number, append: boolean) => {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('auditoria')
          .select(`
          *,
          admin:usuarios!auditoria_admin_id_fkey(
            email,
            usuarios_pf(nome),
            usuarios_pj(razao_social)
          )
        `)
          .order('timestamp', { ascending: false })

        if (actionFilter !== 'todos') {
          query = query.eq('acao', actionFilter)
        }

        if (dateFilter !== 'todos' && dateFilter !== 'custom') {
          const days = parseInt(dateFilter)
          if (!isNaN(days)) {
            const dateLimit = subDays(new Date(), days).toISOString()
            query = query.gte('timestamp', dateLimit)
          }
        } else if (dateFilter === 'custom' && customDateFrom) {
          query = query.gte('timestamp', new Date(customDateFrom).toISOString())
          if (customDateTo) {
            const toDate = new Date(customDateTo)
            toDate.setHours(23, 59, 59, 999)
            query = query.lte('timestamp', toDate.toISOString())
          }
        }

        const from = currentPage * 20
        const to = from + 19
        query = query.range(from, to)

        const { data, error: err } = await query

        if (err) throw err

        let formattedData = data as any[]

        if (debouncedSearch) {
          formattedData = formattedData.filter((item) => {
            const email = item.admin?.email?.toLowerCase() || ''
            const nome = item.admin?.usuarios_pf?.[0]?.nome?.toLowerCase() || ''
            const razao = item.admin?.usuarios_pj?.[0]?.razao_social?.toLowerCase() || ''
            const term = debouncedSearch.toLowerCase()
            return (
              email.includes(term) ||
              nome.includes(term) ||
              razao.includes(term) ||
              item.registro_id.toLowerCase().includes(term)
            )
          })
        }

        if (append) {
          setAudits((prev) => {
            const newItems = formattedData.filter((d) => !prev.some((p) => p.id === d.id))
            return [...prev, ...newItems]
          })
        } else {
          setAudits(formattedData)
        }

        setHasMore(data.length === 20)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Erro ao carregar auditoria. Tente novamente.')
      } finally {
        setLoading(false)
      }
    },
    [actionFilter, dateFilter, customDateFrom, customDateTo, debouncedSearch],
  )

  useEffect(() => {
    setPage(0)
    fetchAudits(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, dateFilter, customDateFrom, customDateTo, debouncedSearch])

  useEffect(() => {
    if (page > 0) {
      fetchAudits(page, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/painel">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Auditoria</h1>
          <p className="text-sm text-slate-500">Histórico de ações do sistema</p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <Input
              placeholder="Buscar usuário, email ou ID..."
              className="pl-9 bg-white h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[220px] bg-white h-11">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Tipo de Ação" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Ações</SelectItem>
                <SelectItem value="aprovou_usuario">Cadastro Aprovado</SelectItem>
                <SelectItem value="reprovou_usuario">Cadastro Reprovado</SelectItem>
                <SelectItem value="aprovou_requisicao">Requisição Aprovada</SelectItem>
                <SelectItem value="reprovou_requisicao">Requisição Reprovada</SelectItem>
                <SelectItem value="depositou_saldo">Depósito de Saldo</SelectItem>
                <SelectItem value="alterou_taxa">Alteração de Taxa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white h-11">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo o período</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {dateFilter === 'custom' && (
          <div className="px-4 pb-4 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Input
              type="date"
              className="w-[150px] bg-white h-11"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
            />
            <span className="text-slate-400 text-sm font-medium">até</span>
            <Input
              type="date"
              className="w-[150px] bg-white h-11"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
            />
          </div>
        )}
      </Card>

      <div className="min-h-[400px]">
        {loading && page === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-red-100">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">Erro ao carregar</h3>
            <p className="text-slate-500 mb-6 max-w-md">{error}</p>
            <Button
              onClick={() => fetchAudits(0, false)}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Tentar Novamente
            </Button>
          </div>
        ) : audits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <History className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800">Nenhuma ação encontrada</h3>
            <p className="text-slate-500">Altere os filtros ou tente novamente mais tarde.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((item) => (
              <AuditCard key={item.id} item={item} />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-8 pb-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  className="min-w-[200px]"
                >
                  {loading ? 'Carregando...' : 'Carregar mais ações'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
