import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  getPerfilUsuario,
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
import { useToast } from '@/components/ui/use-toast'
import {
  ArrowLeft,
  LogOut,
  Settings,
  SlidersHorizontal,
  Package,
  LayoutDashboard,
  FileText,
  User,
  Upload,
  Trash2,
  Save,
} from 'lucide-react'

export default function Perfil() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [perfil, setPerfil] = useState<any>(null)
  const [detalhes, setDetalhes] = useState<any>(null)

  const [spreadUSDT, setSpreadUSDT] = useState<number>(0)
  const [limiteAlerta, setLimiteAlerta] = useState<number>(500)
  const [savingConfigs, setSavingConfigs] = useState(false)

  const mockInitialData = {
    nome: 'Anderson Leandro',
    email: 'andersonleandro28@gmail.com',
    telefone: '(11) 98765-4321',
    cpf: '123.456.789-00',
    dataNascimento: '1990-03-15',
    rua: 'Rua das Flores',
    numero: '123',
    complemento: 'Apto 456',
    cep: '01234-567',
    cidade: 'São Paulo',
    estado: 'SP',
  }

  // Customer Profile States (Mocked initially as requested)
  const [formData, setFormData] = useState({ ...mockInitialData })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [passwords, setPasswords] = useState({
    atual: '',
    nova: '',
    confirmacao: '',
  })

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
        // Update mock data with real data if available
        setFormData((prev) => ({
          ...prev,
          nome: detalhes?.nome || detalhes?.razao_social || prev.nome,
          email: usuario.email || prev.email,
          cpf: detalhes?.cpf || detalhes?.cnpj || prev.cpf,
          dataNascimento: detalhes?.data_nascimento || prev.dataNascimento,
        }))
        if (detalhes?.selfie_url || detalhes?.documentos_url) {
          setAvatarUrl(detalhes.selfie_url || detalhes.documentos_url)
          setPreviewUrl(detalhes.selfie_url || detalhes.documentos_url)
        }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteImage = () => {
    setPreviewUrl(null)
  }

  const isFormValid = !!(
    formData.nome &&
    formData.email &&
    formData.telefone &&
    formData.dataNascimento &&
    formData.cep &&
    formData.rua &&
    formData.numero &&
    formData.cidade &&
    formData.estado
  )

  const isPasswordValid =
    (!passwords.atual && !passwords.nova && !passwords.confirmacao) ||
    (!!passwords.atual &&
      !!passwords.nova &&
      !!passwords.confirmacao &&
      passwords.nova === passwords.confirmacao)

  const canSave = isFormValid && isPasswordValid

  const handleCustomerSave = () => {
    if (!canSave) return

    setAvatarUrl(previewUrl)
    setPasswords({ atual: '', nova: '', confirmacao: '' })
    toast({
      title: 'Sucesso',
      description: 'Seus dados foram atualizados com sucesso.',
    })
  }

  const handleCustomerCancel = () => {
    setFormData({
      ...mockInitialData,
      nome: detalhes?.nome || detalhes?.razao_social || mockInitialData.nome,
      email: perfil?.email || mockInitialData.email,
      cpf: detalhes?.cpf || detalhes?.cnpj || mockInitialData.cpf,
      dataNascimento: detalhes?.data_nascimento || mockInitialData.dataNascimento,
    })
    setPreviewUrl(avatarUrl)
    setPasswords({ atual: '', nova: '', confirmacao: '' })
    toast({
      description: 'Alterações canceladas e dados restaurados.',
    })
  }

  const renderError = (fieldValue: string) => {
    if (!fieldValue) {
      return <span className="text-xs text-red-500 font-medium">Campo obrigatório</span>
    }
    return null
  }

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto p-4 pb-24 space-y-4">
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
      <div className="container max-w-2xl mx-auto p-4 pb-24 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
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
      <div className="container max-w-2xl mx-auto p-4 pb-24 text-center text-muted-foreground mt-10">
        Dados não encontrados.
      </div>
    )
  }

  const isAdmin = perfil.role === 'admin'

  const renderAdminView = () => (
    <div className="space-y-6 max-w-md mx-auto">
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
                <span className="text-xs text-slate-500 font-normal">Visão geral do sistema</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" asChild>
            <Link to="/admin/configuracoes-taxas">
              <SlidersHorizontal className="w-5 h-5 mr-3 text-slate-500" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Configurar Serviços e Taxas</span>
                <span className="text-xs text-slate-500 font-normal">Gerenciar taxas padrão</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" asChild>
            <Link to="/admin/gerenciar-cestas">
              <Package className="w-5 h-5 mr-3 text-slate-500" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Gerenciar Cestas de Clientes</span>
                <span className="text-xs text-slate-500 font-normal">Cestas personalizadas</span>
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
  )

  const renderCustomerView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center justify-center mb-8 pt-4">
        <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-[#1a4d2e] bg-slate-100 flex items-center justify-center shadow-md">
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-[#1a4d2e]">
              {formData.nome
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
            </span>
          )}
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-800 text-center leading-tight">
          {formData.nome || 'Cliente'}
        </h2>
        <p className="text-slate-500 text-sm mt-1">{formData.email}</p>
      </div>

      {/* Seção 1: Dados Pessoais */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-[#1a4d2e] text-white p-4">
          <CardTitle className="text-lg">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Seu nome completo"
              />
              {renderError(formData.nome)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
              />
              {renderError(formData.email)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">
                Telefone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
              {renderError(formData.telefone)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                disabled
                readOnly
                className="bg-slate-50 cursor-not-allowed opacity-70"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dataNascimento">
                Data de Nascimento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              />
              {renderError(formData.dataNascimento)}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">
                  CEP <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                />
                {renderError(formData.cep)}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="rua">
                  Rua <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rua"
                  value={formData.rua}
                  onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                  placeholder="Nome da rua"
                />
                {renderError(formData.rua)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">
                  Número <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Número"
                />
                {renderError(formData.numero)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  placeholder="Apto, Sala, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">
                  Cidade <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Sua cidade"
                />
                {renderError(formData.cidade)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">
                  Estado <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="Seu estado (Ex: SP)"
                />
                {renderError(formData.estado)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 2: Foto de Perfil */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-[#1a4d2e] text-white p-4">
          <CardTitle className="text-lg">Foto de Perfil</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex justify-center items-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-[#1a4d2e]">
                  {formData.nome
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || 'AL'}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="foto"
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                Carregar Nova Foto
              </Label>
              <Input
                id="foto"
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={handleImageChange}
              />
              {previewUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                  onClick={handleDeleteImage}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar foto
                </Button>
              )}
              <p className="text-xs text-slate-500">Recomendado: JPG, PNG. Tamanho máximo 2MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3: Segurança */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-[#1a4d2e] text-white p-4">
          <CardTitle className="text-lg">Segurança</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Preencha apenas se desejar alterar sua senha atual.
          </p>
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">
              Senha Atual{' '}
              {(passwords.nova || passwords.confirmacao) && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="senhaAtual"
              type="password"
              value={passwords.atual}
              onChange={(e) => setPasswords({ ...passwords, atual: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">
                Nova Senha{' '}
                {(passwords.atual || passwords.confirmacao) && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Input
                id="novaSenha"
                type="password"
                value={passwords.nova}
                onChange={(e) => setPasswords({ ...passwords, nova: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmacaoSenha">
                Confirmar Nova Senha{' '}
                {(passwords.atual || passwords.nova) && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="confirmacaoSenha"
                type="password"
                value={passwords.confirmacao}
                onChange={(e) => setPasswords({ ...passwords, confirmacao: e.target.value })}
              />
              {passwords.nova &&
                passwords.confirmacao &&
                passwords.nova !== passwords.confirmacao && (
                  <span className="text-xs text-red-500 font-medium">As senhas não coincidem</span>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Botões */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 pb-8">
        <Button
          variant="outline"
          className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 border-none"
          onClick={handleCustomerCancel}
        >
          Cancelar
        </Button>
        <Button
          className="w-full sm:w-auto bg-[#7fff00] text-[#1a4d2e] hover:bg-[#6be600] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCustomerSave}
          disabled={!canSave}
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      {/* Signout separately */}
      <div className="pt-2 border-t border-slate-100">
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-12"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-24">
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
          {isAdmin ? 'Configurações' : 'Meu Perfil'}
        </h1>
      </div>

      {isAdmin ? renderAdminView() : renderCustomerView()}
    </div>
  )
}
