import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function NovaCestaModal({ open, onOpenChange, servicos, onCriar, isSaving }: any) {
  const [nome, setNome] = useState('')
  const [itens, setItens] = useState<Record<string, any>>({})

  const handleCriar = () => {
    const itensParaSalvar = Object.entries(itens)
      .filter(([_, v]) => v.selected)
      .map(([k, v]) => ({
        servico_id: k,
        taxa_percentual: Number(v.taxa_percentual || 0),
        taxa_fixa: Number(v.taxa_fixa || 0),
        ativo: true,
      }))
    onCriar({ nome, ativo: true }, itensParaSalvar)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setNome('')
          setItens({})
        }
        onOpenChange(val)
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Cesta</DialogTitle>
          <DialogDescription>
            Configure um novo pacote de serviços customizado para este cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome da Cesta</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Cesta Premium"
              className="focus-visible:ring-[#8B5CF6]"
            />
          </div>
          <div className="space-y-3">
            <Label>Serviços Inclusos</Label>
            <div className="grid gap-3">
              {servicos.map((s: any) => (
                <div key={s.id} className="p-3 border rounded-md space-y-3 bg-gray-50/50">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`ns-${s.id}`}
                      checked={itens[s.id]?.selected || false}
                      onCheckedChange={(c) =>
                        setItens((prev) => ({ ...prev, [s.id]: { ...prev[s.id], selected: !!c } }))
                      }
                      className="data-[state=checked]:bg-[#8B5CF6] data-[state=checked]:border-[#8B5CF6]"
                    />
                    <Label htmlFor={`ns-${s.id}`} className="cursor-pointer font-medium">
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
                          value={itens[s.id]?.taxa_percentual || ''}
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
                          value={itens[s.id]?.taxa_fixa || ''}
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCriar}
            disabled={isSaving || !nome.trim()}
            className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Cesta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
