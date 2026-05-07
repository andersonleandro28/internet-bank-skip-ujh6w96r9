import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { useBank } from '@/hooks/use-bank'

export function RecentTransactions() {
  const { requisicoes } = useBank()

  const transactions = requisicoes.slice(0, 5).map((req) => ({
    id: req.id,
    title: req.tipo,
    type: 'out',
    category: 'Transação',
    amount: req.valor_total,
    date: req.created_at,
    icon: ArrowUpRight,
    color: 'bg-red-100 text-red-600',
  }))

  return (
    <Card className="border-none shadow-elevation bg-white h-full flex flex-col">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-primary">Transações Recentes</CardTitle>
        <Link to="/extrato" className="text-sm font-medium text-accent hover:underline">
          Ver todas
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-5">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma transação recente.</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110',
                      tx.color,
                    )}
                  >
                    <tx.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary leading-none mb-1 capitalize">
                      {tx.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.category} • {formatDate(tx.date).split(',')[0]}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    'text-sm font-semibold',
                    tx.type === 'in' ? 'text-emerald-600' : 'text-primary',
                  )}
                >
                  {tx.type === 'in' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
