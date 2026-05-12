import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Search,
  Eye,
  Download,
  MoreHorizontal,
  Ban,
  CheckCircle,
  Key,
  DollarSign,
  Filter,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { aprovarUsuario, reprovarUsuario } from '@/services/admin'

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [dateFilter, setDateFilter] = useState('todos')

  const { user } = useAuth()
  const { toast } = useToast()

  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isDepositSheetOpen, setIsDepositSheetOpen] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id,
        email,
        tipo,
        status,
        created_at,
        usuarios_pf (nome, cpf),
        usuarios_pj (razao_social, cnpj)
      `)
      .eq('role', 'cliente')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setClientes(data)
    }
    setLoading(false)
  }

  const filteredClientes = clientes.filter((c) => {
    const term = search.toLowerCase()
    const nome = c.tipo === 'PF' ? c.usuarios_pf?.[0]?.nome : c.usuarios_pj?.[0]?.razao_social
    const doc = c.tipo === 'PF' ? c.usuarios_pf?.[0]?.cpf : c.usuarios_pj?.[0]?.cnpj

    const matchesSearch =
      c.email.toLowerCase().includes(term) ||
      (nome && nome.toLowerCase().includes(term)) ||
      (doc && doc.includes(term))

    const matchesStatus = statusFilter === 'todos' || c.status === statusFilter

    let matchesDate = true
    if (dateFilter !== 'todos') {
      const dataCadastro = new Date(c.created_at)
      const hoje = new Date()
      const diffDays = (hoje.getTime() - dataCadastro.getTime()) / (1000 * 3600 * 24)
      if (dateFilter === '7d') matchesDate = diffDays <= 7
      if (dateFilter === '30d') matchesDate = diffDays <= 30
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const exportToCSV = () => {
    const headers = ['Nome', 'Documento', 'Email', 'Tipo', 'Status', 'Data Cadastro']
    const csvData = filteredClientes.map((c) => {
      const nome = c.tipo === 'PF' ? c.usuarios_pf?.[0]?.nome : c.usuarios_pj?.[0]?.razao_social
      const doc = c.tipo === 'PF' ? c.usuarios_pf?.[0]?.cpf : c.usuarios_pj?.[0]?.cnpj
      const data = format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')
      return `"${nome || ''}","${doc || ''}","${c.email}","${c.tipo}","${c.status}","${data}"`
    })

    const csvContent = [headers.join(','), ...csvData].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `clientes_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBlockAccount = async (cliente: any) => {
    if (!user?.id) return
    try {
      await reprovarUsuario(cliente.id, user.id)
      toast({ title: 'Sucesso', description: 'Conta bloqueada/reprovada com sucesso.' })
      fetchClientes()
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao bloquear conta.', variant: 'destructive' })
    }
  }

  const handleUnblockAccount = async (cliente: any) => {
    if (!user?.id) return
    try {
      await aprovarUsuario(cliente.id, user.id)
      toast({ title: 'Sucesso', description: 'Conta ativada com sucesso.' })
      fetchClientes()
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao ativar conta.', variant: 'destructive' })
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {
        if (
          error.status === 429 ||
          error.message?.includes('rate limit') ||
          error.code === 'over_email_send_rate_limit'
        ) {
          toast({
            title: 'Limite excedido',
            description:
              'Muitos e-mails de recuperação enviados. Aguarde alguns instantes antes de tentar novamente.',
            variant: 'destructive',
          })
          return
        }
        throw error
      }
      toast({ title: 'Sucesso', description: 'E-mail de redefinição de senha enviado.' })
    } catch (error: any) {
      if (
        error?.status === 429 ||
        error?.message?.includes('rate limit') ||
        error?.code === 'over_email_send_rate_limit'
      ) {
        toast({
          title: 'Limite excedido',
          description:
            'Muitos e-mails de recuperação enviados. Aguarde alguns instantes antes de tentar novamente.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao enviar e-mail de redefinição.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDeposit = async () => {
    if (!user?.id || !selectedClient || !depositValue) return
    setIsSubmitting(true)
    try {
      const val = parseFloat(depositValue.replace(',', '.'))
      if (isNaN(val) || val <= 0) throw new Error('Valor inválido')

      const { error } = await supabase.rpc('realizar_deposito', {
        p_cliente_id: selectedClient.id,
        p_valor: val,
        p_admin_id: user.id,
      })

      if (error) throw error
      toast({ title: 'Sucesso', description: 'Saldo adicionado com sucesso.' })
      setIsDepositSheetOpen(false)
      setDepositValue('')
      fetchClientes()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao adicionar saldo.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-muted-foreground">Gerencie os usuários da plataforma</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="shrink-0">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Todos os Clientes</CardTitle>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou doc..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="aprovado">Ativo (Aprovado)</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="reprovado">Inativo (Reprovado)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Qualquer Data</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Nenhum cliente encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => {
                    const nome =
                      cliente.tipo === 'PF'
                        ? cliente.usuarios_pf?.[0]?.nome
                        : cliente.usuarios_pj?.[0]?.razao_social
                    const doc =
                      cliente.tipo === 'PF'
                        ? cliente.usuarios_pf?.[0]?.cpf
                        : cliente.usuarios_pj?.[0]?.cnpj

                    return (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div className="font-medium text-slate-900">
                            {nome || 'Não informado'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {doc || 'Sem documento'}
                          </div>
                        </TableCell>
                        <TableCell>{cliente.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cliente.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              cliente.status === 'aprovado'
                                ? 'default'
                                : cliente.status === 'pendente'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className={
                              cliente.status === 'aprovado'
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                : ''
                            }
                          >
                            {cliente.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(cliente.created_at), "dd 'de' MMM, yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button asChild variant="ghost" size="icon">
                              <Link to={`/admin/clientes/${cliente.id}`} title="Ver Perfil">
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClient(cliente)
                                    setIsDepositSheetOpen(true)
                                  }}
                                >
                                  <DollarSign className="w-4 h-4 mr-2" /> Adicionar Saldo
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleResetPassword(cliente.email)}
                                >
                                  <Key className="w-4 h-4 mr-2" /> Resetar Senha
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {cliente.status !== 'aprovado' ? (
                                  <DropdownMenuItem onClick={() => handleUnblockAccount(cliente)}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Ativar
                                    Conta
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleBlockAccount(cliente)}
                                    className="text-red-600"
                                  >
                                    <Ban className="w-4 h-4 mr-2" /> Bloquear Conta
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isDepositSheetOpen} onOpenChange={setIsDepositSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Adicionar Saldo</SheetTitle>
            <SheetDescription>
              Adicione saldo manualmente para a conta deste cliente.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <div className="p-3 bg-slate-50 border rounded-md text-sm">
                <span className="font-semibold block text-slate-900">
                  {selectedClient?.tipo === 'PF'
                    ? selectedClient?.usuarios_pf?.[0]?.nome
                    : selectedClient?.usuarios_pj?.[0]?.razao_social}
                </span>
                <span className="text-muted-foreground text-xs">{selectedClient?.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor a adicionar (R$)</label>
              <Input
                type="number"
                placeholder="Ex: 100.00"
                value={depositValue}
                onChange={(e) => setDepositValue(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setIsDepositSheetOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleDeposit} disabled={isSubmitting || !depositValue}>
              {isSubmitting ? 'Processando...' : 'Confirmar'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
