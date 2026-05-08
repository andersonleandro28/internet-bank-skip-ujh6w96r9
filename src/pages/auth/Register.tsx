import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { maskCpf, maskCnpj } from '@/lib/format'
import { User, Building2, CheckCircle2, ArrowLeft, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import logoAclop from '@/assets/logo-aclop-ok8-a16ad.png'

type TipoConta = 'PF' | 'PJ' | null

const Confetti = () => {
  const colors = ['bg-purple-500', 'bg-blue-500', 'bg-pink-500', 'bg-yellow-500', 'bg-green-500']
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(60)].map((_, i) => {
        const style = {
          left: `${Math.random() * 100}vw`,
          animationDelay: `${Math.random() * 0.5}s`,
          animationDuration: `${1.5 + Math.random() * 2}s`,
        }
        return (
          <div
            key={i}
            className={cn(
              'absolute top-[-5vh] w-2 h-3 rounded-sm animate-confetti',
              colors[i % colors.length],
            )}
            style={style}
          />
        )
      })}
    </div>
  )
}

const FileUpload = ({
  label,
  accept,
  onChange,
  file,
  id,
}: {
  label: string
  accept: string
  onChange: (e: any) => void
  file: File | null
  id: string
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-slate-600 font-medium">
      {label}
    </Label>
    <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group bg-slate-50/50">
      {file ? (
        <>
          <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
          <span className="text-sm font-medium text-primary">{file.name}</span>
          <span className="text-xs text-muted-foreground mt-1">Clique para trocar de arquivo</span>
        </>
      ) : (
        <>
          <Camera className="w-8 h-8 text-slate-400 mb-2 group-hover:text-primary transition-colors" />
          <span className="text-sm text-slate-600 font-medium">Clique para enviar ou arraste</span>
          <span className="text-xs text-slate-400 mt-1">PNG, JPG ou PDF (máx. 5MB)</span>
        </>
      )}
      <Input
        id={id}
        type="file"
        accept={accept}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={onChange}
        required
      />
    </div>
  </div>
)

export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [tipo, setTipo] = useState<TipoConta>(null)
  const [isFading, setIsFading] = useState(false)

  // Generic fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // PF fields
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [selfie, setSelfie] = useState<File | null>(null)

  // PJ fields
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [documentos, setDocumentos] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  const handleTipoSelect = (novoTipo: TipoConta) => {
    setIsFading(true)
    setTimeout(() => {
      setTipo(novoTipo)
      setIsFading(false)
    }, 150)
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0])
    }
  }

  const uploadFile = async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    const filePath = `cadastros/${fileName}`

    const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file)
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data, error } = await signUp(email, password, {
        data: { tipo, name: tipo === 'PF' ? nome : razaoSocial },
      })

      if (error) throw error
      if (!data?.user) throw new Error('Erro ao criar usuário')

      const userId = data.user.id

      // Sincronização defensiva: garante que as tabelas base existem.
      // Se o ID for de um usuário falso (e-mail já existe), isso falhará com 23503 (FK violation em auth.users).
      const { error: userError } = await supabase.from('usuarios').insert({
        id: userId,
        email: email,
        tipo: tipo as 'PF' | 'PJ',
        status: 'pendente',
        role: 'cliente',
      })

      if (userError) {
        if (userError.code === '23503') {
          throw new Error('Este e-mail já está cadastrado. Por favor, faça login.')
        }
        if (userError.code !== '23505') throw userError // 23505 = já existe (ok)
      }

      const { error: contaError } = await supabase.from('contas').insert({
        user_id: userId,
        saldo: 0,
        saldo_bloqueado: 0,
      })
      if (contaError && contaError.code !== '23505') throw contaError

      let fileUrl = ''

      if (tipo === 'PF') {
        if (selfie) fileUrl = await uploadFile(selfie, userId)

        const { error: pfError } = await supabase.from('usuarios_pf').insert({
          user_id: userId,
          cpf,
          nome,
          data_nascimento: dataNascimento || null,
          selfie_url: fileUrl,
        })
        if (pfError) {
          if (pfError.code === '23503') throw new Error('Este e-mail já está cadastrado.')
          if (pfError.code === '23505') throw new Error('Este CPF já está em uso.')
          throw pfError
        }
      } else if (tipo === 'PJ') {
        if (documentos) fileUrl = await uploadFile(documentos, userId)

        const { error: pjError } = await supabase.from('usuarios_pj').insert({
          user_id: userId,
          cnpj,
          razao_social: razaoSocial,
          documentos_url: fileUrl,
        })
        if (pjError) {
          if (pjError.code === '23503') throw new Error('Este e-mail já está cadastrado.')
          if (pjError.code === '23505') throw new Error('Este CNPJ já está em uso.')
          throw pjError
        }
      }

      setSuccess(true)
      toast.success('Cadastro enviado com sucesso!', {
        style: { background: '#22c55e', color: '#fff', border: 'none' },
        icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      })
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Ocorreu um erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  // SUCCESS STATE
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-5">
        <Confetti />
        <Card className="w-full max-w-md border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] animate-in fade-in zoom-in duration-500 text-center py-10 px-5 rounded-[16px]">
          <CardContent className="flex flex-col items-center gap-5 p-0">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Cadastro recebido!
            </h2>
            <p className="text-slate-500 text-base leading-relaxed">
              Aguardando aprovação do administrador. Você receberá um e-mail assim que sua conta for
              ativada.
            </p>
            <Button
              className="mt-8 w-full h-14 text-base font-medium rounded-xl"
              onClick={() => navigate('/login')}
            >
              Voltar para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // EMPTY STATE (Type Selection)
  if (!tipo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-5 relative">
        <div
          className={cn(
            'w-full max-w-md transition-opacity duration-300',
            isFading ? 'opacity-0' : 'opacity-100 animate-in fade-in duration-500',
          )}
        >
          <div className="flex justify-center mb-10">
            <Link
              to="/"
              className="bg-black/95 p-5 rounded-2xl shadow-xl hover:scale-105 transition-transform"
            >
              <img src={logoAclop} alt="ACLOP Bank" className="h-16 object-contain" />
            </Link>
          </div>

          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="text-center pb-8 px-0">
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-800">
                Abra sua conta
              </CardTitle>
              <CardDescription className="text-base text-slate-500 mt-2">
                Escolha o tipo de conta para começar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
              <button
                onClick={() => handleTipoSelect('PF')}
                className="w-full flex items-center p-5 border border-slate-200 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/15 transition-all duration-300 group bg-white"
              >
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors mr-5 shrink-0">
                  <User className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg text-slate-800 group-hover:text-primary transition-colors">
                    Pessoa Física
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">Para você (CPF)</p>
                </div>
              </button>

              <button
                onClick={() => handleTipoSelect('PJ')}
                className="w-full flex items-center p-5 border border-slate-200 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/15 transition-all duration-300 group bg-white"
              >
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors mr-5 shrink-0">
                  <Building2 className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg text-slate-800 group-hover:text-primary transition-colors">
                    Pessoa Jurídica
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">Para sua empresa (CNPJ)</p>
                </div>
              </button>
            </CardContent>
            <CardFooter className="justify-center pt-8 px-0">
              <div className="text-base text-slate-500">
                Já tem uma conta?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Faça login
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // FORM STATE
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-5 py-12">
      <div
        className={cn(
          'w-full max-w-xl transition-opacity duration-300',
          isFading
            ? 'opacity-0'
            : 'opacity-100 animate-in fade-in slide-in-from-bottom-4 duration-500',
        )}
      >
        <Button
          variant="ghost"
          onClick={() => handleTipoSelect(null)}
          className="mb-6 text-slate-500 hover:text-slate-800 hover:bg-slate-100 -ml-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>

        <Card className="border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[16px] bg-white">
          <CardHeader className="space-y-2 pb-6 pt-8 px-6 sm:px-8">
            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-800">
              Cadastro {tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </CardTitle>
            <CardDescription className="text-base text-slate-500">
              Preencha os dados abaixo para solicitar sua conta
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
              {errorMsg && (
                <div className="bg-red-50/80 text-red-600 p-4 rounded-xl text-sm flex flex-col gap-3 border border-red-100 animate-in fade-in zoom-in-95">
                  <span className="font-medium">{errorMsg}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="w-fit bg-white hover:bg-red-50 border-red-200 text-red-700"
                  >
                    Tentar novamente
                  </Button>
                </div>
              )}

              {loading && !errorMsg ? (
                <div className="space-y-5 animate-pulse">
                  <Skeleton className="h-[72px] w-full rounded-xl bg-slate-100" />
                  <Skeleton className="h-[72px] w-full rounded-xl bg-slate-100" />
                  <Skeleton className="h-[72px] w-full rounded-xl bg-slate-100" />
                  <Skeleton className="h-[120px] w-full rounded-xl bg-slate-100" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Dados de Acesso */}
                  <div className="space-y-5">
                    <h3 className="font-semibold text-sm text-slate-400 uppercase tracking-wider">
                      Dados de Acesso
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-600">
                          E-mail
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 transition-all text-base"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-600">
                          Senha
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Crie uma senha forte"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 transition-all text-base"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-slate-100" />

                  {/* Dados Específicos */}
                  <div className="space-y-5">
                    <h3 className="font-semibold text-sm text-slate-400 uppercase tracking-wider">
                      Dados {tipo === 'PF' ? 'Pessoais' : 'da Empresa'}
                    </h3>

                    {tipo === 'PF' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome" className="text-slate-600">
                            Nome Completo
                          </Label>
                          <Input
                            id="nome"
                            placeholder="João da Silva"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 transition-all text-base"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cpf" className="text-slate-600">
                              CPF
                            </Label>
                            <Input
                              id="cpf"
                              placeholder="000.000.000-00"
                              value={cpf}
                              onChange={(e) => setCpf(maskCpf(e.target.value))}
                              className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 transition-all text-base"
                              required
                              maxLength={14}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dataNascimento" className="text-slate-600">
                              Data de Nascimento
                            </Label>
                            <Input
                              id="dataNascimento"
                              type="date"
                              value={dataNascimento}
                              onChange={(e) => setDataNascimento(e.target.value)}
                              className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 transition-all text-base"
                              required
                            />
                          </div>
                        </div>
                        <FileUpload
                          id="selfie"
                          label="Selfie (Foto do rosto)"
                          accept="image/*"
                          file={selfie}
                          onChange={(e) => handleFileChange(e, setSelfie)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="razaoSocial" className="text-slate-600">
                            Razão Social
                          </Label>
                          <Input
                            id="razaoSocial"
                            placeholder="Sua Empresa LTDA"
                            value={razaoSocial}
                            onChange={(e) => setRazaoSocial(e.target.value)}
                            className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 transition-all text-base"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cnpj" className="text-slate-600">
                            CNPJ
                          </Label>
                          <Input
                            id="cnpj"
                            placeholder="00.000.000/0000-00"
                            value={cnpj}
                            onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                            className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 transition-all text-base"
                            required
                            maxLength={18}
                          />
                        </div>
                        <FileUpload
                          id="documentos"
                          label="Documentos (Contrato Social, etc)"
                          accept=".pdf,image/*"
                          file={documentos}
                          onChange={(e) => handleFileChange(e, setDocumentos)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="px-6 sm:px-8 pb-8 pt-0">
              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar para aprovação'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
