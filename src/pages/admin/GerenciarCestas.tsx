import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, PackagePlus, Users, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import {
  getClientes,
  getServicos,
  getCestasByUserId,
  atualizarCesta,
  criarCesta,
  ClienteData,
} from '@/services/cestas'
import { CestaCard } from '@/components/admin/CestaCard'
import { NovaCestaModal } from '@/components/admin/NovaCestaModal'

export default function GerenciarCestas() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [clientes, setClientes] = useState<ClienteData[]>([])
  const [servicos, setServicos] = useState<any[]>([])
  const [selectedCliente, setSelectedCliente] = useState<string>('')

  const [cestas, setCestas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCestas, setLoadingCestas] = useState(false)
  const [error, setError] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [resClientes, resServicos] = await Promise.all([getClientes(), getServicos()])

      if (resClientes.error) throw resClientes.error
      setClientes(resClientes.data)
      setServicos(resServicos.data || [])
    } catch (err: any) {
      console.error(err)
      setError('Erro ao carregar dados iniciais.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedCliente) {
      loadCestas(selectedCliente)
    } else {
      setCestas([])
    }
  }, [selectedCliente])

  const loadCestas = async (userId: string) => {
    try {
      setLoadingCestas(true)
      const { data, error } = await getCestasByUserId(userId)
      if (error) throw error
      setCestas(data || [])
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as cestas do cliente.',
        variant: 'destructive',
      })
    } finally {
      setLoadingCestas(false)
    }
  }

  const handleSalvarCesta = async (id: string, cestaData: any, itensData: any[]) => {
    if (!user) return
    try {
      setIsSaving(true)
      await atualizarCesta(id, cestaData, itensData, user.id)
      toast({ title: 'Sucesso', description: 'Cesta atualizada com sucesso!' })
      await loadCestas(selectedCliente)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Erro ao salvar cesta.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCriarCesta = async (cestaData: any, itensData: any[]) => {
    if (!user || !selectedCliente) return
    try {
      setIsSaving(true)
      const dados = { ...cestaData, user_id: selectedCliente }
      await criarCesta(dados, itensData, user.id)
      toast({ title: 'Sucesso', description: 'Nova cesta criada com sucesso!' })
      setModalOpen(false)
      await loadCestas(selectedCliente)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Erro ao criar cesta.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in font-sans">
      <header className="bg-[#8B5CF6] rounded-xl p-4 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium tracking-tight">Gerenciar Cestas de Clientes</h1>
        </div>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-gray-700 font-medium">
              <Users className="h-5 w-5 text-[#8B5CF6]" />
              <h2>Selecione o Cliente</h2>
            </div>
            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
              <SelectTrigger className="w-full h-12 focus:ring-[#8B5CF6]">
                <SelectValue placeholder="Busque por nome ou email..." />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} ({c.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedCliente ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-xl bg-gray-50/50">
              <PackagePlus className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Selecione um cliente acima para gerenciar suas cestas.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in-up duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Cestas do Cliente</h3>
                <Button
                  onClick={() => setModalOpen(true)}
                  className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white transition-colors"
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Criar Nova Cesta
                </Button>
              </div>

              {loadingCestas ? (
                <div className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-xl" />
                </div>
              ) : cestas.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                  <p>Este cliente não possui nenhuma cesta customizada.</p>
                </div>
              ) : (
                cestas.map((cesta) => (
                  <CestaCard
                    key={cesta.id}
                    cesta={cesta}
                    servicos={servicos}
                    onSave={handleSalvarCesta}
                    isSaving={isSaving}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      <NovaCestaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        servicos={servicos}
        onCriar={handleCriarCesta}
        isSaving={isSaving}
      />
    </div>
  )
}
