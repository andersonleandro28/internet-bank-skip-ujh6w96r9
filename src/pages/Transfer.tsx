import { useState } from 'react'
import { Search, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/format'
import { useBank } from '@/hooks/use-bank'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

const frequentContacts = [
  {
    id: 1,
    name: 'Ana Clara Souza',
    type: 'PIX',
    key: 'ana.clara@email.com',
    img: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2',
  },
  {
    id: 2,
    name: 'Carlos Ferreira',
    type: 'Conta',
    key: 'Ag: 0001 Cc: 12345-6',
    img: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
  },
]

export default function Transfer() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [recipient, setRecipient] = useState<any>(null)
  const [amountStr, setAmountStr] = useState('0,00')
  const [loading, setLoading] = useState(false)

  const { conta, refreshData } = useBank()
  const { user } = useAuth()

  const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.')) || 0

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val === '') val = '0'
    const num = parseInt(val, 10) / 100
    setAmountStr(
      num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    )
  }

  const selectRecipient = (contact: any) => {
    setRecipient(contact)
    setStep(2)
  }

  const confirmTransfer = async () => {
    if (!user || !conta) return
    setLoading(true)

    // Create new transaction logic
    const { error: reqError } = await supabase.from('requisicoes').insert({
      user_id: user.id,
      tipo: 'PIX',
      valor: amount,
      taxa_aplicada: 0,
      valor_total: amount,
      status: 'concluido',
    })

    if (!reqError) {
      await supabase
        .from('contas')
        .update({ saldo: conta.saldo - amount })
        .eq('id', conta.id)
      await refreshData()
      setStep(4)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col pb-10 min-h-[80vh] animate-fade-in-up">
      {step < 4 && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Transferência & PIX</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Envie dinheiro com segurança e rapidez.
          </p>
        </div>
      )}

      <Card className="border-none shadow-elevation bg-white flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          {step === 1 && (
            <div className="p-6 md:p-8 animate-fade-in">
              <h2 className="text-lg font-semibold text-primary mb-4">
                Para quem você quer transferir?
              </h2>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Nome, CPF, CNPJ ou Chave PIX"
                  className="pl-10 h-12 text-base rounded-xl bg-slate-50 border-transparent focus-visible:bg-white"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Contatos Frequentes
                </p>
                <div className="space-y-2">
                  {frequentContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => selectRecipient(contact)}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={contact.img} />
                        <AvatarFallback>
                          <User />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-primary">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {contact.type} • {contact.key}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && recipient && (
            <div className="flex flex-col h-full animate-fade-in-up">
              <div className="p-6 md:p-8 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                <p className="text-slate-500 mb-6 text-center">
                  Qual valor enviar para <br />
                  <span className="font-semibold text-primary">{recipient.name}</span>?
                </p>

                <div className="relative flex items-center justify-center w-full max-w-xs">
                  <span className="text-3xl font-medium text-slate-400 mr-2">R$</span>
                  <input
                    type="text"
                    value={amountStr}
                    onChange={handleAmountChange}
                    className="text-5xl md:text-6xl font-bold text-primary w-full bg-transparent border-none outline-none text-left placeholder:text-slate-200"
                    autoFocus
                    placeholder="0,00"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-8">
                  Saldo disponível:{' '}
                  <span className="font-medium text-primary">
                    {formatCurrency(conta?.saldo || 0)}
                  </span>
                </p>
              </div>
              <div className="p-6 bg-slate-50 border-t flex justify-between gap-4">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  className="flex-1 h-12"
                  disabled={amount <= 0 || amount > (conta?.saldo || 0)}
                  onClick={() => setStep(3)}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 3 && recipient && (
            <div className="flex flex-col h-full animate-fade-in-up">
              <div className="p-6 md:p-8 flex-1">
                <h2 className="text-xl font-bold text-primary mb-6 text-center">
                  Confirme os dados
                </h2>

                <div className="bg-slate-50 rounded-2xl p-6 mb-6 text-center border border-slate-100">
                  <p className="text-sm text-slate-500 mb-2">Valor da transferência</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(amount)}</p>
                </div>

                <div className="space-y-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={recipient.img} />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-500">Para</p>
                      <p className="font-semibold text-primary">{recipient.name}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Chave PIX / Conta</span>
                    <span className="font-medium text-primary">{recipient.key}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t flex justify-between gap-4">
                <Button variant="outline" className="w-1/3 h-12" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button
                  className="w-2/3 h-12 bg-accent hover:bg-emerald-600 text-white"
                  onClick={confirmTransfer}
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Confirmar Transferência'}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center h-full min-h-[400px] animate-fade-in-up">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-slide-up">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Transferência Realizada!</h2>
              <p className="text-muted-foreground mb-8">
                O valor de {formatCurrency(amount)} foi enviado com sucesso para{' '}
                <span className="font-semibold text-primary">{recipient?.name}</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button
                  className="flex-1 h-12"
                  onClick={() => {
                    setStep(1)
                    setAmountStr('0,00')
                  }}
                >
                  Novo PIX
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
