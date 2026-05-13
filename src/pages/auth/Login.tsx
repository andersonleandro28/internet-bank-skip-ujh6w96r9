import { useState, useEffect } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import logoAclop from '@/assets/aclop-bank-logo-998a8.png'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, resetPasswordForEmail } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)

  useEffect(() => {
    const lastRequest = localStorage.getItem('lastResetRequest')
    if (lastRequest) {
      const elapsed = Math.floor((Date.now() - parseInt(lastRequest)) / 1000)
      if (elapsed < 60) {
        setCooldownTime(60 - elapsed)
      }
    }
  }, [])

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownTime])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await signIn(email, password)

    if (error) {
      if (error.message === 'Email not confirmed') {
        setErrorMsg('Por favor, confirme seu e-mail antes de entrar.')
      } else if (error.message === 'Invalid login credentials') {
        setErrorMsg('E-mail ou senha incorretos.')
      } else {
        setErrorMsg('Credenciais inválidas.')
      }
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cooldownTime > 0) {
      setErrorMsg(`Aguarde ${cooldownTime} segundos para solicitar novamente.`)
      return
    }

    setResetLoading(true)
    setErrorMsg('')
    try {
      const response: any = await resetPasswordForEmail(resetEmail)
      const error = response?.error || response?.data?.error

      setResetLoading(false)

      if (error) {
        const errorMsgStr = typeof error === 'string' ? error : error?.message || ''

        if (
          error?.status === 429 ||
          errorMsgStr.includes('rate limit') ||
          error?.code === 'over_email_send_rate_limit' ||
          errorMsgStr.includes('Muitos') ||
          errorMsgStr.includes('pedidos')
        ) {
          setErrorMsg(
            'Muitos e-mails enviados. Aguarde alguns instantes antes de tentar novamente.',
          )
          setCooldownTime(60)
          localStorage.setItem('lastResetRequest', Date.now().toString())
        } else {
          setErrorMsg(
            errorMsgStr ||
              'Erro ao enviar email de recuperação. Verifique o endereço e tente novamente.',
          )
        }
      } else {
        toast({
          title: 'Email enviado',
          description:
            'Se o email existir em nossa base, você receberá um link para redefinir sua senha.',
        })
        setCooldownTime(60)
        localStorage.setItem('lastResetRequest', Date.now().toString())
        setIsForgotPassword(false)
        setResetEmail('')
      }
    } catch (error: any) {
      setResetLoading(false)
      const errorMsgStr = typeof error === 'string' ? error : error?.message || ''

      if (
        error?.status === 429 ||
        errorMsgStr.includes('rate limit') ||
        error?.code === 'over_email_send_rate_limit' ||
        errorMsgStr.includes('Muitos') ||
        errorMsgStr.includes('pedidos')
      ) {
        setErrorMsg('Muitos e-mails enviados. Aguarde alguns instantes antes de tentar novamente.')
        setCooldownTime(60)
        localStorage.setItem('lastResetRequest', Date.now().toString())
      } else {
        setErrorMsg('Erro ao enviar email de recuperação. Verifique o endereço e tente novamente.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <div className="p-5 flex items-center gap-3">
            <img src={logoAclop} alt="ACLOP Logo" className="h-14 object-contain" />
            <span className="text-slate-900 font-bold text-3xl tracking-wider">ACLOP</span>
          </div>
        </div>

        <Card className="border-none shadow-elevation relative overflow-hidden">
          {isForgotPassword ? (
            <div className="animate-fade-in">
              <CardHeader className="space-y-1 text-center pb-6">
                <CardTitle className="text-2xl font-bold tracking-tight">Recuperar senha</CardTitle>
                <CardDescription>Enviaremos um link para o seu email</CardDescription>
              </CardHeader>
              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4">
                  {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{errorMsg}</div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Email cadastrado</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="seu@email.com"
                      className="h-12 px-4"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={resetLoading}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col pt-4 space-y-4">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={resetLoading || cooldownTime > 0}
                  >
                    {resetLoading
                      ? 'Enviando...'
                      : cooldownTime > 0
                        ? `Aguarde ${cooldownTime}s`
                        : 'Enviar link de recuperação'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setIsForgotPassword(false)
                      setErrorMsg('')
                    }}
                    disabled={resetLoading}
                  >
                    Voltar para o login
                  </Button>
                </CardFooter>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <CardHeader className="space-y-1 text-center pb-6">
                <CardTitle className="text-2xl font-bold tracking-tight">
                  Acesse sua conta
                </CardTitle>
                <CardDescription>Insira seu email e senha para entrar</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{errorMsg}</div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="h-12 px-4"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true)
                          setErrorMsg('')
                          setResetEmail(email)
                        }}
                        className="text-sm font-medium text-accent hover:underline bg-transparent border-none p-0 cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-12 px-4"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col pt-4 space-y-4">
                  <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    Ainda não é cliente?{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-primary hover:text-accent hover:underline transition-colors"
                    >
                      Abra sua conta
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
