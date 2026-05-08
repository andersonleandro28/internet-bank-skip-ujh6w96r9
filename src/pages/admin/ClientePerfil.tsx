import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Mail,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileImage,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ClientePerfil() {
  const { id } = useParams<{ id: string }>()
  const [cliente, setCliente] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchCliente(id)
    }
  }, [id])

  const fetchCliente = async (userId: string) => {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('usuarios')
      .select(`
        id, email, tipo, status, created_at, role,
        usuarios_pf (nome, cpf, data_nascimento, selfie_url, documento_identidade_url),
        usuarios_pj (razao_social, cnpj, documentos_url, resp_nome, resp_cpf, resp_data_nascimento, resp_selfie_url, resp_documento_url),
        contas (saldo, saldo_bloqueado),
        requisicoes (id, tipo, valor_total, status, created_at),
        depositos (id, valor, status, created_at)
      `)
      .eq('id', userId)
      .single()

    if (!error && data) {
      setCliente(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!cliente) {
    return <div className="p-8 text-center text-muted-foreground">Cliente não encontrado.</div>
  }

  const nome =
    cliente.tipo === 'PF' ? cliente.usuarios_pf?.[0]?.nome : cliente.usuarios_pj?.[0]?.razao_social
  const doc = cliente.tipo === 'PF' ? cliente.usuarios_pf?.[0]?.cpf : cliente.usuarios_pj?.[0]?.cnpj

  const saldo = cliente.contas?.saldo || 0
  const saldoBloqueado = cliente.contas?.saldo_bloqueado || 0

  const statusBadge = (status: string) => {
    if (status === 'aprovado' || status === 'confirmado' || status === 'concluido') {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">{status}</Badge>
    }
    if (status === 'pendente') {
      return <Badge variant="secondary">{status}</Badge>
    }
    return <Badge variant="destructive">{status}</Badge>
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link to="/admin/clientes">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Perfil do Cliente</h1>
          <p className="text-muted-foreground">Detalhes e histórico da conta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Cadastrais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold uppercase">
                    {nome ? nome.substring(0, 2) : 'CL'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      {nome || 'Não informado'}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" /> {cliente.email}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div>{statusBadge(cliente.status)}</div>
                  <Badge variant="outline">{cliente.tipo}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">
                    Documento ({cliente.tipo === 'PF' ? 'CPF' : 'CNPJ'})
                  </span>
                  <p className="font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    {doc || 'Não informado'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Data de Cadastro</span>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(cliente.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos e Dados Complementares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {cliente.tipo === 'PF' && cliente.usuarios_pf?.[0] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cliente.usuarios_pf[0].selfie_url && (
                    <div className="p-4 border rounded-xl bg-slate-50">
                      <span className="text-sm font-medium text-slate-700 block mb-2">
                        Selfie do Usuário
                      </span>
                      <a
                        href={cliente.usuarios_pf[0].selfie_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-2 font-medium"
                      >
                        <FileImage className="w-4 h-4" /> Visualizar Imagem
                      </a>
                    </div>
                  )}
                  {cliente.usuarios_pf[0].documento_identidade_url && (
                    <div className="p-4 border rounded-xl bg-slate-50">
                      <span className="text-sm font-medium text-slate-700 block mb-2">
                        Documento de Identidade
                      </span>
                      <a
                        href={cliente.usuarios_pf[0].documento_identidade_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-2 font-medium"
                      >
                        <FileImage className="w-4 h-4" /> Visualizar Documento
                      </a>
                    </div>
                  )}
                  {!cliente.usuarios_pf[0].selfie_url &&
                    !cliente.usuarios_pf[0].documento_identidade_url && (
                      <p className="text-sm text-slate-500">Nenhum documento anexado.</p>
                    )}
                </div>
              )}

              {cliente.tipo === 'PJ' && cliente.usuarios_pj?.[0] && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Documentos da Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cliente.usuarios_pj[0].documentos_url ? (
                        <div className="p-4 border rounded-xl bg-slate-50">
                          <span className="text-sm font-medium text-slate-700 block mb-2">
                            Contrato Social / Outros
                          </span>
                          <a
                            href={cliente.usuarios_pj[0].documentos_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-2 font-medium"
                          >
                            <FileText className="w-4 h-4" /> Visualizar Documentos
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Nenhum documento anexado.</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-slate-800 mb-4">Dados do Responsável</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="space-y-1">
                        <span className="text-sm text-slate-500">Nome</span>
                        <p className="font-medium text-slate-800">
                          {cliente.usuarios_pj[0].resp_nome || 'Não informado'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-slate-500">CPF</span>
                        <p className="font-medium text-slate-800">
                          {cliente.usuarios_pj[0].resp_cpf || 'Não informado'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-slate-500">Nascimento</span>
                        <p className="font-medium text-slate-800">
                          {cliente.usuarios_pj[0].resp_data_nascimento
                            ? format(
                                new Date(cliente.usuarios_pj[0].resp_data_nascimento),
                                'dd/MM/yyyy',
                              )
                            : 'Não informado'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cliente.usuarios_pj[0].resp_selfie_url && (
                        <div className="p-4 border rounded-xl bg-slate-50">
                          <span className="text-sm font-medium text-slate-700 block mb-2">
                            Selfie (Responsável)
                          </span>
                          <a
                            href={cliente.usuarios_pj[0].resp_selfie_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-2 font-medium"
                          >
                            <FileImage className="w-4 h-4" /> Visualizar Imagem
                          </a>
                        </div>
                      )}
                      {cliente.usuarios_pj[0].resp_documento_url && (
                        <div className="p-4 border rounded-xl bg-slate-50">
                          <span className="text-sm font-medium text-slate-700 block mb-2">
                            Doc. Identidade (Responsável)
                          </span>
                          <a
                            href={cliente.usuarios_pj[0].resp_documento_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-2 font-medium"
                          >
                            <FileImage className="w-4 h-4" /> Visualizar Documento
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimas Requisições</CardTitle>
            </CardHeader>
            <CardContent>
              {cliente.requisicoes?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma requisição encontrada.
                </p>
              ) : (
                <div className="space-y-4">
                  {cliente.requisicoes?.slice(0, 5).map((req: any) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          {req.status === 'aprovado' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          ) : req.status === 'reprovado' ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{req.tipo}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(req.valor_total)}
                        </p>
                        {statusBadge(req.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          <Card className="bg-slate-50 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Saldo em Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Saldo Disponível</span>
                  <p className="text-3xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      saldo,
                    )}
                  </p>
                </div>
                {saldoBloqueado > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Saldo Bloqueado</span>
                    <p className="text-lg font-semibold text-slate-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(saldoBloqueado)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Últimos Depósitos</CardTitle>
            </CardHeader>
            <CardContent>
              {cliente.depositos?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  Nenhum depósito recente.
                </p>
              ) : (
                <div className="space-y-3">
                  {cliente.depositos?.slice(0, 5).map((dep: any) => (
                    <div
                      key={dep.id}
                      className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(dep.valor)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(dep.created_at), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div>{statusBadge(dep.status)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
