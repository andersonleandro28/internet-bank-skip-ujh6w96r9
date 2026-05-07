import { Link } from 'react-router-dom'
import { ArrowLeftRight, SendHorizontal, Barcode, Smartphone, Landmark, Plus } from 'lucide-react'

const actions = [
  {
    icon: ArrowLeftRight,
    label: 'Área PIX',
    path: '/transferir',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: SendHorizontal,
    label: 'Transferir',
    path: '/transferir',
    color: 'bg-blue-100 text-blue-700',
  },
  { icon: Barcode, label: 'Pagar Boleto', path: '#', color: 'bg-amber-100 text-amber-700' },
  { icon: Smartphone, label: 'Recarga', path: '#', color: 'bg-purple-100 text-purple-700' },
  { icon: Landmark, label: 'Investir', path: '#', color: 'bg-indigo-100 text-indigo-700' },
  { icon: Plus, label: 'Mais', path: '#', color: 'bg-slate-100 text-slate-700' },
]

export function QuickActions() {
  return (
    <div className="flex md:grid md:grid-cols-6 gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
      {actions.map((action, i) => (
        <Link
          key={i}
          to={action.path}
          className="flex flex-col items-center gap-3 min-w-[80px] snap-start group"
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color} transition-transform group-hover:scale-95 group-active:scale-90 shadow-sm`}
          >
            <action.icon className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-center text-slate-700">{action.label}</span>
        </Link>
      ))}
    </div>
  )
}
