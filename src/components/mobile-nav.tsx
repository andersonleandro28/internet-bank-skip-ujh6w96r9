import { Link, useLocation } from 'react-router-dom'
import { FileText, ArrowLeftRight, User, Barcode, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const location = useLocation()

  const navItems = [
    { icon: FileText, label: 'Extrato', path: '/extrato' },
    { icon: Barcode, label: 'Boleto', path: '/pagar-boleto' },
    { icon: Coins, label: 'Carregar', path: '/carregar' },
    { icon: ArrowLeftRight, label: 'Transferir', path: '/transferir' },
    { icon: User, label: 'Perfil', path: '/perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 h-[80px] p-3 md:hidden">
      <div className="flex justify-between items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors"
            >
              <div className="text-primary transition-transform active:scale-95">
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium transition-colors',
                  isActive ? 'text-slate-800' : 'text-slate-500',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
