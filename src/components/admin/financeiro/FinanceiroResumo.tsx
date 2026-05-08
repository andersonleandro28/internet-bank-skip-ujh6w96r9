import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ArrowRightLeft, TrendingUp, Percent } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

interface FinanceiroResumoProps {
  data: any[]
}

export function FinanceiroResumo({ data }: FinanceiroResumoProps) {
  const kpis = useMemo(() => {
    const totalReceita = data.reduce((acc, curr) => acc + Number(curr.taxa_aplicada || 0), 0)
    const transacoes = data.length
    const ticketMedio = transacoes > 0 ? totalReceita / transacoes : 0
    const valorTotal = data.reduce((acc, curr) => acc + Number(curr.valor || 0), 0)
    const taxaMedia = valorTotal > 0 ? (totalReceita / valorTotal) * 100 : 0

    return { totalReceita, transacoes, ticketMedio, taxaMedia }
  }, [data])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Receita Total</CardTitle>
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">
            {formatCurrency(kpis.totalReceita)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Soma de todas as taxas</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Transações</CardTitle>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{kpis.transacoes}</div>
          <p className="text-xs text-slate-400 mt-1">Operações aprovadas</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Ticket Médio</CardTitle>
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">
            {formatCurrency(kpis.ticketMedio)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Receita média por transação</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Taxa Média</CardTitle>
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <Percent className="w-4 h-4 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{kpis.taxaMedia.toFixed(2)}%</div>
          <p className="text-xs text-slate-400 mt-1">Em relação ao valor operado</p>
        </CardContent>
      </Card>
    </div>
  )
}
