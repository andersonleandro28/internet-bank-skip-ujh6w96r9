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
    <Card className="border-l-4 border-l-[#8B5CF6] shadow-sm mb-4">
      <CardContent className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex-1 space-y-2">
            <Label>Nome da Cesta</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="focus-visible:ring-[#8B5CF6]"
            />
          </div>
          <div className="flex items-center space-x-2 md:pt-6">
            <Label>Ativa</Label>
            <Switch
              checked={ativo}
              onCheckedChange={setAtivo}
              className="data-[state=checked]:bg-[#8B5CF6]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-gray-700 font-semibold">Serviços Customizados</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicos.map((s: any) => (
              <div key={s.id} className="p-4 border rounded-md bg-gray-50/50 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`s-${cesta.id}-${s.id}`}
                    checked={itens[s.id]?.selected}
                    onCheckedChange={(c) =>
                      setItens((prev) => ({ ...prev, [s.id]: { ...prev[s.id], selected: !!c } }))
                    }
                    className="data-[state=checked]:bg-[#8B5CF6] data-[state=checked]:border-[#8B5CF6]"
                  />
                  <Label htmlFor={`s-${cesta.id}-${s.id}`} className="font-medium cursor-pointer">
                    {s.nome}
                  </Label>
                </div>
                {itens[s.id]?.selected && (
                  <div className="grid grid-cols-2 gap-2 pl-6 animate-fade-in-down duration-200">
                    <div className="space-y-1">
                      <Label className="text-xs">Taxa (%)</Label>
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
                        className="h-8 focus-visible:ring-[#8B5CF6]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fixo (R$)</Label>
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
                        className="h-8 focus-visible:ring-[#8B5CF6]"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !nome.trim()}
            className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white transition-colors"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Cesta
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
