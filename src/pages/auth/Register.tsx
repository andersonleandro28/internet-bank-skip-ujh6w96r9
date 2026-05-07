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

export default function Register() {
  const navigate = useNavigate()

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock register -> redirect to home
    navigate('/')
  }

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
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight">Abra sua conta</CardTitle>
            <CardDescription>Preencha os dados abaixo para começar</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" placeholder="João da Silva" className="h-12 px-4" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" placeholder="000.000.000-00" className="h-12 px-4" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Data de Nascimento</Label>
                  <Input id="dob" type="date" className="h-12 px-4" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="h-12 px-4"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Crie uma Senha (6 dígitos)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  maxLength={6}
                  className="h-12 px-4"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Esta senha será usada para acessar o app e fazer transações.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col pt-4 space-y-4">
              <Button type="submit" className="w-full h-12 text-base">
                Continuar
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Já possui conta?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary hover:text-accent hover:underline transition-colors"
                >
                  Fazer login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
