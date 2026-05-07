import { BalanceCard } from '@/components/dashboard/balance-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { CreditCardWidget } from '@/components/dashboard/credit-card'

export default function Index() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Olá, João!</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo de volta ao seu NovaBank.</p>
        </div>
      </div>

      <BalanceCard />

      <section>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 px-1">
          Acesso Rápido
        </h3>
        <QuickActions />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
          <SpendingChart />
        </div>
        <div className="flex flex-col gap-6 md:gap-8">
          <CreditCardWidget />
          <div className="flex-1">
            <RecentTransactions />
          </div>
        </div>
      </div>
    </div>
  )
}
