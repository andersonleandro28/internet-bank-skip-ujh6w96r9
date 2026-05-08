import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { parseISO, format } from 'date-fns'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444']

interface FinanceiroGraficosProps {
  data: any[]
}

export function FinanceiroGraficos({ data }: FinanceiroGraficosProps) {
  const chartServicos = useMemo(() => {
    const agg = data.reduce(
      (acc, curr) => {
        const t = curr.tipo || 'Outros'
        acc[t] = (acc[t] || 0) + Number(curr.taxa_aplicada || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(agg)
      .map(([name, total], i) => ({
        name,
        total,
        fill: COLORS[i % COLORS.length],
      }))
      .sort((a, b) => b.total - a.total)
  }, [data])

  const chartTempo = useMemo(() => {
    const agg = data.reduce(
      (acc, curr) => {
        const d = format(parseISO(curr.created_at), 'yyyy-MM-dd')
        acc[d] = (acc[d] || 0) + Number(curr.taxa_aplicada || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    let acumulado = 0
    return Object.entries(agg)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dailyTotal]) => {
        acumulado += dailyTotal
        return {
          date: format(parseISO(date), 'dd/MM'),
          total: acumulado,
        }
      })
  }, [data])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">
            Receita por Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ total: { label: 'Receita', color: 'hsl(var(--primary))' } }}
            className="h-[300px] w-full"
          >
            <BarChart data={chartServicos} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `R$ ${val}`}
                fontSize={12}
                width={60}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">
            Crescimento de Receita (Acumulado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ total: { label: 'Acumulado', color: 'hsl(var(--primary))' } }}
            className="h-[300px] w-full"
          >
            <LineChart data={chartTempo} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `R$ ${val}`}
                fontSize={12}
                width={60}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
