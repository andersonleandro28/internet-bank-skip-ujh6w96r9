import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  getPerfilUsuario,
  getHistoricoLogins,
  getSpreadUSDT,
  updateSpreadUSDT,
  getLimiteAlertaSaldo,
  updateLimiteAlertaSaldo,
} from '@/services/perfil'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Clock,
  MonitorSmartphone,
  Settings,
  SlidersHorizontal,
  Package,
  LayoutDashboard,
  FileText,
  User,
} from 'lucide-react'

export default function Perfil() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [perfil, setPerfil] = useState<any>(null)
  const [detalhes, setDetalhes] = useState<any>(null)
  const [historico, setHistorico] = useState<any[]>([])

  const [spreadUSDT, setSpreadUSDT] = useState<number>(0)
  const [limiteAlerta, setLimiteAlerta] = useState<number>(500)
  const [savingConfigs, setSavingConfigs] = useState(false)

  const loadData = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      const { usuario, detalhes } = await getPerfilUsuario(user.id)
      setPerfil(usuario)
      setDetalhes(detalhes)

      if (usuario.role === 'admin') {
        const spread = await getSpreadUSDT()
        setSpreadUSDT(spread)
        const limite = await getLimiteAlertaSaldo()
        setLimiteAlerta(limite)
      } else {
        const hist = await getHistoricoLogins(user.id)
        setHistorico(hist)
      }
    } catch (err: any) {
      setError('Não foi possível carregar os dados do perfil.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleSaveConfigs = async () => {
    if (!user) return
    try {
      setSavingConfigs(true)
      await updateSpreadUSDT(spreadUSDT, user.id)
      await updateLimiteAlertaSaldo(limiteAlerta, user.id)
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      })
      console.error(err)
    } finally {
      setSavingConfigs(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-md mx-auto p-4 pb-24 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-md mx-auto p-4 pb-24 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-destructive text-center">
          <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{error}</p>
        </div>
        <Button onClick={loadData} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="container max-w-md mx-auto p-4 pb-24 text-center text-muted-foreground mt-10">
        Dados não encontrados.
      </div>
    )
  }

  const isAdmin = perfil.role === 'admin'

  return (
    <div className="container max-w-md mx-auto p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          {isAdmin ? 'Configurações' : 'Perfil'}
        </h1>
      </div>

      {isAdmin ? (
        <div className="space-y-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Configurações Globais
              </CardTitle>
              <CardDescription>Ajuste os parâmetros gerais do sistema.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="spread">Spread USDT (%)</Label>
                  <Input
                    id="spread"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={spreadUSDT}
                    onChange={(e) => setSpreadUSDT(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limite_alerta">Limite de Alerta de Saldo (R$)</Label>
                  <Input
                    id="limite_alerta"
                    type="number"
                    min="0"
                    step="1"
                    value={limiteAlerta}
                    onChange={(e) => setLimiteAlerta(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>
              </div>
              <Button onClick={handleSaveConfigs} disabled={savingConfigs} className="w-full">
                {savingConfigs ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg">Navegação Administrativa</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 grid gap-3">
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" asChild>
                <Link to="/admin/painel">
                  <LayoutDashboard className="w-5 h-5 mr-3 text-slate-500" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Painel Administrativo</span>
                    <span className="text-xs text-slate-500 font-normal">
                      Visão geral do sistema
                    </span>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" asChild>
                <Link to="/admin/configuracoes-taxas">
                  <SlidersHorizontal className="w-5 h-5 mr-3 text-slate-500" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Configurar Serviços e Taxas</span>
                    <span className="text-xs text-slate-500 font-normal">
                      Gerenciar taxas padrão
                    </span>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" asChild>
                <Link to="/admin/gerenciar-cestas">
                  <Package className="w-5 h-5 mr-3 text-slate-500" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Gerenciar Cestas de Clientes</span>
                    <span className="text-xs text-slate-500 font-normal">
                      Cestas personalizadas
                    </span>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" asChild>
                <Link to="/admin/auditoria">
                  <FileText className="w-5 h-5 mr-3 text-slate-500" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Auditoria</span>
                    <span className="text-xs text-slate-500 font-normal">
                      Logs de atividades e ações
                    </span>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Button variant="destructive" className="w-full h-12" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-2" />
            Sair do Sistema
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-primary/90 to-primary relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            </div>
            <CardContent className="pt-0 relative px-6 pb-6">
              <div className="absolute -top-14 left-6">
                <div className="w-28 h-28 rounded-full border-4 border-white bg-slate-100 overflow-hidden flex items-center justify-center shadow-md">
                  {detalhes?.selfie_url || detalhes?.documentos_url ? (
                    <img
                      src={detalhes.selfie_url || detalhes.documentos_url}
                      alt="Perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                </div>
              </div>

              <div className="pt-16">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">
                      {detalhes?.nome || detalhes?.razao_social || 'Usuário'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 truncate">{perfil.email}</p>
                  </div>
                  <Badge
                    variant={
                      perfil.status === 'aprovado'
                        ? 'default'
                        : perfil.status === 'pendente'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className="capitalize mt-1 shrink-0"
                  >
                    {perfil.status}
                  </Badge>
                </div>

                <div className="mt-6 bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Documento</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {detalhes?.cpf || detalhes?.cnpj || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-sm text-slate-500">Tipo de Conta</span>
                    <span className="text-sm font-semibold text-slate-700">{perfil.tipo}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full h-12 text-destructive border-destructive/20 hover:text-destructive hover:bg-destructive/5"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair da Conta
          </Button>

          <div className="space-y-4 mt-10">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 px-1">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Histórico de Logins
            </h3>

            {historico.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-sm">
                Nenhum registro de login recente encontrado.
              </div>
            ) : (
              <div className="grid gap-3">
                {historico.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-start gap-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                      <MonitorSmartphone className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {log.dispositivo || 'Dispositivo Desconhecido'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                        <span className="shrink-0">•</span>
                        <span className="truncate">IP: {log.ip || 'Não detectado'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
