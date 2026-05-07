import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useBank } from '@/hooks/use-bank'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export default function Carregar() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { conta, refreshData } = useBank()

  const [valorBrl, setValorBrl] = useState('')
  const [hashCripto, setHashCripto] = useState('')
  const [rede, setRede] = useState('')

  const [cotacaoBrl, setCotacaoBrl] = useState<number | null>(null)
  const [spread] = useState(2) // 2% fixed spread as default
  const [taxaFixa, setTaxaFixa] = useState(0)
  const [taxaPercentual, setTaxaPercentual] = useState(0)
  const [loadingRate, setLoadingRate] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const getRate = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=brl',
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (data?.tether?.brl) {
          setCotacaoBrl(data.tether.brl)
        } else {
          setCotacaoBrl(5.15)
        }
      } catch (err) {
        // Fallback in case of rate limits
        setCotacaoBrl(5.15)
      } finally {
        setLoadingRate(false)
      }
    }

    const fetchFees = async () => {
      if (!session?.user?.id) return
      try {
        const { data: servico } = await supabase
          .from('servicos')
          .select('id')
          .eq('nome', 'carga_usdt')
          .maybeSingle()

        if (servico) {
          const { data: cesta } = await supabase
            .from('cestas_clientes')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('ativo', true)
            .maybeSingle()

          if (cesta) {
            const { data: item } = await supabase
              .from('cestas_itens')
              .select('taxa_fixa, taxa_percentual')
              .eq('cesta_id', cesta.id)
              .eq('servico_id', servico.id)
              .maybeSingle()

            if (item) {
              setTaxaFixa(item.taxa_fixa || 0)
              setTaxaPercentual(item.taxa_percentual || 0)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching fees', err)
      }
    }

    getRate()
    fetchFees()

    const interval = setInterval(getRate, 10000)
    return () => clearInterval(interval)
  }, [session?.user?.id])

  const numValor = parseFloat(valorBrl.replace(',', '.')) || 0
  const taxaBrl = (numValor * taxaPercentual) / 100 + taxaFixa
  const valorTotalBrl = numValor + taxaBrl

  const valorConvertido = numValor * (1 - spread / 100)
  const valorUsdt = cotacaoBrl ? valorConvertido / cotacaoBrl : 0

  const handleCarregar = async () => {
    if (!session?.user?.id) return toast.error('Usuário não autenticado')
    if (numValor <= 0) return toast.error('Digite um valor válido em BRL')
    if (!hashCripto) return toast.error('Digite a hash da carteira USDT')
    if (!rede) return toast.error('Selecione a rede da carteira')
    if (!conta) return toast.error('Conta não encontrada')

    if (conta.saldo < valorTotalBrl) {
      return toast.error('Saldo insuficiente para a operação')
    }

    setSubmitting(true)
    try {
      const novoSaldo = conta.saldo - valorTotalBrl
      const { error: errConta } = await supabase
        .from('contas')
        .update({ saldo: novoSaldo })
        .eq('id', conta.id)
      if (errConta) throw errConta

      const { error: errReq } = await supabase.from('requisicoes').insert({
        user_id: session.user.id,
        tipo: 'carga_usdt',
        valor: numValor,
        taxa_aplicada: taxaBrl,
        valor_total: valorTotalBrl,
        status: 'pendente',
        hash_cripto: hashCripto,
        rede: rede,
      })
      if (errReq) throw errReq

      await refreshData()
      toast.success('Carregamento enviado com sucesso', {
        description: 'Seu carregamento foi enviado para análise.',
      })
      navigate('/')
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao processar o carregamento', {
        description: err.message || 'Tente novamente mais tarde.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <header className="bg-[#8B5CF6] text-white p-4 sticky top-0 z-10 flex items-center shadow-md">
        <Link to="/" className="mr-4 p-2 hover:bg-white/20 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-medium">Carregar Cartão</h1>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Valor em BRL</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
              R$
            </span>
            <Input
              type="number"
              placeholder="0.00"
              value={valorBrl}
              onChange={(e) => setValorBrl(e.target.value)}
              className="pl-12 py-6 text-lg border-slate-300 focus-visible:ring-[#8B5CF6] rounded-xl"
            />
          </div>
        </div>

        {loadingRate || !cotacaoBrl ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Cotação Atual (Tempo Real)</span>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />1 BRL ={' '}
                {(1 / cotacaoBrl).toFixed(4)} USDT
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Spread Administrativo</span>
              <span className="bg-[#8B5CF6] text-white text-xs px-2.5 py-1 rounded-md font-medium">
                {spread}%
              </span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Você recebe aprox.</span>
              <span className="text-xl font-bold text-[#8B5CF6]">{valorUsdt.toFixed(2)} USDT</span>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hash da carteira USDT
            </label>
            <Input
              placeholder="0x..."
              value={hashCripto}
              onChange={(e) => setHashCripto(e.target.value)}
              className="py-6 border-slate-300 focus-visible:ring-[#8B5CF6] rounded-xl font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rede</label>
            <Select value={rede} onValueChange={setRede}>
              <SelectTrigger className="py-6 border-slate-300 focus:ring-[#8B5CF6] rounded-xl">
                <SelectValue placeholder="Selecione a rede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="arbitrum">Arbitrum</SelectItem>
                <SelectItem value="optimism">Optimism</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {numValor > 0 && (
          <div className="bg-slate-200/60 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Resumo da Operação</h3>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Valor (BRL)</span>
              <span className="text-slate-700">R$ {numValor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Spread ({spread}%)</span>
              <span className="text-slate-700">- R$ {(numValor * (spread / 100)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Taxa de Serviço</span>
              <span className="text-slate-700">R$ {taxaBrl.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-300/50 flex justify-between text-base">
              <span className="font-medium text-slate-700">Custo Total (BRL)</span>
              <span className="font-bold text-slate-900">R$ {valorTotalBrl.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleCarregar}
          disabled={submitting || !cotacaoBrl || numValor <= 0 || !hashCripto || !rede}
          className="w-full py-6 text-base bg-[#8B5CF6] hover:bg-[#7c3aed] disabled:bg-slate-300 disabled:text-slate-500 text-white transition-colors rounded-xl font-semibold mt-4"
        >
          {submitting ? 'Processando...' : 'Carregar USDT'}
        </Button>
      </main>
    </div>
  )
}
