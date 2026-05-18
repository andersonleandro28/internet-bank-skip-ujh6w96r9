import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Barcode, Loader2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useBank } from '@/hooks/use-bank'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function BoletoPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { conta, refreshData } = useBank()

  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [valorBoleto, setValorBoleto] = useState<number>(0)
  const [vencimentoBoleto, setVencimentoBoleto] = useState<string>('')

  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const validateLinhaDigitavel = (linha: string) => {
    const digits = linha.replace(/\D/g, '')
    if (digits.length === 44) {
      const base = digits.substring(0, 4) + digits.substring(5)
      const dv = parseInt(digits[4], 10)

      if (digits[0] === '8') {
        // Arrecadação 44 digits
        const isMod10 = ['6', '7'].includes(digits[2])
        if (isMod10) {
          let sum = 0
          let multiplier = 2
          for (let i = base.length - 1; i >= 0; i--) {
            let res = parseInt(base[i]) * multiplier
            if (res > 9) res = Math.floor(res / 10) + (res % 10)
            sum += res
            multiplier = multiplier === 2 ? 1 : 2
          }
          let expected = 10 - (sum % 10)
          if (expected === 10) expected = 0
          return expected === dv
        } else {
          let sum = 0
          let multiplier = 2
          for (let i = base.length - 1; i >= 0; i--) {
            sum += parseInt(base[i]) * multiplier
            multiplier = multiplier === 9 ? 2 : multiplier + 1
          }
          const remainder = sum % 11
          let expected = remainder === 0 || remainder === 1 ? 0 : 11 - remainder
          return expected === dv
        }
      } else {
        // Banco 44 digits
        let soma = 0
        let peso = 2
        for (let i = base.length - 1; i >= 0; i--) {
          soma += parseInt(base[i]) * peso
          peso = peso === 9 ? 2 : peso + 1
        }
        const resto = soma % 11
        let digitoEsperado = 11 - resto
        if (digitoEsperado === 0 || digitoEsperado === 10 || digitoEsperado === 11) {
          digitoEsperado = 1
        }
        return digitoEsperado === dv
      }
    }

    if (digits.length < 40 || digits.length > 48) return false

    if (digits.length === 48) {
      const isMod10 = ['6', '7'].includes(digits[2])
      const validateBlock = (block: string, useMod10: boolean) => {
        const data = block.substring(0, 11)
        const dv = parseInt(block[11])
        if (useMod10) {
          let sum = 0
          let multiplier = 2
          for (let i = data.length - 1; i >= 0; i--) {
            let res = parseInt(data[i]) * multiplier
            if (res > 9) res = Math.floor(res / 10) + (res % 10)
            sum += res
            multiplier = multiplier === 2 ? 1 : 2
          }
          let expected = 10 - (sum % 10)
          if (expected === 10) expected = 0
          return expected === dv
        } else {
          let sum = 0
          let multiplier = 2
          for (let i = data.length - 1; i >= 0; i--) {
            sum += parseInt(data[i]) * multiplier
            multiplier = multiplier === 9 ? 2 : multiplier + 1
          }
          const remainder = sum % 11
          let expected = remainder === 0 || remainder === 1 ? 0 : 11 - remainder
          return expected === dv
        }
      }
      return (
        validateBlock(digits.substring(0, 12), isMod10) &&
        validateBlock(digits.substring(12, 24), isMod10) &&
        validateBlock(digits.substring(24, 36), isMod10) &&
        validateBlock(digits.substring(36, 48), isMod10)
      )
    }

    if (digits.length === 47) {
      const barcode =
        digits.substring(0, 4) +
        digits.substring(32, 47) +
        digits.substring(4, 9) +
        digits.substring(10, 20) +
        digits.substring(21, 31)
      const dv = parseInt(barcode[4])
      const base = barcode.substring(0, 4) + barcode.substring(5)

      let soma = 0
      let peso = 2
      for (let i = base.length - 1; i >= 0; i--) {
        soma += parseInt(base[i]) * peso
        peso = peso === 9 ? 2 : peso + 1
      }
      const resto = soma % 11
      let digitoEsperado = 11 - resto
      if (digitoEsperado === 0 || digitoEsperado === 10 || digitoEsperado === 11) {
        digitoEsperado = 1
      }
      return digitoEsperado === dv
    }

    // Generic fallback for 40-46 digits
    let soma = 0
    let peso = 2
    const base = digits.substring(0, digits.length - 1)
    const dv = parseInt(digits.substring(digits.length - 1))

    for (let i = base.length - 1; i >= 0; i--) {
      soma += parseInt(base[i]) * peso
      peso = peso === 9 ? 2 : peso + 1
    }
    let digitoEsperado = 11 - (soma % 11)
    if (digitoEsperado >= 10) digitoEsperado = 1

    return digitoEsperado === dv
  }

  const extractValue = (linha: string) => {
    const digits = linha.replace(/\D/g, '')
    if (digits.length === 48) {
      const barcode =
        digits.substring(0, 11) +
        digits.substring(12, 23) +
        digits.substring(24, 35) +
        digits.substring(36, 47)
      return parseInt(barcode.substring(4, 15), 10) / 100
    }
    if (digits.length === 47) {
      return parseInt(digits.substring(37, 47), 10) / 100
    }
    if (digits.length === 44) {
      if (digits[0] === '8') {
        return parseInt(digits.substring(4, 15), 10) / 100
      }
      return parseInt(digits.substring(9, 19), 10) / 100
    }
    return (parseInt(digits.substring(0, 4), 10) || 15000) / 100
  }

  const extractDueDate = (linha: string): string | null => {
    const digits = linha.replace(/\D/g, '')
    let fatorStr = ''

    if (digits.length === 47) {
      fatorStr = digits.substring(33, 37)
    } else if (digits.length === 44 && digits[0] !== '8') {
      fatorStr = digits.substring(5, 9)
    }

    if (fatorStr) {
      const fator = parseInt(fatorStr, 10)
      if (isNaN(fator) || fator === 0) return null

      const baseDate = new Date('1997-10-07T00:00:00Z')
      baseDate.setUTCDate(baseDate.getUTCDate() + fator)

      const now = new Date()
      const diffDays = (now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)

      // Ciclo FEBRABAN: fator de 1000 a 9999 = 9000 dias.
      if (diffDays > 3000) {
        const cycles = Math.ceil((diffDays - 3000) / 9000)
        baseDate.setUTCDate(baseDate.getUTCDate() + cycles * 9000)
      }

      return baseDate.toISOString().split('T')[0]
    }

    // Tenta extrair de boletos de Arrecadação (Convênio/Consumo) de 48 dígitos ou 44 (código de barras)
    if (digits.length === 48 || (digits.length === 44 && digits[0] === '8')) {
      const barcode =
        digits.length === 48
          ? digits.substring(0, 11) +
            digits.substring(12, 23) +
            digits.substring(24, 35) +
            digits.substring(36, 47)
          : digits

      const dateStr = barcode.substring(19, 27)
      const year = parseInt(dateStr.substring(0, 4), 10)
      const month = parseInt(dateStr.substring(4, 6), 10)
      const day = parseInt(dateStr.substring(6, 8), 10)

      if (year >= 2020 && year <= 2050 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(Date.UTC(year, month - 1, day)).toISOString().split('T')[0]
      }
    }

    return null
  }

  useEffect(() => {
    const digits = codigo.replace(/\D/g, '')
    if (digits.length === 0) {
      setIsValid(null)
      setLoading(false)
      setValorBoleto(0)
      setVencimentoBoleto(null)
      return
    }

    setIsValid(null)
    setLoading(true)

    const timer = setTimeout(() => {
      const valid = validateLinhaDigitavel(digits)
      setIsValid(valid)
      if (valid) {
        setValorBoleto(extractValue(digits))
        const dt = extractDueDate(digits)
        setVencimentoBoleto(dt || '')
      } else {
        setValorBoleto(0)
        setVencimentoBoleto('')
      }
      setLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [codigo])

  // Camera Logic
  useEffect(() => {
    if (!isCameraOpen) {
      setCameraError(null)
      return
    }

    let html5QrcodeScanner: any = null
    let isComponentMounted = true

    const initScanner = async () => {
      if (!isComponentMounted) return

      if (!(window as any).Html5Qrcode) {
        setTimeout(initScanner, 100)
        return
      }

      try {
        const Html5Qrcode = (window as any).Html5Qrcode

        // Verificar permissões e listar câmeras
        let cameras = []
        try {
          cameras = await Html5Qrcode.getCameras()
        } catch (camErr: any) {
          if (camErr?.message?.includes('Permission') || camErr?.name === 'NotAllowedError') {
            setCameraError(
              'Permissão da câmera negada. Libere o acesso nas configurações do navegador.',
            )
            return
          }
        }

        if (!cameras || cameras.length === 0) {
          setCameraError('Nenhuma câmera encontrada no dispositivo.')
          return
        }

        html5QrcodeScanner = new Html5Qrcode('qr-reader')

        await html5QrcodeScanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: function (viewfinderWidth: number, viewfinderHeight: number) {
              // Área dinâmica ajustada para códigos de barras horizontais
              return {
                width: Math.floor(viewfinderWidth * 0.9),
                height: Math.floor(viewfinderHeight * 0.35),
              }
            },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (decodedText.length >= 40) {
              handleScanSuccess(decodedText)
              if (html5QrcodeScanner) {
                html5QrcodeScanner.stop().catch(console.error)
              }
            }
          },
          (errorMessage: string) => {
            // ignorar erros de leitura quadro a quadro
          },
        )
      } catch (err: any) {
        if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
          setCameraError(
            'Acesso à câmera negado. Por favor, permita o acesso nas configurações do seu navegador.',
          )
        } else {
          setCameraError('Erro ao iniciar a câmera: ' + err?.message)
        }
      }
    }

    let script = document.getElementById('html5-qrcode-script') as HTMLScriptElement
    if (!script) {
      script = document.createElement('script')
      script.id = 'html5-qrcode-script'
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
      script.async = true
      script.onload = initScanner
      document.head.appendChild(script)
    } else {
      initScanner()
    }

    return () => {
      isComponentMounted = false
      if (html5QrcodeScanner) {
        try {
          html5QrcodeScanner.stop().catch(console.error)
        } catch {
          /* erros no stop podem ser ignorados */
        }
      }
    }
  }, [isCameraOpen])

  const handleScanSuccess = (code: string) => {
    setCodigo(code)
    setIsCameraOpen(false)
  }

  const handleSalvar = async () => {
    if (!isValid || !user || !codigo || !conta) return

    if (conta.saldo < valorBoleto) {
      toast.error('Saldo insuficiente para este pagamento')
      return
    }

    setSaving(true)
    try {
      const metadados: any = { codigo_barras: codigo.replace(/\D/g, '') }
      if (vencimentoBoleto) {
        metadados.vencimento = vencimentoBoleto
      }

      const { error: reqError } = await supabase.rpc('criar_requisicao_transferencia', {
        p_user_id: user.id,
        p_tipo: 'boleto',
        p_valor: valorBoleto,
        p_taxa: 0,
        p_metadados: metadados,
      })

      if (reqError) throw reqError

      const { error: boletoError } = await supabase.from('boletos_pendentes' as any).insert({
        user_id: user.id,
        codigo_barras: codigo.replace(/\D/g, ''),
        status: 'pendente',
        valor: valorBoleto,
        data_captura: new Date().toISOString(),
      })

      if (boletoError) throw boletoError

      toast.success('Boleto enviado para aprovação')
      setCodigo('')
      setIsValid(null)
      setValorBoleto(0)
      setVencimentoBoleto(null)
      refreshData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao processar o boleto. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const isError = isValid === false && codigo.replace(/\D/g, '').length >= 40
  const isSuccess = isValid === true
  const isEmpty = codigo.length === 0
  const digitsCount = codigo.replace(/\D/g, '').length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 flex items-center shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 mr-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium tracking-tight">Pagar Boleto</h1>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 pt-8 animate-in fade-in duration-500">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-2 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Barcode className="w-6 h-6 text-primary" />
                Código de Barras
              </h2>
              <p className="text-slate-500 text-sm">Digite o código de barras (40 a 48 dígitos).</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCameraOpen(true)}
              className="gap-2 shrink-0"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Ler com Câmera</span>
              <span className="sm:hidden">Ler</span>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full md:w-[400px] flex-shrink-0 space-y-2">
              <div className="relative group">
                {loading && (
                  <Skeleton className="absolute inset-0 h-14 w-full rounded-xl z-10 opacity-50 pointer-events-none" />
                )}
                <Input
                  placeholder="Apenas números..."
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  maxLength={48}
                  disabled={saving}
                  className={cn(
                    'h-14 px-4 text-base tracking-wide rounded-xl shadow-sm pr-12 transition-colors relative z-0',
                    isError
                      ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 text-red-900'
                      : isSuccess
                        ? 'border-green-500 focus-visible:ring-green-500 bg-green-50/50 text-green-900'
                        : 'border-slate-300 focus-visible:ring-primary',
                  )}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                  {loading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                  {!loading && isSuccess && (
                    <CheckCircle2 className="w-6 h-6 text-green-500 animate-in zoom-in duration-300" />
                  )}
                  {!loading && isError && (
                    <XCircle className="w-6 h-6 text-red-500 animate-in zoom-in duration-300" />
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center min-h-[20px]">
                {isError && !loading && (
                  <p className="text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                    Código de barras inválido
                  </p>
                )}
                {!isError && <div />}
                <p className="text-xs text-slate-400 font-medium ml-auto">
                  {digitsCount} de 40-48 dígitos
                </p>
              </div>

              {isSuccess && !loading && valorBoleto > 0 && (
                <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-medium">Valor do Boleto:</span>
                    <span className="text-lg font-bold text-slate-800">
                      R$ {valorBoleto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center gap-4">
                    <span className="text-slate-500 text-sm font-medium">Vencimento:</span>
                    <Input
                      type="date"
                      value={vencimentoBoleto}
                      onChange={(e) => setVencimentoBoleto(e.target.value)}
                      className="w-auto h-10 bg-white text-slate-800 font-bold shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSalvar}
              disabled={!isSuccess || saving || isEmpty || loading}
              className={cn(
                'w-full md:w-auto h-14 px-8 rounded-xl font-medium text-base shadow-sm transition-all duration-300 md:mt-0',
                isSuccess && !saving ? 'bg-primary hover:bg-primary/90 text-white' : '',
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </Button>
          </div>
        </div>
      </main>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Ler Código de Barras
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Posicione a linha do código de barras no centro da tela.
            </DialogDescription>
          </DialogHeader>
          <div className="relative bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner min-h-[300px]">
            {cameraError ? (
              <div className="text-center p-6 text-slate-300 z-10 relative">
                <p>{cameraError}</p>
                <Button
                  variant="outline"
                  className="mt-4 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  onClick={() => setIsCameraOpen(false)}
                >
                  Digitar Manualmente
                </Button>
              </div>
            ) : (
              <div id="qr-reader" className="w-full h-full min-h-[300px]" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
