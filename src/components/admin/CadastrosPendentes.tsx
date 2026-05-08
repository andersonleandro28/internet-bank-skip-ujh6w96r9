import { useState, useEffect, useCallback } from 'react'
import { Check, X, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase/client'
import { aprovarUsuario, reprovarUsuario } from '@/services/admin'
import { useAuth } from '@/hooks/use-auth'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200 focus:ring-[#8B5CF6]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aprovado">Aprovados</SelectItem>
            <SelectItem value="reprovado">Reprovados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl bg-white" />
          ))}
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">Nenhum cadastro encontrado</h3>
          <p className="text-slate-500">Não há usuários com o status selecionado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {usuarios.map((u) => (
            <Card
              key={u.id}
              className="overflow-hidden border-l-4 border-l-[#8B5CF6] shadow-sm hover:shadow-md transition-all"
            >
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[#8B5CF6] border-[#8B5CF6]/30 bg-[#8B5CF6]/5"
                    >
                      {u.tipo}
                    </Badge>
                    <span className="font-medium text-slate-800 text-lg">
                      {u.nome || 'Sem nome'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 flex flex-wrap items-center gap-2">
                    <span>
                      {u.tipo === 'PF' ? 'CPF:' : 'CNPJ:'} {u.documento || 'N/A'}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      {format(new Date(u.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">Email: {u.email}</div>
                </div>

                {u.status === 'pendente' && (
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                      onClick={() => handleReprovar(u.id)}
                    >
                      <X className="w-4 h-4 mr-2" /> Reprovar
                    </Button>
                    <Button
                      className="flex-1 sm:flex-none bg-[#8B5CF6] hover:bg-[#7c3aed] text-white transition-colors"
                      onClick={() => handleAprovar(u.id)}
                    >
                      <Check className="w-4 h-4 mr-2" /> Aprovar
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
