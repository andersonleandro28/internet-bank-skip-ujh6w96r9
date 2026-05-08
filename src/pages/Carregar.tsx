import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, RefreshCcw, Wallet, Hexagon, Circle, Triangle, Box } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useBank } from '@/hooks/use-bank'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const networks = [
  {
    id: 'polygon',
    name: 'Polygon',
    icon: Hexagon,
    color: 'text-[#8247E5]',
    bg: 'bg-[#8247E5]/10',
    border: 'border-[#8247E5]',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    icon: Circle,
    color: 'text-[#28A0F0]',
    bg: 'bg-[#28A0F0]/10',
    border: 'border-[#28A0F0]',
  },
  {
    id: 'optimism',
    name: 'Optimism',
    icon: Triangle,
    color: 'text-[#FF0420]',
    bg: 'bg-[#FF0420]/10',
    border: 'border-[#FF0420]',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon: Box,
    color: 'text-[#627EEA]',
    bg: 'bg-[#627EEA]/10',
    border: 'border-[#627EEA]',
  },
]

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

  const [salvarCarteira, setSalvarCarteira] = useState(false)
  const [nomeCarteira, setNomeCarteira] = useState('')
  const [carteirasSalvas, setCarteirasSalvas] = useState<any[]>([])

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

    const fetchCarteiras = async () => {
      if (!session?.user?.id) return
      const { data } = await supabase
        .from('favorecidos')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('tipo', 'carteira_usdt')
      if (data) setCarteirasSalvas(data)
    }

    getRate()
    fetchFees()
    fetchCarteiras()

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
      if (salvarCarteira && nomeCarteira) {
        const jaSalvo = carteirasSalvas.some((c) => c.conta === hashCripto && c.banco === rede)
        if (!jaSalvo) {
          const { error: errFav } = await supabase.from('favorecidos').insert({
            user_id: session.user.id,
            tipo: 'carteira_usdt',
            conta: hashCripto,
            banco: rede,
            nome: nomeCarteira,
            salvo: true,
          })
          if (errFav) console.error('Erro ao salvar carteira', errFav)
          else toast.success('Carteira salva com sucesso!')
        }
      }

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
        metadados: {
          hash_cripto: hashCripto,
          rede: rede,
          valor_usdt: valorUsdt,
          cotacao_brl: cotacaoBrl,
        },
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
    <div className="min-h-screen bg-white font-sans pb-24">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 flex items-center shadow-sm">
        <Link to="/" className="mr-4 p-2 hover:bg-white/20 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-medium">Carregar Cartão</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Input Valor BRL */}
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
              className="pl-12 py-6 text-lg border-slate-300 focus-visible:ring-primary rounded-xl bg-white"
            />
          </div>
        </div>

        {/* Card de Cotação */}
        {loadingRate || !cotacaoBrl ? (
          <Skeleton className="h-36 w-full rounded-xl" />
        ) : (
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/90">Cotação Atual (Tempo Real)</span>
              <RefreshCcw className="w-4 h-4 text-white/90 animate-[spin_3s_linear_infinite]" />
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold">1 BRL</span>
              <span className="text-lg text-white/80 font-medium">
                = {(1 / cotacaoBrl).toFixed(4)} USDT
              </span>
            </div>
            <div className="flex justify-between items-center bg-white/10 rounded-lg p-3">
              <span className="text-sm text-white/90">Spread Administrativo</span>
              <span className="bg-white text-primary text-xs px-2.5 py-1 rounded-md font-bold">
                {spread}%
              </span>
            </div>
            {numValor > 0 && (
              <div className="pt-3 mt-3 border-t border-white/20 flex items-center justify-between">
                <span className="text-sm font-medium text-white/90">Você recebe aprox.</span>
                <span className="text-xl font-bold">{valorUsdt.toFixed(2)} USDT</span>
              </div>
            )}
          </div>
        )}

        {/* Carteiras Salvas */}
        {carteirasSalvas.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Carteiras Salvas
            </label>
            <Select
              onValueChange={(val) => {
                const c = carteirasSalvas.find((x) => x.id === val)
                if (c) {
                  setHashCripto(c.conta || '')
                  setRede(c.banco || '')
                }
              }}
            >
              <SelectTrigger className="w-full bg-white h-14 rounded-xl border-slate-300">
                <SelectValue placeholder="Selecione uma carteira salva" />
              </SelectTrigger>
              <SelectContent>
                {carteirasSalvas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} ({c.banco}) - {c.conta?.substring(0, 6)}...
                    {c.conta?.substring(c.conta.length - 4)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Hash da Carteira */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hash da carteira USDT
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Wallet className="w-5 h-5" />
            </span>
            <Input
              placeholder="0x..."
              value={hashCripto}
              onChange={(e) => setHashCripto(e.target.value)}
              className="pl-12 py-6 border-slate-300 focus-visible:ring-primary rounded-xl font-mono text-sm bg-white"
            />
          </div>
        </div>

        {/* Seleção de Rede */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Rede</label>
          <div className="grid grid-cols-4 gap-3">
            {networks.map((net) => {
              const Icon = net.icon
              const isSelected = rede === net.id
              return (
                <button
                  key={net.id}
                  onClick={() => setRede(net.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `${net.border} ${net.bg}`
                      : 'border-transparent bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-2 ${net.color}`} />
                  <span
                    className={`text-[10px] font-medium ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}
                  >
                    {net.name}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-3 mt-5">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                checked={salvarCarteira}
                onChange={(e) => setSalvarCarteira(e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-700">
                Salvar esta carteira para usar depois
              </span>
            </label>

            {salvarCarteira && (
              <Input
                placeholder="Apelido da carteira (ex: Minha Carteira Principal)"
                value={nomeCarteira}
                onChange={(e) => setNomeCarteira(e.target.value)}
                className="bg-white h-12 rounded-xl border-slate-300 focus-visible:ring-primary"
              />
            )}
          </div>
        </div>

        {/* Card de Resumo */}
        {numValor > 0 && (
          <div className="bg-slate-100 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Resumo da Operação</h3>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Valor (BRL)</span>
              <span className="text-slate-700 font-medium">R$ {numValor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Spread ({spread}%)</span>
              <span className="text-slate-700 font-medium">
                - R$ {(numValor * (spread / 100)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-500">Taxa de Serviço</span>
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-md font-medium">
                R$ {taxaBrl.toFixed(2)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between text-base">
              <span className="font-medium text-slate-700">Custo Total (BRL)</span>
              <span className="font-bold text-slate-900">R$ {valorTotalBrl.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleCarregar}
          disabled={
            submitting ||
            !cotacaoBrl ||
            numValor <= 0 ||
            !hashCripto ||
            !rede ||
            (salvarCarteira && !nomeCarteira)
          }
          className="w-full mt-2 py-6 text-base bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:text-slate-500 text-primary-foreground transition-colors rounded-xl font-semibold shadow-sm"
        >
          {submitting ? 'Processando...' : 'Carregar USDT'}
        </Button>
      </main>
    </div>
  )
}
