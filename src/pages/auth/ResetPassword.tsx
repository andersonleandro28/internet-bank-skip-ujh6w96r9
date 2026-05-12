import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import logoAclop from '@/assets/aclop-bank-logo-998a8.png'
import { supabase } from '@/lib/supabase/client'
import { Loader2, XCircle } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isValidating, setIsValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setIsValidToken(false)
        setIsValidating(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('password_reset_tokens')
          .select('id')
          .eq('token', token)
          .single()

        if (error || !data) {
          setIsValidToken(false)
        } else {
          setIsValidToken(true)
        }
      } catch (err) {
        setIsValidToken(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'Senhas nao conferem', variant: 'destructive' })
      return
    }

    if (password.length < 8) {
      toast({
        title: 'Erro',
        description: 'Senha deve ter minimo 8 caracteres',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke('redefinir-senha', {
        body: { token, password },
      })

      if (error) throw error

      if (data?.error) {
        throw new Error(data.error)
      }

      toast({ title: 'Sucesso', description: 'Senha redefinida com sucesso' })
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao redefinir a senha.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-[#1a4d2e] animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Validando link de segurança...</p>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center p-8 border-none shadow-elevation bg-white animate-fade-in-up">
          <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <XCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a4d2e] mb-3">Link Inválido ou Expirado</h2>
          <p className="text-slate-600 mb-8">
            O link que você está tentando usar não é mais válido, expirou ou já foi utilizado.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full h-12 bg-slate-200 text-slate-800 hover:bg-slate-300"
          >
            Voltar ao login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      <div className="w-full max-w-md animate-fade-in-up z-10">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <img src={logoAclop} alt="ACLOP Logo" className="h-16 object-contain drop-shadow-sm" />
          </div>
        </div>

        <Card className="border-none shadow-elevation bg-white">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-[#1a4d2e]">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-slate-500">
              Crie uma nova senha para sua conta
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 px-4 focus-visible:ring-[#1a4d2e]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 px-4 focus-visible:ring-[#1a4d2e]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col pt-4 space-y-3">
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-[#7fff00] text-[#1a4d2e] hover:bg-[#6be600] transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Redefinir senha
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full h-12 text-base border-slate-200 text-slate-600 hover:bg-slate-100"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
