import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Edit2,
  Save,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { aprovarUsuario, reprovarUsuario, atualizarEmailUsuario } from '@/services/admin'

export default function ClientePerfil() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [cliente, setCliente] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)

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
        requisicoes!requisicoes_user_id_fkey (id, tipo, valor_total, status, created_at),
        depositos!depositos_user_id_fkey (id, valor, status, created_at)
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar cliente:', error)
    } else if (data) {
      setCliente(data)
    }
    setLoading(false)
  }

  const handleEdit = () => {
    setEditData({
      email: cliente.email,
      nome:
        cliente.tipo === 'PF'
          ? cliente.usuarios_pf?.[0]?.nome
          : cliente.usuarios_pj?.[0]?.razao_social,
      doc: cliente.tipo === 'PF' ? cliente.usuarios_pf?.[0]?.cpf : cliente.usuarios_pj?.[0]?.cnpj,
      data_nascimento: cliente.tipo === 'PF' ? cliente.usuarios_pf?.[0]?.data_nascimento : '',
      resp_nome: cliente.tipo === 'PJ' ? cliente.usuarios_pj?.[0]?.resp_nome : '',
      resp_cpf: cliente.tipo === 'PJ' ? cliente.usuarios_pj?.[0]?.resp_cpf : '',
      resp_data_nascimento:
        cliente.tipo === 'PJ' ? cliente.usuarios_pj?.[0]?.resp_data_nascimento : '',
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editData.email && editData.email !== cliente.email) {
        await atualizarEmailUsuario(cliente.id, editData.email)
      }

      if (cliente.tipo === 'PF') {
        const { error } = await supabase
          .from('usuarios_pf')
          .update({
            nome: editData.nome,
            cpf: editData.doc,
            data_nascimento: editData.data_nascimento || null,
          })
          .eq('user_id', cliente.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('usuarios_pj')
          .update({
            razao_social: editData.nome,
            cnpj: editData.doc,
            resp_nome: editData.resp_nome,
            resp_cpf: editData.resp_cpf,
            resp_data_nascimento: editData.resp_data_nascimento || null,
          })
          .eq('user_id', cliente.id)
        if (error) throw error
      }
      toast.success('Dados atualizados com sucesso')
      setIsEditing(false)
      fetchCliente(cliente.id)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar dados')
    } finally {
      setSaving(false)
    }
  }

  const handleAprovar = async () => {
    if (!user) return
    setProcessing(true)
    try {
      await aprovarUsuario(cliente.id, user.id)
      toast.success('Cadastro aprovado com sucesso')
      fetchCliente(cliente.id)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao aprovar cadastro')
    } finally {
      setProcessing(false)
    }
  }

  const handleReprovar = async () => {
    if (!user) return
    setProcessing(true)
    try {
      await reprovarUsuario(cliente.id, user.id)
      toast.success('Cadastro reprovado com sucesso')
      fetchCliente(cliente.id)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao reprovar cadastro')
    } finally {
      setProcessing(false)
    }
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

  const parseUrls = (urlData: string | null) => {
    if (!urlData) return []
    try {
      const parsed = JSON.parse(urlData)
      if (Array.isArray(parsed)) return parsed
      return [urlData]
    } catch {
      if (urlData.includes(',') && urlData.startsWith('http')) {
        return urlData.split(',').map((s) => s.trim())
      }
      return [urlData]
    }
  }

  const DocumentLink = ({
    url,
    label,
    icon,
    index,
  }: {
    url: string
    label: string
    icon: React.ReactNode
    index: number
  }) => {
    const [signedUrl, setSignedUrl] = useState<string>(url)
    const [linkLoading, setLinkLoading] = useState(true)

    useEffect(() => {
      const getUrl = async () => {
        try {
          console.log('[DocumentLink] Raw URL:', url)

          if (!url) {
            setLinkLoading(false)
            return
          }

          let bucket = ''
          let filePath = ''

          if (url.includes('/storage/v1/object/')) {
            const matches = url.match(
              /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(?:\?|$)/,
            )
            if (matches && matches.length === 3) {
              bucket = matches[1]
              filePath = matches[2]
            }
          } else if (!url.startsWith('http')) {
            bucket = 'documentos'
            filePath = url
          }

          console.log('[DocumentLink] Parsed:', { bucket, filePath })

          if (bucket && filePath) {
            const decodedPath = decodeURIComponent(filePath)
            const { data, error } = await supabase.storage
              .from(bucket)
              .createSignedUrl(decodedPath, 3600)

            console.log('[DocumentLink] Signed URL response:', { data, error })

            if (!error && data?.signedUrl) {
              setSignedUrl(data.signedUrl)
              return
            }

            const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(decodedPath)
            console.log('[DocumentLink] Public URL:', publicData)

            if (publicData?.publicUrl) {
              setSignedUrl(publicData.publicUrl)
              return
            }
          }

          setSignedUrl(url)
        } catch (err) {
          console.error('[DocumentLink] Error:', err)
          setSignedUrl(url)
        } finally {
          setLinkLoading(false)
        }
      }
      getUrl()
    }, [url])

    if (linkLoading) {
      return (
        <span className="text-sm text-slate-500 flex items-center gap-2">
          {icon} Carregando {label}...
        </span>
      )
    }

    return (
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#8B5CF6] hover:underline text-sm flex items-center gap-2 font-medium"
      >
        {icon} {label} {index > 0 ? index + 1 : ''}
      </a>
    )
  }

  const renderDocumentLinks = (urlData: string | null, label: string, icon: React.ReactNode) => {
    const urls = parseUrls(urlData)
    if (urls.length === 0) return null

    return (
      <div className="space-y-2 mt-2">
        {urls.map((u, i) => (
          <DocumentLink key={i} url={u} label={label} icon={icon} index={urls.length > 1 ? i : 0} />
        ))}
      </div>
    )
  }

  const statusBadge = (status: string) => {
    if (status === 'aprovado' || status === 'confirmado' || status === 'concluido') {
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-none">
          {status}
        </Badge>
      )
    }
    if (status === 'pendente') {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-none">{status}</Badge>
      )
    }
    return (
      <Badge variant="destructive" className="shadow-none">
        {status}
      </Badge>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
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

        {cliente.status === 'pendente' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              onClick={handleReprovar}
              disabled={processing || isEditing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reprovar
            </Button>
            <Button
              className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleAprovar}
              disabled={processing || isEditing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Informações Cadastrais</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEdit} className="h-8">
                  <Edit2 className="w-4 h-4 mr-2" /> Editar Dados
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="h-8"
                  >
                    <X className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-8 bg-[#8B5CF6] hover:bg-[#7c3aed]"
                  >
                    <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="grid gap-4 border-b pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{cliente.tipo === 'PF' ? 'Nome Completo' : 'Razão Social'}</Label>
                      <Input
                        value={editData.nome || ''}
                        onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{cliente.tipo === 'PF' ? 'CPF' : 'CNPJ'}</Label>
                      <Input
                        value={editData.doc || ''}
                        onChange={(e) => setEditData({ ...editData, doc: e.target.value })}
                      />
                    </div>
                    {cliente.tipo === 'PF' && (
                      <div className="grid gap-2">
                        <Label>Data de Nascimento</Label>
                        <Input
                          type="date"
                          value={editData.data_nascimento || ''}
                          onChange={(e) =>
                            setEditData({ ...editData, data_nascimento: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold uppercase shrink-0">
                        {nome ? nome.substring(0, 2) : 'CL'}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800">
                          {nome || 'Não informado'}
                        </h2>
                        <p className="text-muted-foreground flex items-center gap-2 break-all text-sm">
                          <Mail className="w-4 h-4 shrink-0" /> {cliente.email}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
                      <div>{statusBadge(cliente.status)}</div>
                      <Badge variant="outline">{cliente.tipo}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {cliente.tipo === 'PF' && cliente.usuarios_pf?.[0]?.data_nascimento && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Data de Nascimento</span>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {format(new Date(cliente.usuarios_pf[0].data_nascimento), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
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
                      {renderDocumentLinks(
                        cliente.usuarios_pf[0].selfie_url,
                        'Visualizar Imagem',
                        <FileImage className="w-4 h-4" />,
                      )}
                    </div>
                  )}
                  {cliente.usuarios_pf[0].documento_identidade_url && (
                    <div className="p-4 border rounded-xl bg-slate-50">
                      <span className="text-sm font-medium text-slate-700 block mb-2">
                        Documento de Identidade
                      </span>
                      {renderDocumentLinks(
                        cliente.usuarios_pf[0].documento_identidade_url,
                        'Visualizar Documento',
                        <FileImage className="w-4 h-4" />,
                      )}
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
                          {renderDocumentLinks(
                            cliente.usuarios_pj[0].documentos_url,
                            'Visualizar Documentos',
                            <FileText className="w-4 h-4" />,
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Nenhum documento anexado.</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-slate-800 mb-4">Dados do Responsável</h3>
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-1">
                          <Label>Nome</Label>
                          <Input
                            value={editData.resp_nome || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, resp_nome: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>CPF</Label>
                          <Input
                            value={editData.resp_cpf || ''}
                            onChange={(e) => setEditData({ ...editData, resp_cpf: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Nascimento</Label>
                          <Input
                            type="date"
                            value={editData.resp_data_nascimento || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, resp_data_nascimento: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cliente.usuarios_pj[0].resp_selfie_url && (
                        <div className="p-4 border rounded-xl bg-slate-50">
                          <span className="text-sm font-medium text-slate-700 block mb-2">
                            Selfie (Responsável)
                          </span>
                          {renderDocumentLinks(
                            cliente.usuarios_pj[0].resp_selfie_url,
                            'Visualizar Imagem',
                            <FileImage className="w-4 h-4" />,
                          )}
                        </div>
                      )}
                      {cliente.usuarios_pj[0].resp_documento_url && (
                        <div className="p-4 border rounded-xl bg-slate-50">
                          <span className="text-sm font-medium text-slate-700 block mb-2">
                            Doc. Identidade (Responsável)
                          </span>
                          {renderDocumentLinks(
                            cliente.usuarios_pj[0].resp_documento_url,
                            'Visualizar Documento',
                            <FileImage className="w-4 h-4" />,
                          )}
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
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          {req.status === 'aprovado' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          ) : req.status === 'reprovado' ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize text-sm sm:text-base">{req.tipo}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800 text-sm sm:text-base">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(req.valor_total)}
                        </p>
                        <div className="mt-1">{statusBadge(req.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Saldo em Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Saldo Disponível</span>
                  <p className="text-3xl font-bold text-[#8B5CF6]">
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
