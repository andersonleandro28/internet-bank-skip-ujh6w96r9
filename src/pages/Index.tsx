import { BalanceCard } from '@/components/dashboard/balance-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { CreditCardWidget } from '@/components/dashboard/credit-card'
import { useAuth } from '@/hooks/use-auth'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function Index() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const userFirstName =
    user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            Olá, {userFirstName}!
          </h1>
          <p className="text-muted-foreground mt-1">Bem-vindo de volta ao seu NovaBank.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-red-500"
        >
          <LogOut className="w-5 h-5" />
        </Button>
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
