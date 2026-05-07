import { useEffect, useState } from 'react'
import { LogOut, RefreshCcw, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBank } from '@/hooks/use-bank'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'

export default function Index() {
  const { conta, usuario, loading, error, refreshData } = useBank()

  const [animatedBalance, setAnimatedBalance] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (conta?.saldo !== undefined) {
      const duration = 1000
      const steps = 60
      const stepValue = conta.saldo / steps
      let current = 0

      if (conta.saldo === 0) {
        setAnimatedBalance(0)
        return
      }

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

  if (loading) {
    return (
      <div className="flex flex-col items-center min-h-[80vh] p-5">
        <Skeleton className="w-full max-w-md h-[120px] rounded-[16px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Button onClick={refreshData} className="gap-2 bg-primary text-white hover:bg-primary/90">
          <RefreshCcw className="w-4 h-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    )
  }

  if (usuario?.status === 'pendente') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Aguardando aprovação</h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          Seu cadastro está em análise. Em breve você terá acesso a todas as funcionalidades do seu
          Internet Banking.
        </p>
      </div>
    )
  }

  if (usuario?.status === 'reprovado') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <LogOut className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Cadastro reprovado</h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          Infelizmente não pudemos aprovar sua conta neste momento. Entre em contato com o suporte
          para mais informações.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-md mx-auto">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary to-[#7c3aed] text-white p-6 m-5 rounded-[16px] shadow-lg animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-medium text-white/90">Saldo disponível</p>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-1 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95"
          >
            {isVisible ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
          </button>
        </div>
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">
          {isVisible ? formatCurrency(animatedBalance) : 'R$ ••••••'}
        </h1>
      </div>
    </div>
  )
}
