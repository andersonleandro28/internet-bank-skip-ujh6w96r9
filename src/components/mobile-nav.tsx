import { Link, useLocation } from 'react-router-dom'
import { FileText, ArrowLeftRight, User, Barcode, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const location = useLocation()

  const navItems = [
    { icon: FileText, label: 'Extrato', path: '/extrato' },
    { icon: Barcode, label: 'Boleto', path: '/boleto' },
    { icon: Coins, label: 'Carregar', path: '/carregar' },
    { icon: ArrowLeftRight, label: 'Transferir', path: '/transferir' },
    { icon: User, label: 'Perfil', path: '/perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative',
                isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-md" />
              )}
              <item.icon
                className={cn('w-6 h-6 mb-1', isActive && 'text-primary')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
