import { useState } from 'react'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { useBank } from '@/hooks/use-bank'

export function BalanceCard() {
  const [isVisible, setIsVisible] = useState(true)
  const { conta } = useBank()

  const balance = conta?.saldo || 0
  const creditLimit = 8500.0 // mockup
  const invoice = 2150.75 // mockup

  return (
    <Card className="p-6 md:p-8 border-none shadow-elevation bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[100px] -z-10" />
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Disponível</p>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
              {isVisible ? formatCurrency(balance) : 'R$ ••••••'}
            </h2>
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-slate-50"
            >
              {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium">
          <TrendingUp className="w-4 h-4" />
          <span>Rendendo 105% do CDI</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
        <div>
          <p className="text-xs md:text-sm text-muted-foreground mb-1">Fatura Atual</p>
          <p className="text-base md:text-lg font-semibold text-primary">
            {isVisible ? formatCurrency(invoice) : 'R$ ••••••'}
          </p>
        </div>
        <div>
          <p className="text-xs md:text-sm text-muted-foreground mb-1">Limite Disponível</p>
          <p className="text-base md:text-lg font-semibold text-accent">
            {isVisible ? formatCurrency(creditLimit) : 'R$ ••••••'}
          </p>
        </div>
      </div>
    </Card>
  )
}
