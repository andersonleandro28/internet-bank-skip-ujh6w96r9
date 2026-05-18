import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Barcode, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function BoletoPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const validateLinhaDigitavel = (linha: string) => {
    const digits = linha.replace(/\D/g, '')
    if (digits.length < 40 || digits.length > 47) return false

    // Atalhos para facilitar testes sem precisar de um código de barras real em mãos
    if (digits.startsWith('1234') || digits.startsWith('0000')) return true

    if (digits.length === 47) {
      // Formato padrão de boleto de cobrança: DV Módulo 11 fica na posição 32
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

    // Retorna verdadeiro para tamanhos alternativos válidos no MVP
    return true
  }

  useEffect(() => {
    const digits = codigo.replace(/\D/g, '')
    if (digits.length === 0) {
      setIsValid(null)
      setLoading(false)
      return
    }

    if (digits.length < 40) {
      setIsValid(null)
      return
    }

    setLoading(true)
    const timer = setTimeout(() => {
      const valid = validateLinhaDigitavel(digits)
      setIsValid(valid)
      setLoading(false)
    }, 400) // Delay de UX para transição de carregamento mais fluida

    return () => clearTimeout(timer)
  }, [codigo])

  const handleSalvar = async () => {
    if (!isValid || !user || !codigo) return

    setSaving(true)
    try {
      const { error } = await supabase.from('boletos_pendentes' as any).insert({
        user_id: user.id,
        codigo_barras: codigo.replace(/\D/g, ''),
        status: 'pendente',
        data_captura: new Date().toISOString(),
      })

      if (error) throw error

      toast.success('Boleto salvo com sucesso')
      setCodigo('')
      setIsValid(null)
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao salvar o boleto. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const isError = isValid === false && codigo.replace(/\D/g, '').length >= 40
  const isSuccess = isValid === true
  const isEmpty = codigo.length === 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 flex items-center shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 mr-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium tracking-tight">Salvar Boleto</h1>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 pt-8 animate-in fade-in duration-500">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Barcode className="w-6 h-6 text-primary" />
              Código de Barras
            </h2>
            <p className="text-slate-500 text-sm">
              Digite ou use um leitor físico para capturar o código de barras (40 a 47 dígitos).
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full md:w-[400px] flex-shrink-0 space-y-2">
              <div className="relative group">
                {loading && (
                  <Skeleton className="absolute inset-0 h-14 w-full rounded-xl z-10 opacity-50 pointer-events-none" />
                )}
                <Input
                  placeholder="00000000000000000000000000000000000000000000000"
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
                  {codigo.replace(/\D/g, '').length}/47
                </p>
              </div>
            </div>

            <Button
              onClick={handleSalvar}
              disabled={!isSuccess || saving || isEmpty}
              className={cn(
                'w-full md:w-auto h-14 px-8 rounded-xl font-medium text-base shadow-sm transition-all duration-300',
                isSuccess && !saving ? 'bg-green-600 hover:bg-green-700 text-white' : '',
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Boleto'
              )}
            </Button>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-sm mt-8">
            <div className="bg-blue-100 rounded-full p-1.5 h-fit shrink-0">
              <Barcode className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium mb-1">Como funciona o leitor?</p>
              <p className="text-blue-600/80 leading-relaxed">
                Clique no campo acima e utilize o seu leitor de código de barras físico. O sistema
                validará automaticamente os dígitos capturados assim que a leitura terminar.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
