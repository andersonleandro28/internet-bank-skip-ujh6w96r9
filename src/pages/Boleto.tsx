import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Barcode, Loader2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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

  const validateLinhaDigitavel = (linha: string) => {
    const digits = linha.replace(/\D/g, '')
    if (digits.length < 40 || digits.length > 47) return false

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
    if (digits.length === 47) {
      return parseInt(digits.substring(37, 47), 10) / 100
    }
    // Mock value for other formats based on first digits to be deterministic
    return (parseInt(digits.substring(0, 4), 10) || 15000) / 100
  }

  useEffect(() => {
    const digits = codigo.replace(/\D/g, '')
    if (digits.length === 0) {
      setIsValid(null)
      setLoading(false)
      setValorBoleto(0)
      return
    }

    setIsValid(null)
    setLoading(true)

    const timer = setTimeout(() => {
      const valid = validateLinhaDigitavel(digits)
      setIsValid(valid)
      if (valid) {
        setValorBoleto(extractValue(digits))
      } else {
        setValorBoleto(0)
      }
      setLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [codigo])

  const handleCameraScan = () => {
    if (!navigator.mediaDevices || !('BarcodeDetector' in window)) {
      toast.error('Câmera não disponível — digite manualmente')
      return
    }
    // Fallback error if API is present but device fails
    toast.error('Câmera não disponível — digite manualmente')
  }

  const handleSalvar = async () => {
    if (!isValid || !user || !codigo || !conta) return

    if (conta.saldo < valorBoleto) {
      toast.error('Saldo insuficiente para este pagamento')
      return
    }

    setSaving(true)
    try {
      // 1. Criar requisicao e deduzir saldo (Atomic via RPC)
      const { error: reqError } = await supabase.rpc('criar_requisicao_transferencia', {
        p_user_id: user.id,
        p_tipo: 'boleto_pago',
        p_valor: valorBoleto,
        p_taxa: 0,
        p_metadados: { codigo_barras: codigo.replace(/\D/g, '') },
      })

      if (reqError) throw reqError

      // 2. Salvar na tabela boletos_pendentes
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
              <p className="text-slate-500 text-sm">Digite o código de barras (40 a 47 dígitos).</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCameraScan}
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
                  maxLength={47}
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
                  {digitsCount} de 40-47 dígitos
                </p>
              </div>

              {isSuccess && !loading && valorBoleto > 0 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-medium">Valor do Boleto:</span>
                    <span className="text-lg font-bold text-slate-800">
                      R$ {valorBoleto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
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
    </div>
  )
}
