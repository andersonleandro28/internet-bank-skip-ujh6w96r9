import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

const data = [
  { date: 'Seg', amount: 120 },
  { date: 'Ter', amount: 450 },
  { date: 'Qua', amount: 200 },
  { date: 'Qui', amount: 800 },
  { date: 'Sex', amount: 350 },
  { date: 'Sáb', amount: 600 },
  { date: 'Dom', amount: 150 },
]

export function SpendingChart() {
  return (
    <Card className="border-none shadow-elevation bg-white h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary">Gastos da Semana</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickFormatter={(value) => `R$${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-100 p-3 rounded-lg shadow-lg">
                        <p className="text-sm font-medium text-slate-500 mb-1">
                          {payload[0].payload.date}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--accent))"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorAmount)"
                activeDot={{ r: 6, fill: 'hsl(var(--accent))', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
