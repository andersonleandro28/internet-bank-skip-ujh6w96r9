import { useState } from 'react'
import {
  Search,
  Filter,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  Coffee,
  ShoppingBag,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// Mock Data
const transactionGroups = [
  {
    date: 'Hoje, 15 de Outubro',
    items: [
      {
        id: 1,
        title: 'Supermercado Extra',
        type: 'out',
        category: 'Alimentação',
        amount: 345.5,
        time: '14:30',
        icon: ShoppingBag,
        color: 'bg-orange-100 text-orange-600',
        method: 'Cartão de Crédito',
        recipient: 'CIA BRASILEIRA DE DISTRIBUICAO',
      },
      {
        id: 2,
        title: 'Transferência Recebida',
        type: 'in',
        category: 'PIX',
        amount: 1500.0,
        time: '10:15',
        icon: ArrowDownRight,
        color: 'bg-emerald-100 text-emerald-600',
        method: 'PIX',
        recipient: 'Maria Oliveira',
      },
    ],
  },
  {
    date: 'Ontem, 14 de Outubro',
    items: [
      {
        id: 3,
        title: 'Starbucks',
        type: 'out',
        category: 'Lazer',
        amount: 24.9,
        time: '16:45',
        icon: Coffee,
        color: 'bg-amber-100 text-amber-600',
        method: 'Cartão de Débito',
        recipient: 'Starbucks Brasil',
      },
    ],
  },
  {
    date: '12 de Outubro',
    items: [
      {
        id: 4,
        title: 'Pagamento Fatura',
        type: 'out',
        category: 'Pagamento',
        amount: 850.0,
        time: '09:00',
        icon: ArrowUpRight,
        color: 'bg-red-100 text-red-600',
        method: 'Saldo em Conta',
        recipient: 'Banco NovaBank SA',
      },
      {
        id: 5,
        title: 'Conta de Luz',
        type: 'out',
        category: 'Contas',
        amount: 185.2,
        time: '11:20',
        icon: Zap,
        color: 'bg-yellow-100 text-yellow-600',
        method: 'Boleto',
        recipient: 'Enel Distribuição',
      },
    ],
  },
]

export default function Extrato() {
  const [selectedTx, setSelectedTx] = useState<any | null>(null)

  return (
    <div className="flex flex-col gap-6 pb-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Extrato</h1>
          <p className="text-muted-foreground text-sm">Acompanhe suas movimentações</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar no extrato..." className="pl-9 h-10 border-slate-200" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <Button variant="secondary" className="bg-slate-100 whitespace-nowrap text-primary">
            Tudo
          </Button>
          <Button variant="ghost" className="whitespace-nowrap text-slate-500">
            Entradas
          </Button>
          <Button variant="ghost" className="whitespace-nowrap text-slate-500">
            Saídas
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 border-slate-200 text-slate-500"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-elevation border border-slate-100 overflow-hidden">
        {transactionGroups.map((group, i) => (
          <div key={i}>
            <div className="bg-slate-50/80 px-5 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-100 first:border-t-0">
              {group.date}
            </div>
            <div className="divide-y divide-slate-100">
              {group.items.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 sm:px-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                  onClick={() => setSelectedTx(tx)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                        tx.color,
                      )}
                    >
                      <tx.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{tx.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tx.time} • {tx.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'text-sm font-bold text-right',
                        tx.type === 'in' ? 'text-emerald-600' : 'text-primary',
                      )}
                    >
                      {tx.type === 'in' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors hidden sm:block" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <SheetContent className="sm:max-w-md w-full p-0 flex flex-col bg-slate-50">
          {selectedTx && (
            <>
              <SheetHeader className="p-6 bg-white border-b text-center">
                <div
                  className={cn(
                    'w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4',
                    selectedTx.color,
                  )}
                >
                  <selectedTx.icon className="w-8 h-8" />
                </div>
                <SheetTitle className="text-2xl">{formatCurrency(selectedTx.amount)}</SheetTitle>
                <SheetDescription className="text-base">{selectedTx.title}</SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-1">
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Status</span>
                    <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      Concluído
                    </span>
                  </div>
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Data e Hora</span>
                    <span className="text-sm font-medium text-primary">{selectedTx.time}</span>
                  </div>
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Método</span>
                    <span className="text-sm font-medium text-primary">{selectedTx.method}</span>
                  </div>
                  <div className="p-4 border-b border-slate-50 flex flex-col gap-1 items-end">
                    <span className="text-sm text-slate-500 self-start">Destinatário/Origem</span>
                    <span className="text-sm font-medium text-primary">{selectedTx.recipient}</span>
                  </div>
                  <div className="p-4 flex flex-col gap-1 items-end">
                    <span className="text-sm text-slate-500 self-start">ID da Transação</span>
                    <span className="text-xs font-mono text-slate-400">E938475839201928374</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t">
                <Button className="w-full h-12 text-base">Compartilhar Comprovante</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
