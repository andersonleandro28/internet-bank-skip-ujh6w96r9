import { useEffect, useState } from 'react'
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
  CheckSquare,
  CircleDollarSign,
  ShieldAlert,
  Users,
  BarChart3,
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
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import logoAclop from '@/assets/logo-aclop-ok8-a16ad.png'
import { NotificationsSheet } from '@/components/notifications-sheet'

const baseMenuItems = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: FileText, label: 'Extrato', path: '/extrato' },
  { icon: ArrowLeftRight, label: 'Transferências & PIX', path: '/transferir' },
  { icon: Wallet, label: 'Pagamentos', path: '/pagar-boleto' },
  { icon: CreditCard, label: 'Cartões', path: '/carregar' },
]

const adminMenuItems = [
  { icon: CheckSquare, label: 'Aprovações', path: '/admin/painel' },
  { icon: Users, label: 'Clientes', path: '/admin/clientes' },
  { icon: CircleDollarSign, label: 'Depósitos', path: '/admin/depositar' },
  { icon: BarChart3, label: 'Financeiro', path: '/admin/financeiro' },
  { icon: Settings, label: 'Configurações', path: '/admin/configuracoes-taxas' },
  { icon: ShieldAlert, label: 'Auditoria', path: '/admin/auditoria' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (user) {
      supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setIsAdmin(data?.role === 'admin')
        })
    }
  }, [user])

  const menuItems = isAdmin ? adminMenuItems : baseMenuItems

  const userFirstName =
    user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <Sidebar className="hidden md:flex border-r-slate-200">
          <SidebarHeader className="p-6">
            <div className="flex items-center justify-center bg-black/95 rounded-xl p-3">
              <img src={logoAclop} alt="ACLOP Bank" className="h-10 object-contain" />
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
                        'bg-slate-100 text-primary font-medium relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-primary after:rounded-r-md',
                    )}
                  >
                    <Link to={item.path}>
                      <item.icon
                        className={cn(
                          'w-5 h-5 mr-3',
                          location.pathname === item.path
                            ? 'text-primary'
                            : 'text-muted-foreground',
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
                  onClick={handleLogout}
                  className="h-11 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span>Sair da conta</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col pb-[80px] md:pb-0 h-screen overflow-hidden bg-white">
          <header className="flex items-center justify-between p-4 bg-white sticky top-0 z-40">
            <div className="flex items-center w-full gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  AB
                </div>
                <span className="font-medium text-slate-800 md:hidden">Olá, {userFirstName}</span>
              </div>
              <div className="relative hidden md:block flex-1 max-w-md ml-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transação..."
                  className="pl-9 bg-slate-50 border-none shadow-none h-10 rounded-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-6">
              <NotificationsSheet />

              <button
                onClick={handleLogout}
                className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <LogOut className="w-6 h-6" />
              </button>

              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-3 border-l pl-4 md:pl-6 border-slate-100">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium leading-none">{userFirstName}</span>
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
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-white">
            <div className="animate-fade-in-up h-full">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    </SidebarProvider>
  )
}
