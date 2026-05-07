import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  Home,
  FileText,
  ArrowLeftRight,
  CreditCard,
  Settings,
  LogOut,
  Wallet,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { MobileNav } from '@/components/mobile-nav'

const menuItems = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: FileText, label: 'Extrato', path: '/extrato' },
  { icon: ArrowLeftRight, label: 'Transferências & PIX', path: '/transferir' },
  { icon: Wallet, label: 'Pagamentos', path: '#' },
  { icon: CreditCard, label: 'Cartões', path: '#' },
  { icon: Settings, label: 'Configurações', path: '#' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50/50">
        <Sidebar className="hidden md:flex border-r-slate-200">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                N
              </div>
              NovaBank
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    className={cn(
                      'h-11 transition-all',
                      location.pathname === item.path &&
                        'bg-slate-100 text-primary font-medium relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-accent after:rounded-r-md',
                    )}
                  >
                    <Link to={item.path}>
                      <item.icon
                        className={cn(
                          'w-5 h-5 mr-3',
                          location.pathname === item.path ? 'text-accent' : 'text-muted-foreground',
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/login')}
                  className="h-11 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span>Sair da conta</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col pb-16 md:pb-0 h-screen overflow-hidden">
          <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-100 sticky top-0 z-40">
            <div className="flex items-center w-full max-w-md gap-4">
              <div className="md:hidden flex items-center gap-2 font-bold text-lg text-primary mr-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs">
                  N
                </div>
              </div>
              <div className="relative hidden md:block flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transação..."
                  className="pl-9 bg-slate-50 border-none shadow-none h-10 rounded-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 border-l pl-4 md:pl-6 border-slate-100">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium leading-none">João Silva</span>
                  <span className="text-xs text-muted-foreground mt-1">Conta Corrente</span>
                </div>
                <Avatar className="h-9 w-9 border border-slate-100">
                  <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1" />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto animate-fade-in-up">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    </SidebarProvider>
  )
}
