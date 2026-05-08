import { useState, useEffect, useCallback } from 'react'
import { Check, X, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase/client'
import { aprovarUsuario, reprovarUsuario } from '@/services/admin'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type UsuarioPendente = {
  id: string
  email: string
  tipo: 'PF' | 'PJ'
  status: string
  created_at: string
  nome?: string
  documento?: string
}

export function CadastrosPendentes() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('pendente')

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id, email, tipo, status, created_at,
          usuarios_pf(nome, cpf),
          usuarios_pj(razao_social, cnpj)
        `)
        .eq('status', filtroStatus)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formatados = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        tipo: u.tipo,
        status: u.status,
        created_at: u.created_at,
        nome: u.tipo === 'PF' ? u.usuarios_pf?.[0]?.nome : u.usuarios_pj?.[0]?.razao_social,
        documento: u.tipo === 'PF' ? u.usuarios_pf?.[0]?.cpf : u.usuarios_pj?.[0]?.cnpj,
      }))
      setUsuarios(formatados)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [filtroStatus])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  const handleAprovar = async (id: string) => {
    if (!user) return
    try {
      await aprovarUsuario(id, user.id)
      toast.success('Cadastro aprovado com sucesso')
      fetchUsuarios()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao aprovar cadastro')
    }
  }

  const handleReprovar = async (id: string) => {
    if (!user) return
    try {
      await reprovarUsuario(id, user.id)
      toast.success('Cadastro reprovado com sucesso')
      fetchUsuarios()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao reprovar cadastro')
    }
  }

  const statuses = [
    { value: 'pendente', label: 'Pendentes' },
    { value: 'aprovado', label: 'Aprovados' },
    { value: 'reprovado', label: 'Reprovados' },
  ]

  return (
    <div className="space-y-6">
      <div className="px-3 sm:px-6">
        <div className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setFiltroStatus(s.value)}
              className={cn(
                'px-5 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
                filtroStatus === s.value
                  ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#8B5CF6] hover:text-[#8B5CF6]',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 px-3 sm:px-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl bg-white" />
          ))}
        </div>
      ) : usuarios.length === 0 ? (
        <div className="px-3 sm:px-6">
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">Nenhum cadastro encontrado</h3>
            <p className="text-slate-500">Não há usuários com o status selecionado.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 px-3 sm:px-6">
          {usuarios.map((u) => (
            <Card
              key={u.id}
              className={cn(
                'overflow-hidden shadow-subtle hover:shadow-md transition-all',
                u.status === 'pendente' && 'border-l-4 border-l-yellow-400',
                u.status === 'aprovado' && 'border-l-4 border-l-green-500',
                u.status === 'reprovado' && 'border-l-4 border-l-red-500',
              )}
            >
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800 text-lg">
                      {u.nome || 'Sem nome'}
                    </span>
                    <Badge
                      className={cn(
                        'text-white border-transparent px-2 py-0.5 text-xs font-medium uppercase shadow-none',
                        u.status === 'pendente' && 'bg-yellow-500 hover:bg-yellow-600',
                        u.status === 'aprovado' && 'bg-green-500 hover:bg-green-600',
                        u.status === 'reprovado' && 'bg-red-500 hover:bg-red-600',
                      )}
                    >
                      {u.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-600 flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="text-slate-600 border-slate-300">
                      {u.tipo}
                    </Badge>
                    <span>
                      {u.tipo === 'PF' ? 'CPF:' : 'CNPJ:'} {u.documento || 'N/A'}
                    </span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="text-slate-500">
                      {format(new Date(u.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">{u.email}</div>
                </div>

                {u.status === 'pendente' && (
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button
                      className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white transition-colors h-11 px-6 shadow-sm"
                      onClick={() => handleReprovar(u.id)}
                    >
                      <X className="w-5 h-5 mr-2" /> Reprovar
                    </Button>
                    <Button
                      className="flex-1 sm:flex-none bg-[#8B5CF6] hover:bg-[#7c3aed] text-white transition-colors h-11 px-6 shadow-sm"
                      onClick={() => handleAprovar(u.id)}
                    >
                      <Check className="w-5 h-5 mr-2" /> Aprovar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
