import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function CestaCard({ cesta, servicos, onSave, isSaving }: any) {
  const [nome, setNome] = useState(cesta.nome)
  const [ativo, setAtivo] = useState(cesta.ativo)
  const [itens, setItens] = useState<Record<string, any>>({})

  useEffect(() => {
    const initialItens: Record<string, any> = {}
    servicos.forEach((s: any) => {
      const itemExistente = cesta.cestas_itens?.find((ci: any) => ci.servico_id === s.id)
      initialItens[s.id] = {
        selected: !!itemExistente,
        taxa_percentual: itemExistente?.taxa_percentual || 0,
        taxa_fixa: itemExistente?.taxa_fixa || 0,
      }
    })
    setItens(initialItens)
  }, [cesta, servicos])

  const handleSave = () => {
    const itensParaSalvar = Object.entries(itens)
      .filter(([_, v]) => v.selected)
      .map(([k, v]) => ({
        servico_id: k,
        taxa_percentual: Number(v.taxa_percentual),
        taxa_fixa: Number(v.taxa_fixa),
        ativo: true,
      }))
    onSave(cesta.id, { nome, ativo }, itensParaSalvar)
  }

  return (
    <Card className="border-l-4 border-l-primary shadow-subtle mb-4 rounded-lg bg-card border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex-1 space-y-3">
            <Label className="text-foreground">Nome da Cesta</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="focus-visible:ring-primary border-input p-3 h-auto"
            />
          </div>
          <div className="flex items-center space-x-3 md:pt-7">
            <Label className="text-foreground">Ativa</Label>
            <Switch
              checked={ativo}
              onCheckedChange={setAtivo}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <Label className="text-foreground font-semibold">Serviços Customizados</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicos.map((s: any) => (
              <div
                key={s.id}
                className="p-4 border border-border rounded-lg bg-secondary/20 space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`s-${cesta.id}-${s.id}`}
                    checked={itens[s.id]?.selected}
                    onCheckedChange={(c) =>
                      setItens((prev) => ({ ...prev, [s.id]: { ...prev[s.id], selected: !!c } }))
                    }
                  />
                  <Label
                    htmlFor={`s-${cesta.id}-${s.id}`}
                    className="font-medium cursor-pointer text-foreground"
                  >
                    {s.nome}
                  </Label>
                </div>
                {itens[s.id]?.selected && (
                  <div className="grid grid-cols-2 gap-3 pl-7 animate-fade-in-down duration-200">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Taxa (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={itens[s.id].taxa_percentual}
                        onChange={(e) =>
                          setItens((prev) => ({
                            ...prev,
                            [s.id]: { ...prev[s.id], taxa_percentual: e.target.value },
                          }))
                        }
                        className="p-3 h-auto focus-visible:ring-primary border-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Fixo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={itens[s.id].taxa_fixa}
                        onChange={(e) =>
                          setItens((prev) => ({
                            ...prev,
                            [s.id]: { ...prev[s.id], taxa_fixa: e.target.value },
                          }))
                        }
                        className="p-3 h-auto focus-visible:ring-primary border-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || !nome.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground transition-colors p-3 h-auto"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Cesta
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
