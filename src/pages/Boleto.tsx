import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Barcode as BarcodeIcon, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useBank } from '@/hooks/use-bank'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

export default function BoletoPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { conta, refreshData } = useBank()

  const [activeTab, setActiveTab] = useState('digitar')
  const [codigo, setCodigo] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [boletoInfo, setBoletoInfo] = useState<any>(null)
  const [taxas, setTaxas] = useState({ percentual: 0, fixa: 0 })
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchTaxas()
    }
  }, [user])

  const fetchTaxas = async () => {
    try {
      const { data: servico } = await supabase
        .from('servicos')
        .select('id')
        .ilike('nome', '%Boleto%')
        .single()

      if (servico && user) {
        const { data: cesta } = await supabase
          .from('cestas_clientes')
          .select('id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .single()

        if (cesta) {
          const { data: item } = await supabase
            .from('cestas_itens')
            .select('taxa_percentual, taxa_fixa')
            .eq('cesta_id', cesta.id)
            .eq('servico_id', servico.id)
            .eq('ativo', true)
            .single()

          if (item) {
            setTaxas({ percentual: Number(item.taxa_percentual), fixa: Number(item.taxa_fixa) })
            return
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const buscarBoleto = async (codeStr: string) => {
    setError('')
    if (codeStr.replace(/\D/g, '').length < 47) {
      setError('O código deve conter 47 dígitos.')
      return
    }

    setLoading(true)
    // Delay simulado de busca
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Sucesso simulado
    setBoletoInfo({
      beneficiario: 'Companhia de Água e Energia S/A',
      vencimento: new Date(Date.now() + 86400000 * 5).toISOString(), // +5 dias
      valor: 185.5,
    })
    setIsCameraActive(false)
    setLoading(false)
  }

  const handlePagar = async () => {
    if (!senha) {
      setError('Por favor, informe sua senha de confirmação.')
      return
    }

    if (!conta || !boletoInfo || !user) return

    const taxaAplicada = boletoInfo.valor * (taxas.percentual / 100) + taxas.fixa
    const valorTotal = boletoInfo.valor + taxaAplicada

    if (conta.saldo < valorTotal) {
      setError('Saldo insuficiente para realizar este pagamento.')
      return
    }

    setProcessing(true)
    setError('')

    try {
      // 1. Deduzir saldo imediatamente
      const { error: updError } = await supabase
        .from('contas')
        .update({ saldo: conta.saldo - valorTotal })
        .eq('id', conta.id)

      if (updError) throw updError

      // 2. Criar requisição com status pendente
      const { error: reqError } = await supabase.from('requisicoes').insert({
        user_id: user.id,
        tipo: 'boleto',
        valor: boletoInfo.valor,
        taxa_aplicada: taxaAplicada,
        valor_total: valorTotal,
        status: 'pendente',
      })

      if (reqError) throw reqError

      await refreshData()
      toast.success('Pagamento enviado para análise')
      navigate('/')
    } catch (err: any) {
      console.error(err)
      setError('Erro ao processar pagamento. Tente novamente mais tarde.')
    } finally {
      setProcessing(false)
    }
  }

  const CameraView = () => {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
      let stream: MediaStream | null = null
      const startCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        } catch (err) {
          toast.error('Permissão de câmera negada ou indisponível')
          setIsCameraActive(false)
        }
      }
      startCamera()

      const timer = setTimeout(() => {
        // Leitura simulada após 3 segundos
        buscarBoleto('341910900800000000000000000000000000000000000')
      }, 3000)

      return () => {
        clearTimeout(timer)
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }
      }
    }, [])

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />

          <div className="absolute inset-0 border-[6px] border-[#8B5CF6]/40 z-10 m-8 rounded-2xl pointer-events-none" />

          <div className="absolute top-1/2 left-8 right-8 h-1 bg-[#8B5CF6] animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] z-20 shadow-[0_0_15px_rgba(139,92,246,1)] pointer-events-none" />

          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => setIsCameraActive(false)}
              className="text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-8 h-8" />
            </button>
            <span className="text-white font-medium">Ler Código de Barras</span>
            <div className="w-8" />
          </div>

          <p className="absolute bottom-12 text-white text-sm z-30 bg-black/60 px-5 py-3 rounded-full backdrop-blur-md font-medium shadow-xl pointer-events-none">
            Alinhe o código na marcação
          </p>
        </div>
      </div>
    )
  }

  const taxaTotal = boletoInfo ? boletoInfo.valor * (taxas.percentual / 100) + taxas.fixa : 0
  const total = boletoInfo ? boletoInfo.valor + taxaTotal : 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 animate-in fade-in duration-300">
      <header className="bg-[#8B5CF6] text-white p-4 sticky top-0 z-10 flex items-center shadow-md">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 mr-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold tracking-tight">Pagar Boleto</h1>
      </header>

      <main className="flex-1 p-4 md:max-w-md md:mx-auto w-full">
        {isCameraActive && <CameraView />}

        {!boletoInfo && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 rounded-xl p-1 h-12 shadow-sm">
                <TabsTrigger
                  value="digitar"
                  className="rounded-lg data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white transition-all font-medium text-slate-600"
                >
                  Digitar código
                </TabsTrigger>
                <TabsTrigger
                  value="ler"
                  className="rounded-lg data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white transition-all font-medium text-slate-600"
                >
                  Ler código
                </TabsTrigger>
              </TabsList>

              <TabsContent value="digitar" className="mt-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">
                    Código de barras
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Digite os 47 dígitos"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                      maxLength={47}
                      className="h-14 pl-12 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-[#8B5CF6] text-lg tracking-wide"
                    />
                    <BarcodeIcon className="absolute left-4 top-4 w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <p className="text-xs text-slate-500">{codigo.length}/47 dígitos</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => buscarBoleto(codigo)}
                  disabled={codigo.length < 47 || loading}
                  className="w-full h-14 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-xl font-medium text-base shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? 'Buscando...' : 'Buscar boleto'}
                </Button>
              </TabsContent>

              <TabsContent value="ler" className="mt-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-20 h-20 bg-[#8B5CF6]/10 rounded-full flex items-center justify-center mb-5 text-[#8B5CF6]">
                    <Camera className="w-10 h-10" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-lg mb-2">Aponte a câmera</h3>
                  <p className="text-slate-500 text-sm mb-8 max-w-[250px] leading-relaxed">
                    Posicione o código de barras na marcação da tela para leitura automática.
                  </p>
                  <Button
                    onClick={() => setIsCameraActive(true)}
                    className="w-full h-14 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-xl shadow-sm transition-all text-base font-medium active:scale-[0.98]"
                  >
                    Abrir câmera
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {loading && !isCameraActive && !boletoInfo && (
          <div className="mt-8 space-y-4 animate-in fade-in">
            <Skeleton className="h-40 w-full rounded-2xl bg-slate-200/60" />
            <Skeleton className="h-14 w-full rounded-xl bg-slate-200/60" />
          </div>
        )}

        {boletoInfo && (
          <div className="mt-4 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="bg-[#8B5CF6]/10 px-5 py-4 flex items-center gap-3 border-b border-[#8B5CF6]/10">
                <CheckCircle2 className="w-6 h-6 text-[#8B5CF6]" />
                <h2 className="font-semibold text-[#8B5CF6]">Boleto encontrado</h2>
              </div>
              <CardContent className="p-5 space-y-5">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Beneficiário</p>
                  <p className="font-semibold text-slate-800 text-lg leading-tight">
                    {boletoInfo.beneficiario}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Vencimento</p>
                    <p className="font-medium text-slate-800">
                      {new Date(boletoInfo.vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Valor do boleto</p>
                    <p className="font-medium text-slate-800">
                      {boletoInfo.valor.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Valor do documento</span>
                    <span className="font-medium text-slate-800">
                      {boletoInfo.valor.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Taxa de serviço</span>
                    <span className="font-medium text-amber-600">
                      {taxaTotal > 0
                        ? '+ ' +
                          taxaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : 'Isento'}
                    </span>
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-800">Total a pagar</span>
                    <span className="text-xl font-bold text-[#8B5CF6]">
                      {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Confirmar pagamento
                  </label>
                  <Input
                    type="password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-[#8B5CF6]"
                  />
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBoletoInfo(null)
                  setCodigo('')
                  setSenha('')
                }}
                disabled={processing}
                className="flex-1 h-14 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50 font-medium bg-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePagar}
                disabled={processing}
                className="flex-[2] h-14 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-xl font-medium shadow-sm transition-all active:scale-[0.98]"
              >
                {processing ? 'Processando...' : 'Pagar'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
