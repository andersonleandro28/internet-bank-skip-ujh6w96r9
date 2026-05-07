import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { LogOut, RefreshCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useBank } from '@/hooks/use-bank'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'

export default function Index() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { conta, usuario, loading, error, refreshData } = useBank()

  const [animatedBalance, setAnimatedBalance] = useState(0)

  useEffect(() => {
    if (conta?.saldo !== undefined) {
      // Simple count animation
      const duration = 1000
      const steps = 60
      const stepValue = conta.saldo / steps
      let current = 0
      const interval = setInterval(() => {
        current += stepValue
        if (current >= conta.saldo) {
          current = conta.saldo
          clearInterval(interval)
        }
        setAnimatedBalance(current)
      }, duration / steps)

      return () => clearInterval(interval)
    }
  }, [conta?.saldo])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const userFirstName =
    user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
        <Skeleton className="w-full max-w-md h-40 rounded-2xl" />
        <Skeleton className="w-full max-w-md h-32 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-fade-in-up">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">Ops! Algo deu errado.</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={refreshData} className="gap-2 bg-primary text-white">
          <RefreshCcw className="w-4 h-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    )
  }

  if (usuario?.status === 'pendente') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-fade-in-up">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-3">Aguardando aprovação</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Seu cadastro está em análise. Em breve você terá acesso a todas as funcionalidades do seu
          Internet Banking.
        </p>
        <Button variant="outline" onClick={handleLogout} className="w-full max-w-xs h-12">
          Sair
        </Button>
      </div>
    )
  }

  if (usuario?.status === 'reprovado') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-fade-in-up">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <LogOut className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-3">Cadastro reprovado</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Infelizmente não pudemos aprovar sua conta neste momento. Entre em contato com o suporte
          para mais informações.
        </p>
        <Button variant="outline" onClick={handleLogout} className="w-full max-w-xs h-12">
          Sair
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 -m-4 sm:-m-8 pb-20">
      {/* Header */}
      <header className="bg-primary text-white p-6 md:p-10 rounded-b-[2rem] md:rounded-b-[3rem] shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-[100px] -z-0" />
        <div className="flex justify-between items-center relative z-10 mb-8 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="font-bold text-xl tracking-wider">NB</span>
            </div>
            <span className="font-medium text-xl">Olá, {userFirstName}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Balance Card */}
        <div className="bg-white text-primary p-8 rounded-2xl shadow-elevation animate-fade-in-up relative z-10 text-center max-w-md mx-auto w-full mt-4">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Saldo Disponível
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-primary">
            {formatCurrency(animatedBalance)}
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {/* Reservado para implementações futuras - mantendo a interface limpa e focada no saldo */}
      </main>
    </div>
  )
}
