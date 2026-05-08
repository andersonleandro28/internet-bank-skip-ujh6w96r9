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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="mb-4 space-y-3">
          <DialogTitle className="text-foreground text-xl">Criar Nova Cesta</DialogTitle>
          <DialogDescription>
            Configure um novo pacote de serviços customizado para este cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-foreground">Nome da Cesta</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Cesta Premium"
              className="focus-visible:ring-primary border-input p-3 h-auto"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-foreground">Serviços Inclusos</Label>
            <div className="grid gap-4">
              {servicos.map((s: any) => (
                <div
                  key={s.id}
                  className="p-4 border border-border rounded-lg space-y-3 bg-secondary/20"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`ns-${s.id}`}
                      checked={itens[s.id]?.selected || false}
                      onCheckedChange={(c) =>
                        setItens((prev) => ({ ...prev, [s.id]: { ...prev[s.id], selected: !!c } }))
                      }
                    />
                    <Label
                      htmlFor={`ns-${s.id}`}
                      className="cursor-pointer font-medium text-foreground"
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
                          value={itens[s.id]?.taxa_percentual || ''}
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
                          value={itens[s.id]?.taxa_fixa || ''}
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
        </div>
        <DialogFooter className="mt-6 space-x-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="p-3 h-auto">
            Cancelar
          </Button>
          <Button
            onClick={handleCriar}
            disabled={isSaving || !nome.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground transition-colors p-3 h-auto"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Cesta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
