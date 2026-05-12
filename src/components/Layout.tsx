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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import logoAclop from '@/assets/aclop-bank-logo-998a8.png'
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
  const [userData, setUserData] = useState<{ nome: string; foto_url: string | null } | null>(null)

  const loadUserData = async () => {
    if (!user) return
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('role, tipo, foto_url' as any)
      .eq('id', user.id)
      .single()

    let nome = user.user_metadata?.name || user.email?.split('@')[0] || 'Cliente'
    if (usuario) {
      setIsAdmin(usuario.role === 'admin')
      if (usuario.tipo === 'PF') {
        const { data: pf } = await supabase
          .from('usuarios_pf')
          .select('nome')
          .eq('user_id', user.id)
          .single()
        if (pf?.nome) nome = pf.nome
      } else {
        const { data: pj } = await supabase
          .from('usuarios_pj')
          .select('razao_social')
          .eq('user_id', user.id)
          .single()
        if (pj?.razao_social) nome = pj.razao_social
      }
      setUserData({ nome, foto_url: (usuario as any).foto_url || null })
    }
  }

  useEffect(() => {
    loadUserData()
    const handleProfileUpdate = () => loadUserData()
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [user])

  const menuItems = isAdmin ? adminMenuItems : baseMenuItems

  const fullName = userData?.nome || user?.user_metadata?.name || 'Anderson Leandro'
  const userFirstName = fullName.split(' ')[0] || user?.email?.split('@')[0] || 'Anderson'
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const avatarSrc = userData?.foto_url || undefined

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <Sidebar className="hidden md:flex border-r-slate-200">
          <SidebarHeader className="p-6">
            <div className="flex items-center justify-center p-3 gap-2">
              <img src={logoAclop} alt="ACLOP Logo" className="h-10 object-contain" />
              <span className="text-slate-900 font-bold text-xl tracking-wide">ACLOP</span>
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

              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="flex items-center gap-3 pl-2 md:pl-6 md:border-l border-slate-100 cursor-pointer group">
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-sm font-medium leading-none group-hover:text-[#1a4d2e] transition-colors">
                        {userFirstName}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">Conta Corrente</span>
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-[#7fff00] transition-colors bg-[#1a4d2e]">
                      <AvatarImage src={avatarSrc} className="object-cover" />
                      <AvatarFallback className="bg-[#1a4d2e] text-[#7fff00] font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white border-slate-200 shadow-lg"
                >
                  <DropdownMenuLabel className="text-[#1a4d2e]">Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer hover:bg-[#7fff00]/20 focus:bg-[#7fff00]/20 text-[#1a4d2e]"
                  >
                    <Link to="/perfil" className="w-full flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Editar Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-[#7fff00]/20 focus:bg-[#7fff00]/20 text-[#1a4d2e]">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
