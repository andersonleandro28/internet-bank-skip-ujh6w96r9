import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Check,
  RefreshCcw,
  Activity,
  Receipt,
  ArrowLeftRight,
  Bitcoin,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Taxa = { id: string; percentual: number; valor_fixo: number }
type Servico = {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  taxas_servicos: Taxa[]
}

function ServiceCard({
  servico,
  onSave,
}: {
  servico: Servico
  onSave: (s: Servico, p: number, f: number, a: boolean) => Promise<void>
}) {
  const taxa = servico.taxas_servicos[0] || { percentual: 0, valor_fixo: 0, id: '' }
  const [percentual, setPercentual] = useState(taxa.percentual.toString())
  const [valorFixo, setValorFixo] = useState(taxa.valor_fixo.toString())
  const [ativo, setAtivo] = useState(servico.ativo)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const p = parseFloat(percentual),
      v = parseFloat(valorFixo)
    if (isNaN(p) || p < 0 || p > 100) return toast.error('O percentual deve estar entre 0 e 100.')
    if (isNaN(v) || v < 0) return toast.error('O valor fixo deve ser positivo.')
    setLoading(true)
    await onSave(servico, p, v, ativo)
    setLoading(false)
  }

  const icons: Record<string, any> = {
    Boleto: Receipt,
    PIX: Activity,
    TED: ArrowLeftRight,
    'Carga USDT': Bitcoin,
  }
  const Icon = icons[servico.nome] || Activity

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg leading-tight">{servico.nome}</CardTitle>
            <CardDescription className="text-xs mt-1 line-clamp-2">
              {servico.descricao}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-1.5">
          <Label>Taxa percentual (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Taxa fixa (R$)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={valorFixo}
            onChange={(e) => setValorFixo(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Label className="cursor-pointer" htmlFor={`status-${servico.id}`}>
            Serviço Ativo
          </Label>
          <Switch id={`status-${servico.id}`} checked={ativo} onCheckedChange={setAtivo} />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSave} disabled={loading}>
          {loading ? (
            <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Salvar
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function ConfiguracoesTaxas() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [auditoria, setAuditoria] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: s, error: sErr } = await supabase
        .from('servicos')
        .select('id, nome, descricao, ativo, taxas_servicos(id, percentual, valor_fixo)')
        .order('nome')
      if (sErr) throw sErr
      setServicos(s as any)

      const { data: a, error: aErr } = await supabase
        .from('auditoria')
        .select('id, acao, timestamp, taxa_aplicada, registro_id, tabela, usuarios(email)')
        .eq('tabela', 'taxas_servicos')
        .order('timestamp', { ascending: false })
        .limit(50)
      if (aErr) throw aErr
      setAuditoria(a)
    } catch (e: any) {
      setError('Não foi possível carregar as configurações. Verifique sua conexão ou permissões.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSave = async (servico: Servico, p: number, v: number, ativo: boolean) => {
    try {
      if (servico.ativo !== ativo)
        await supabase.from('servicos').update({ ativo }).eq('id', servico.id)

      const taxa = servico.taxas_servicos[0]
      let taxaId = taxa?.id
      if (taxaId) {
        await supabase
          .from('taxas_servicos')
          .update({ percentual: p, valor_fixo: v })
          .eq('id', taxaId)
      } else {
        const { data } = await supabase
          .from('taxas_servicos')
          .insert({ servico_id: servico.id, percentual: p, valor_fixo: v })
          .select('id')
          .single()
        taxaId = data?.id
      }

      await supabase
        .from('auditoria')
        .insert({
          admin_id: user?.id,
          acao: 'alterou_taxa',
          tabela: 'taxas_servicos',
          registro_id: taxaId,
          taxa_aplicada: p,
        })
      toast.success('Taxa atualizada com sucesso')
      fetchData()
    } catch (e) {
      toast.error('Erro ao salvar as configurações.')
    }
  }

  const logs = useMemo(() => {
    return auditoria
      .map((a, i, arr) => {
        const s = servicos.find((s) => s.taxas_servicos[0]?.id === a.registro_id)
        const prev = arr
          .slice(i + 1)
          .find((old) => old.registro_id === a.registro_id)?.taxa_aplicada
        return {
          ...a,
          serviceName: s?.nome || 'Desconhecido',
          serviceId: s?.id,
          adminEmail: a.usuarios?.email || 'Sistema',
          prevValue: prev,
        }
      })
      .filter((a) => filter === 'all' || a.serviceId === filter)
  }, [auditoria, servicos, filter])

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Configurar Serviços e Taxas
        </h1>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[360px] w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchData}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      ) : servicos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-muted-foreground">Nenhum serviço encontrado no banco de dados.</p>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicos.map((s) => (
              <ServiceCard key={s.id} servico={s} onSave={handleSave} />
            ))}
          </div>
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-800">Histórico de Alterações</h2>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os serviços</SelectItem>
                  {servicos.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum registro de alteração encontrado.
                </p>
              ) : (
                logs.map((log) => (
                  <Card
                    key={log.id}
                    className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{log.serviceName}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{log.adminEmail}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg">
                      {log.prevValue !== undefined && (
                        <>
                          <div className="text-sm">
                            <span className="text-muted-foreground block text-xs">Anterior</span>
                            <span className="font-medium">{log.prevValue}%</span>
                          </div>
                          <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                        </>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground block text-xs">Nova</span>
                        <span className="font-medium text-primary">{log.taxa_aplicada}%</span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
