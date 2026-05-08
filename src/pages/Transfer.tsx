import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useBank } from '@/hooks/use-bank'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'

export default function Transfer() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { conta, refreshData } = useBank()

  const [tab, setTab] = useState<'PIX' | 'TED'>('PIX')
  const [pixKey, setPixKey] = useState('')
  const [tedBank, setTedBank] = useState('')
  const [tedAgency, setTedAgency] = useState('')
  const [tedAccount, setTedAccount] = useState('')
  const [name, setName] = useState('')
  const [amountStr, setAmountStr] = useState('0,00')
  const [saveFavorite, setSaveFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<any[]>([])
  const [loadingFavs, setLoadingFavs] = useState(true)
  const [rates, setRates] = useState<{ PIX: any; TED: any }>({
    PIX: { p: 0, f: 0 },
    TED: { p: 0, f: 0 },
  })

  const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.')) || 0
  const rate = rates[tab] || { p: 0, f: 0 }
  const taxa = amount * (rate.p / 100) + rate.f
  const total = amount + taxa

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const { data: favs } = await supabase
        .from('favorecidos')
        .select('*')
        .eq('user_id', user.id)
        .eq('salvo', true)
      setFavorites(favs || [])
      setLoadingFavs(false)

      const { data: cesta } = await supabase
        .from('cestas_clientes')
        .select('id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single()
      if (cesta) {
        const { data: itens } = await supabase
          .from('cestas_itens')
          .select('taxa_percentual, taxa_fixa, servicos(nome)')
          .eq('cesta_id', cesta.id)
          .eq('ativo', true)
        const newRates = { PIX: { p: 0, f: 0 }, TED: { p: 0, f: 0 } }
        itens?.forEach((i: any) => {
          const n = i.servicos?.nome?.toUpperCase()
          if (n === 'PIX' || n === 'TED')
            newRates[n] = { p: Number(i.taxa_percentual), f: Number(i.taxa_fixa) }
        })
        setRates(newRates)
      }
    }
    fetchData()
  }, [user])

  const handleAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/\D/g, '') || '0', 10) / 100
    setAmountStr(
      val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    )
  }

  const handleTransfer = async () => {
    if (!user || !conta || amount <= 0 || total > conta.saldo) return
    setLoading(true)

    const { error: saldoErr } = await supabase
      .from('contas')
      .update({ saldo: conta.saldo - total })
      .eq('id', conta.id)
    if (saldoErr) {
      toast.error('Erro de saldo')
      return setLoading(false)
    }

    await supabase.from('requisicoes').insert({
      user_id: user.id,
      tipo: tab.toLowerCase(),
      valor: amount,
      taxa_aplicada: taxa,
      valor_total: total,
      status: 'pendente',
      metadados:
        tab === 'PIX'
          ? { chave_pix: pixKey, favorecido: name }
          : { banco: tedBank, agencia: tedAgency, conta: tedAccount, favorecido: name },
    })

    if (saveFavorite) {
      await supabase.from('favorecidos').insert({
        user_id: user.id,
        tipo: tab,
        nome: name,
        salvo: true,
        chave_pix: tab === 'PIX' ? pixKey : null,
        banco: tab === 'TED' ? tedBank : null,
        agencia: tab === 'TED' ? tedAgency : null,
        conta: tab === 'TED' ? tedAccount : null,
      })
      const { data } = await supabase
        .from('favorecidos')
        .select('*')
        .eq('user_id', user.id)
        .eq('salvo', true)
      setFavorites(data || [])
    }

    toast.success('Transferência enviada com sucesso')
    await refreshData()
    setAmountStr('0,00')
    setName('')
    setPixKey('')
    setTedBank('')
    setTedAgency('')
    setTedAccount('')
    setSaveFavorite(false)
    setLoading(false)
  }

  const deleteFav = async (id: string) => {
    await supabase.from('favorecidos').delete().eq('id', id)
    setFavorites(favorites.filter((f) => f.id !== id))
    toast.success('Favorecido removido')
  }

  const fillFav = (fav: any) => {
    setTab(fav.tipo)
    setName(fav.nome)
    if (fav.tipo === 'PIX') setPixKey(fav.chave_pix || '')
    else {
      setTedBank(fav.banco || '')
      setTedAgency(fav.agencia || '')
      setTedAccount(fav.conta || '')
    }
  }

  const isFormValid =
    name && amount > 0 && (tab === 'PIX' ? pixKey : tedBank && tedAgency && tedAccount)

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20 animate-fade-in">
      <div className="bg-[#8B5CF6] text-white p-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Transferir</h1>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'PIX' | 'TED')} className="w-full">
        <TabsList className="w-full bg-white border-b border-gray-100 rounded-none p-0 flex h-auto">
          {['PIX', 'TED'].map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#8B5CF6] data-[state=active]:text-[#8B5CF6] text-gray-500 py-3 font-medium transition-colors"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="p-4 flex flex-col gap-4">
        {tab === 'PIX' ? (
          <Input
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="Chave PIX (CPF, e-mail, celular...)"
            className="border-gray-200 focus-visible:ring-[#8B5CF6] p-3 h-12"
          />
        ) : (
          <div className="flex flex-col gap-4">
            <Select value={tedBank} onValueChange={setTedBank}>
              <SelectTrigger className="h-12 border-gray-200 focus:ring-[#8B5CF6]">
                <SelectValue placeholder="Banco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="001">001 - Banco do Brasil</SelectItem>
                <SelectItem value="033">033 - Santander</SelectItem>
                <SelectItem value="104">104 - Caixa Econômica</SelectItem>
                <SelectItem value="237">237 - Bradesco</SelectItem>
                <SelectItem value="341">341 - Itaú</SelectItem>
                <SelectItem value="260">260 - Nubank</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-4">
              <Input
                value={tedAgency}
                onChange={(e) => setTedAgency(e.target.value)}
                placeholder="Agência"
                className="flex-1 border-gray-200 focus-visible:ring-[#8B5CF6] p-3 h-12"
              />
              <Input
                value={tedAccount}
                onChange={(e) => setTedAccount(e.target.value)}
                placeholder="Conta"
                className="flex-1 border-gray-200 focus-visible:ring-[#8B5CF6] p-3 h-12"
              />
            </div>
          </div>
        )}

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do favorecido"
          className="border-gray-200 focus-visible:ring-[#8B5CF6] p-3 h-12"
        />

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            R$
          </span>
          <Input
            value={amountStr}
            onChange={handleAmount}
            placeholder="0,00"
            className="pl-10 border-gray-200 focus-visible:ring-[#8B5CF6] p-3 h-12 font-medium text-lg"
          />
        </div>

        <div className="flex items-center gap-2 mt-1">
          <Checkbox
            id="save"
            checked={saveFavorite}
            onCheckedChange={(c) => setSaveFavorite(!!c)}
          />
          <label htmlFor="save" className="text-sm text-gray-600">
            Salvar como favorecido
          </label>
        </div>
      </div>

      <div className="px-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Favorecidos Salvos</h3>
        {loadingFavs ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : (
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => fillFav(fav)}
                className="min-w-[220px] flex-shrink-0 bg-white border border-gray-200 hover:border-[#8B5CF6] rounded-xl p-3 flex flex-col gap-1 snap-start cursor-pointer relative group transition-colors"
              >
                <span className="text-xs font-bold text-[#8B5CF6]">{fav.tipo}</span>
                <span className="font-medium text-sm text-gray-800 truncate pr-6">{fav.nome}</span>
                <span className="text-xs text-gray-500 truncate">
                  {fav.tipo === 'PIX' ? fav.chave_pix : `${fav.banco} - Ag: ${fav.agencia}`}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteFav(fav.id)
                  }}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-100 rounded-xl p-4 m-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Valor</span>
          <span className="font-medium">{formatCurrency(amount)}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-gray-600">Taxa</span>
          <Badge className="bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]">
            {formatCurrency(taxa)}
          </Badge>
        </div>
        <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
          <span className="text-gray-800">Total a debitar</span>
          <span className="text-[#8B5CF6]">{formatCurrency(total)}</span>
        </div>
      </div>

      <Button
        onClick={handleTransfer}
        disabled={!isFormValid || loading || total > (conta?.saldo || 0)}
        className="mx-4 mb-6 h-14 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-xl text-base font-medium disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
      >
        {loading
          ? 'Processando...'
          : total > (conta?.saldo || 0)
            ? 'Saldo Insuficiente'
            : 'Transferir'}
      </Button>
    </div>
  )
}
