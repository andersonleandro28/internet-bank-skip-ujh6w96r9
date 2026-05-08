import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    if (user) fetchTaxas()
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

          if (item)
            setTaxas({ percentual: Number(item.taxa_percentual), fixa: Number(item.taxa_fixa) })
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
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setBoletoInfo({
      beneficiario: 'Companhia de Água e Energia S/A',
      vencimento: new Date(Date.now() + 86400000 * 5).toISOString(),
      valor: 185.5,
    })
    setIsCameraActive(false)
    setLoading(false)
  }

  const handlePagar = async () => {
    if (!senha) return setError('Por favor, informe sua senha de confirmação.')
    if (!conta || !boletoInfo || !user) return

    const taxaAplicada = boletoInfo.valor * (taxas.percentual / 100) + taxas.fixa
    const valorTotal = boletoInfo.valor + taxaAplicada

    if (conta.saldo < valorTotal)
      return setError('Saldo insuficiente para realizar este pagamento.')

    setProcessing(true)
    setError('')

    try {
      const { error: updError } = await supabase
        .from('contas')
        .update({ saldo: conta.saldo - valorTotal })
        .eq('id', conta.id)

      if (updError) throw updError

      const { error: reqError } = await supabase.from('requisicoes').insert({
        user_id: user.id,
        tipo: 'boleto',
        valor: boletoInfo.valor,
        taxa_aplicada: taxaAplicada,
        valor_total: valorTotal,
        status: 'pendente',
        metadados: {
          codigo_barras: codigo,
          beneficiario: boletoInfo.beneficiario,
          vencimento: boletoInfo.vencimento,
        },
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
          if (videoRef.current) videoRef.current.srcObject = stream
        } catch (err) {
          toast.error('Permissão de câmera negada ou indisponível')
          setIsCameraActive(false)
        }
      }
      startCamera()

      const timer = setTimeout(() => {
        buscarBoleto('341910900800000000000000000000000000000000000')
      }, 3000)

      return () => {
        clearTimeout(timer)
        if (stream) stream.getTracks().forEach((track) => track.stop())
      }
    }, [])

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 border-[4px] border-primary/50 z-10 m-6 rounded-[12px] pointer-events-none" />
          <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-primary animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_10px_hsl(var(--primary))] z-20 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center z-30 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => setIsCameraActive(false)}
              className="text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="text-white font-medium ml-2">Ler código de barras</span>
          </div>
          <p className="absolute bottom-10 text-white text-sm z-30 bg-black/60 px-4 py-2 rounded-full font-medium pointer-events-none">
            Alinhe o código na marcação
          </p>
        </div>
      </div>
    )
  }

  const taxaTotal = boletoInfo ? boletoInfo.valor * (taxas.percentual / 100) + taxas.fixa : 0
  const total = boletoInfo ? boletoInfo.valor + taxaTotal : 0

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-20">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 flex items-center shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 mr-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium tracking-tight">Pagar Boleto</h1>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto">
        {isCameraActive && <CameraView />}

        {!boletoInfo && (
          <div className="animate-in fade-in duration-500">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-3 pt-3">
                <TabsList className="flex w-full bg-transparent border-b border-slate-200 p-0 h-auto rounded-none">
                  <TabsTrigger
                    value="digitar"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-slate-500 font-medium py-3 px-3 transition-colors data-[state=active]:shadow-none"
                  >
                    Digitar código
                  </TabsTrigger>
                  <TabsTrigger
                    value="ler"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-slate-500 font-medium py-3 px-3 transition-colors data-[state=active]:shadow-none"
                  >
                    Ler código
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="digitar" className="p-4 mt-0 space-y-4 outline-none">
                <div className="space-y-2">
                  <Input
                    placeholder="Código de barras (47 dígitos)"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                    maxLength={47}
                    className="h-12 p-3 rounded-xl border-slate-300 focus-visible:ring-primary bg-white text-base shadow-sm"
                  />
                  <div className="flex justify-end">
                    <p className="text-xs text-slate-500">{codigo.length}/47</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => buscarBoleto(codigo)}
                  disabled={codigo.length < 47 || loading}
                  className="w-full mt-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-medium disabled:bg-slate-200 disabled:text-slate-400 transition-all"
                >
                  {loading ? 'Buscando...' : 'Buscar boleto'}
                </Button>
              </TabsContent>

              <TabsContent value="ler" className="p-4 mt-0 outline-none">
                <div className="flex flex-col items-center justify-center text-center mt-8 space-y-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-pulse">
                    <Camera className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 text-lg mb-1">Aponte a câmera</h3>
                    <p className="text-slate-500 text-sm max-w-[240px] mx-auto leading-relaxed">
                      Posicione o código de barras na tela para leitura automática.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsCameraActive(true)}
                    className="w-full mt-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-medium transition-all"
                  >
                    Abrir câmera
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {loading && !isCameraActive && !boletoInfo && (
          <div className="p-4 space-y-4 animate-in fade-in">
            <Skeleton className="h-32 w-full rounded-xl bg-slate-100" />
            <Skeleton className="h-12 w-full rounded-xl bg-slate-100" />
          </div>
        )}

        {boletoInfo && (
          <div className="p-4 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="font-medium">Boleto encontrado</h2>
            </div>

            <div className="bg-slate-50 rounded-[12px] p-4 space-y-4 border border-slate-100">
              <div>
                <p className="text-sm text-slate-500 mb-1">Beneficiário</p>
                <p className="font-medium text-slate-800 text-lg">{boletoInfo.beneficiario}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Vencimento</p>
                  <p className="font-medium text-slate-800">
                    {new Date(boletoInfo.vencimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Valor</p>
                  <p className="font-medium text-slate-800">
                    {boletoInfo.valor.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Taxa de serviço</span>
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                    {taxaTotal > 0
                      ? '+ ' +
                        taxaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : 'Isento'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">Total a pagar</span>
                  <span className="text-lg font-bold text-primary">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Input
                type="password"
                placeholder="Senha de confirmação"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-12 p-3 rounded-xl border-slate-300 focus-visible:ring-primary"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-5">
              <Button
                onClick={handlePagar}
                disabled={processing || !senha}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-medium disabled:bg-slate-200 disabled:text-slate-400 transition-all"
              >
                {processing ? 'Processando...' : 'Confirmar e pagar'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setBoletoInfo(null)
                  setCodigo('')
                  setSenha('')
                }}
                disabled={processing}
                className="w-full text-slate-500 hover:text-slate-700 h-12 font-medium"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
