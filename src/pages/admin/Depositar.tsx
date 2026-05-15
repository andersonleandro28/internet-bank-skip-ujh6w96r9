import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Search,
  ArrowDownCircle,
  CheckCircle,
  CircleDollarSign,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Cliente {
  id: string
  nome: string
  email: string
  documento: string
}

interface DepositoRecente {
  id: string
  valor: number
  created_at: string
  status: string
  cliente_nome: string
  admin_nome: string
}

export default function Depositar() {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [depositos, setDepositos] = useState<DepositoRecente[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const [clienteId, setClienteId] = useState('')
  const [valor, setValor] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Clientes
      const { data: usersData, error: usersError } = await supabase
        .from('usuarios')
        .select(`
          id, email, tipo,
          usuarios_pf (nome, cpf),
          usuarios_pj (razao_social, cnpj)
        `)
        .eq('role', 'cliente')

      if (usersError) throw usersError

      const formatados = (usersData || [])
        .map((u: any) => {
          const pf = Array.isArray(u.usuarios_pf) ? u.usuarios_pf[0] : u.usuarios_pf
          const pj = Array.isArray(u.usuarios_pj) ? u.usuarios_pj[0] : u.usuarios_pj

          return {
            id: u.id,
            email: u.email,
            nome: u.tipo === 'PF' ? pf?.nome : pj?.razao_social,
            documento: u.tipo === 'PF' ? pf?.cpf : pj?.cnpj,
          }
        })
        .filter((c: Cliente) => c.nome)

      setClientes(formatados)
      await fetchDepositos()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepositos = async () => {
    const { data, error } = await supabase
      .from('depositos')
      .select(`
        id, valor, created_at, status,
        cliente:usuarios!depositos_user_id_fkey ( id, email, usuarios_pf(nome), usuarios_pj(razao_social) ),
        admin:usuarios!depositos_admin_id_fkey ( id, email, usuarios_pf(nome) )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    const formatados = (data || []).map((d: any) => {
      const clientePf = Array.isArray(d.cliente?.usuarios_pf)
        ? d.cliente?.usuarios_pf[0]
        : d.cliente?.usuarios_pf
      const clientePj = Array.isArray(d.cliente?.usuarios_pj)
        ? d.cliente?.usuarios_pj[0]
        : d.cliente?.usuarios_pj
      const adminPf = Array.isArray(d.admin?.usuarios_pf)
        ? d.admin?.usuarios_pf[0]
        : d.admin?.usuarios_pf

      const clienteNome =
        clientePf?.nome || clientePj?.razao_social || d.cliente?.email || 'Desconhecido'
      const adminNome = adminPf?.nome || d.admin?.email || 'Admin'

      return {
        id: d.id,
        valor: d.valor,
        created_at: d.created_at,
        status: d.status,
        cliente_nome: clienteNome,
        admin_nome: adminNome,
      }
    })
    setDepositos(formatados)
  }

  const handleConfirm = async () => {
    if (!clienteId || !valor || !senha) {
      toast.error('Preencha todos os campos.')
      return
    }

    const numericValor = parseFloat(valor.replace(',', '.'))
    if (isNaN(numericValor) || numericValor <= 0) {
      toast.error('Valor inválido.')
      return
    }

    setSubmitting(true)

    // 1. Validação de Contexto de Sessão
    if (!user || !user.email) {
      toast.error('Sessão inválida ou expirada.')
      setSubmitting(false)
      return
    }

    try {
      // 3. Revisão da Chamada de Autenticação (Wrapper Customizado)
      // Utilizando XMLHttpRequest para evitar que o interceptador de fetch do ambiente de preview trave a aplicação num erro 400.
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

      const isValidPassword = await new Promise<boolean>((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${SUPABASE_URL}/auth/v1/token?grant_type=password`, true)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY)
        xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`)

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true)
          } else {
            resolve(false)
          }
        }
        xhr.onerror = () => resolve(false)

        xhr.send(
          JSON.stringify({
            email: user.email,
            password: senha,
          }),
        )
      })

      if (!isValidPassword) {
        // 2. Tratamento Amigável de Erros de Login
        toast.error('E-mail ou senha incorretos.')
        setSubmitting(false)
        return
      }

      // Perform deposit via RPC
      const { error: rpcError } = await supabase.rpc('realizar_deposito' as any, {
        p_cliente_id: clienteId,
        p_valor: numericValor,
        p_admin_id: user?.id,
      })

      if (rpcError) throw rpcError

      toast.success(
        `Depósito de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValor)} realizado com sucesso!`,
      )
      setValor('')
      setSenha('')
      setClienteId('')
      fetchDepositos()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao realizar depósito.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCliente = clientes.find((c) => c.id === clienteId)

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 pb-20">
      <header className="bg-[#8B5CF6] text-white px-4 py-4 flex items-center sticky top-0 z-10 shadow-sm">
        <Link
          to="/admin/painel"
          className="mr-3 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-medium tracking-tight">Depositar Saldo</h1>
      </header>

      <main className="max-w-xl mx-auto pb-6">
        {loading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="m-4">
              <Label className="text-sm font-medium text-gray-700 block mb-2">
                Selecionar cliente
              </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-white border-gray-200 focus:border-[#8B5CF6] focus:ring-[#8B5CF6] h-12 p-3 rounded-xl"
                  >
                    <span className="truncate">
                      {selectedCliente ? selectedCliente.nome : 'Buscar por nome ou e-mail...'}
                    </span>
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Digite para buscar..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clientes.map((cliente) => (
                          <CommandItem
                            key={cliente.id}
                            value={`${cliente.nome} ${cliente.email}`}
                            onSelect={() => {
                              setClienteId(cliente.id)
                              setOpen(false)
                            }}
                            className="flex flex-col items-start py-3 cursor-pointer"
                          >
                            <span className="font-medium text-gray-900">{cliente.nome}</span>
                            <span className="text-xs text-gray-500">{cliente.email}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {clienteId ? (
              <section className="bg-gray-50 rounded-[12px] p-4 m-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex flex-col items-center mb-6">
                  <CircleDollarSign size={32} className="text-[#8B5CF6] mb-2" />
                  <h2 className="text-lg font-medium text-gray-800">Novo Depósito</h2>
                </div>

                <div className="mb-3">
                  <Label className="text-sm font-medium text-gray-700 block mb-1">
                    Valor a depositar (R$)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="h-12 p-3 text-lg border-gray-200 focus-visible:ring-[#8B5CF6] focus-visible:border-[#8B5CF6] bg-white rounded-xl transition-colors"
                  />
                </div>

                <div className="mb-3">
                  <Label className="text-sm font-medium text-gray-700 block mb-1">
                    Senha de confirmação
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha de admin"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="h-12 p-3 border-gray-200 focus-visible:ring-[#8B5CF6] focus-visible:border-[#8B5CF6] pr-10 bg-white rounded-xl transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B5CF6] hover:text-[#7C3AED] focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full h-12 mt-5 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:text-gray-500 text-white font-medium text-lg rounded-xl transition-colors"
                >
                  {submitting ? 'Confirmando...' : 'Confirmar depósito'}
                </Button>
              </section>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center m-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Search size={32} className="mb-2 text-gray-400 opacity-50" />
                <p className="text-sm text-gray-500">Selecione um cliente para continuar.</p>
              </div>
            )}
          </>
        )}

        <section className="m-4 mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-gray-800 mb-4">
            Depósitos recentes
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : depositos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <ArrowDownCircle size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Nenhum depósito recente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {depositos.map((deposito) => (
                <div
                  key={deposito.id}
                  className="bg-white shadow-sm border border-gray-100 border-l-4 border-l-[#10B981] rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-[#10B981]" />
                      <p className="font-medium text-gray-900 leading-none">
                        {deposito.cliente_nome}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      {new Date(deposito.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-gray-400 ml-6">por {deposito.admin_nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#10B981]">
                      +{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(deposito.valor)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
