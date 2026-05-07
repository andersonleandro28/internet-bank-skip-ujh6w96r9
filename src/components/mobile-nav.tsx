import { Link, useLocation } from 'react-router-dom'
import { Home, ArrowLeftRight, FileText, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const location = useLocation()

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: FileText, label: 'Extrato', path: '/extrato' },
    { icon: ArrowLeftRight, label: 'PIX', path: '/transferir' },
    { icon: Menu, label: 'Menu', path: '#' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t pb-safe md:hidden flex justify-around items-center h-16 px-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <item.icon className={cn('w-5 h-5', isActive && 'text-accent')} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
