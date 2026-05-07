import { ShoppingBag, Coffee, ArrowDownRight, ArrowUpRight, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

const transactions = [
  {
    id: 1,
    title: 'Supermercado Extra',
    type: 'out',
    category: 'Alimentação',
    amount: 345.5,
    date: '2023-10-15T14:30:00',
    icon: ShoppingBag,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 2,
    title: 'Transferência Recebida',
    type: 'in',
    category: 'PIX',
    amount: 1500.0,
    date: '2023-10-15T10:15:00',
    icon: ArrowDownRight,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 3,
    title: 'Starbucks',
    type: 'out',
    category: 'Lazer',
    amount: 24.9,
    date: '2023-10-14T16:45:00',
    icon: Coffee,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    id: 4,
    title: 'Pagamento Fatura',
    type: 'out',
    category: 'Pagamento',
    amount: 850.0,
    date: '2023-10-13T09:00:00',
    icon: ArrowUpRight,
    color: 'bg-red-100 text-red-600',
  },
  {
    id: 5,
    title: 'Conta de Luz',
    type: 'out',
    category: 'Contas',
    amount: 185.2,
    date: '2023-10-12T11:20:00',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-600',
  },
]

export function RecentTransactions() {
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
          {transactions.map((tx) => (
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
                  <p className="text-sm font-medium text-primary leading-none mb-1">{tx.title}</p>
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
