import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCcw } from 'lucide-react'
import { subDays, isAfter, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase/client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { FinanceiroResumo } from '@/components/admin/financeiro/FinanceiroResumo'
import { FinanceiroGraficos } from '@/components/admin/financeiro/FinanceiroGraficos'
import { FinanceiroTabela } from '@/components/admin/financeiro/FinanceiroTabela'

export default function DashboardFinanceiro() {
  const [requisicoes, setRequisicoes] = useState<any[]>([])
  const [clientesMap, setClientesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [periodo, setPeriodo] = useState('30')
  const [servico, setServico] = useState('todos')

  const fetchData = async () => {
    setLoading(true)
    setError(false)
    try {
      const [reqRes, pfRes, pjRes] = await Promise.all([
        supabase
          .from('requisicoes')
          .select('id, tipo, valor, taxa_aplicada, created_at, user_id')
          .eq('status', 'aprovado'),
        supabase.from('usuarios_pf').select('user_id, nome'),
        supabase.from('usuarios_pj').select('user_id, razao_social'),
      ])

      if (reqRes.error) throw reqRes.error

      const nomes: Record<string, string> = {}
      pfRes.data?.forEach((pf) => (nomes[pf.user_id] = pf.nome))
      pjRes.data?.forEach((pj) => (nomes[pj.user_id] = pj.razao_social))

      setClientesMap(nomes)
      setRequisicoes(reqRes.data || [])
    } catch (e) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = useMemo(() => {
    let data = requisicoes

    if (servico !== 'todos') {
      data = data.filter((r) => r.tipo?.toLowerCase() === servico.toLowerCase())
    }

    if (periodo !== 'all') {
      const cutoff = subDays(new Date(), parseInt(periodo))
      data = data.filter((r) => isAfter(parseISO(r.created_at), cutoff))
    }

    return data
  }, [requisicoes, periodo, servico])

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/painel"
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard Financeiro</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>

            <Select value={servico} onValueChange={setServico}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white">
                <SelectValue placeholder="Serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os serviços</SelectItem>
                <SelectItem value="Boleto">Boleto</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="TED">TED</SelectItem>
                <SelectItem value="Carga USDT">Carga USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="hidden sm:flex bg-white"
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-32 w-full bg-white" />
              <Skeleton className="h-32 w-full bg-white" />
              <Skeleton className="h-32 w-full bg-white" />
              <Skeleton className="h-32 w-full bg-white" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-[350px] w-full bg-white" />
              <Skeleton className="h-[350px] w-full bg-white" />
            </div>
            <Skeleton className="h-[400px] w-full bg-white" />
          </div>
        ) : error ? (
          <div className="py-12 text-center flex flex-col items-center">
            <p className="text-red-500 mb-4">Ocorreu um erro ao carregar os dados financeiros.</p>
            <Button onClick={fetchData}>Tentar novamente</Button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <p className="text-slate-500 font-medium">
              Nenhuma transação encontrada para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <FinanceiroResumo data={filteredData} />
            <FinanceiroGraficos data={filteredData} />
            <FinanceiroTabela data={filteredData} clientes={clientesMap} />
          </div>
        )}
      </div>
    </div>
  )
}
