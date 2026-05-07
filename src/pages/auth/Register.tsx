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
import { User, Building2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

type TipoConta = 'PF' | 'PJ' | null

export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [tipo, setTipo] = useState<TipoConta>(null)

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
        if (pfError) throw pfError
      } else if (tipo === 'PJ') {
        if (documentos) fileUrl = await uploadFile(documentos, userId)

        const { error: pjError } = await supabase.from('usuarios_pj').insert({
          user_id: userId,
          cnpj,
          razao_social: razaoSocial,
          documentos_url: fileUrl,
        })
        if (pjError) throw pjError
      }

      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Ocorreu um erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  // EMPTY STATE (Type Selection)
  if (!tipo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-lg animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-primary">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl">
                N
              </div>
              NovaBank
            </Link>
          </div>

          <Card className="border-none shadow-elevation">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight">Abra sua conta</CardTitle>
              <CardDescription>Escolha o tipo de conta que deseja abrir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={() => setTipo('PF')}
                className="w-full flex items-center p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors mr-4">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-base">Pessoa Física</h3>
                  <p className="text-sm text-muted-foreground">Para você (CPF)</p>
                </div>
              </button>

              <button
                onClick={() => setTipo('PJ')}
                className="w-full flex items-center p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors mr-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-base">Pessoa Jurídica</h3>
                  <p className="text-sm text-muted-foreground">Para sua empresa (CNPJ)</p>
                </div>
              </button>
            </CardContent>
            <CardFooter className="justify-center border-t pt-6">
              <div className="text-sm text-muted-foreground">
                Já possui conta?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Fazer login
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // SUCCESS STATE
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-none shadow-elevation animate-fade-in-up text-center py-8">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Cadastro recebido!</h2>
            <p className="text-muted-foreground">
              Aguardando aprovação do administrador. Você receberá um e-mail assim que sua conta for
              ativada.
            </p>
            <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
              Ir para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // FORM STATE
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl animate-fade-in-up">
        <Button
          variant="ghost"
          onClick={() => setTipo(null)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-none shadow-elevation">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Cadastro {tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </CardTitle>
            <CardDescription>Preencha os dados abaixo para enviar para aprovação</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex flex-col gap-2">
                  <span>{errorMsg}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="w-fit"
                  >
                    Tentar novamente
                  </Button>
                </div>
              )}

              {loading && !errorMsg ? (
                <div className="space-y-4 animate-pulse">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Dados de Acesso */}
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-medium text-sm text-slate-500 uppercase">
                      Dados de Acesso
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Crie uma senha forte"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {/* Dados Específicos */}
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-medium text-sm text-slate-500 uppercase">
                      Dados {tipo === 'PF' ? 'Pessoais' : 'da Empresa'}
                    </h3>

                    {tipo === 'PF' ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome Completo</Label>
                          <Input
                            id="nome"
                            placeholder="João da Silva"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cpf">CPF</Label>
                            <Input
                              id="cpf"
                              placeholder="000.000.000-00"
                              value={cpf}
                              onChange={(e) => setCpf(maskCpf(e.target.value))}
                              required
                              maxLength={14}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                            <Input
                              id="dataNascimento"
                              type="date"
                              value={dataNascimento}
                              onChange={(e) => setDataNascimento(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="selfie">Selfie (Foto do rosto)</Label>
                          <Input
                            id="selfie"
                            type="file"
                            accept="image/*"
                            className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            onChange={(e) => handleFileChange(e, setSelfie)}
                            required
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="razaoSocial">Razão Social</Label>
                          <Input
                            id="razaoSocial"
                            placeholder="Sua Empresa LTDA"
                            value={razaoSocial}
                            onChange={(e) => setRazaoSocial(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cnpj">CNPJ</Label>
                          <Input
                            id="cnpj"
                            placeholder="00.000.000/0000-00"
                            value={cnpj}
                            onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                            required
                            maxLength={18}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="documentos">Documentos (Contrato Social, etc)</Label>
                          <Input
                            id="documentos"
                            type="file"
                            accept=".pdf,image/*"
                            className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            onChange={(e) => handleFileChange(e, setDocumentos)}
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col pt-4 space-y-4">
              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar para aprovação'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
