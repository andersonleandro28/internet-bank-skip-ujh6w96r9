import { Copy, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export function CreditCardWidget() {
  const { toast } = useToast()

  const copyCardNumber = () => {
    navigator.clipboard.writeText('5432 1234 5678 9012')
    toast({
      title: 'Copiado!',
      description: 'Número do cartão copiado para a área de transferência.',
    })
  }

  return (
    <Card className="border-none shadow-elevation bg-gradient-to-tr from-slate-900 to-slate-800 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />

      <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between min-h-[200px]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-300 font-medium tracking-widest uppercase mb-1">
              Cartão Virtual
            </p>
            <div className="font-bold tracking-widest text-lg flex items-center gap-3">
              •••• •••• •••• 9012
              <button
                onClick={copyCardNumber}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                title="Copiar"
              >
                <Copy className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          </div>
          <div className="w-10 h-6 bg-white/20 rounded relative overflow-hidden">
            <div className="absolute w-5 h-5 rounded-full bg-red-500/80 -left-1 top-0.5 mix-blend-multiply" />
            <div className="absolute w-5 h-5 rounded-full bg-yellow-500/80 right-0 top-0.5 mix-blend-multiply" />
          </div>
        </div>

        <div className="flex justify-between items-end mt-8">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Titular</p>
            <p className="text-sm font-medium tracking-wide">JOAO A SILVA</p>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
            <ShieldAlert className="w-3.5 h-3.5" />
            Bloquear
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
