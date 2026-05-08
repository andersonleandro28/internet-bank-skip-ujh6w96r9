import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id,
        email,
        tipo,
        status,
        created_at,
        usuarios_pf (nome, cpf),
        usuarios_pj (razao_social, cnpj)
      `)
      .eq('role', 'cliente')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setClientes(data)
    }
    setLoading(false)
  }

  const filteredClientes = clientes.filter((c) => {
    const term = search.toLowerCase()
    const nome = c.tipo === 'PF' ? c.usuarios_pf?.[0]?.nome : c.usuarios_pj?.[0]?.razao_social
    const doc = c.tipo === 'PF' ? c.usuarios_pf?.[0]?.cpf : c.usuarios_pj?.[0]?.cnpj

    return (
      c.email.toLowerCase().includes(term) ||
      (nome && nome.toLowerCase().includes(term)) ||
      (doc && doc.includes(term))
    )
  })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-muted-foreground">Gerencie os usuários da plataforma</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Todos os Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou doc..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Nenhum cliente encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => {
                    const nome =
                      cliente.tipo === 'PF'
                        ? cliente.usuarios_pf?.[0]?.nome
                        : cliente.usuarios_pj?.[0]?.razao_social
                    const doc =
                      cliente.tipo === 'PF'
                        ? cliente.usuarios_pf?.[0]?.cpf
                        : cliente.usuarios_pj?.[0]?.cnpj

                    return (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div className="font-medium text-slate-900">
                            {nome || 'Não informado'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {doc || 'Sem documento'}
                          </div>
                        </TableCell>
                        <TableCell>{cliente.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cliente.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              cliente.status === 'aprovado'
                                ? 'default'
                                : cliente.status === 'pendente'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className={
                              cliente.status === 'aprovado'
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                : ''
                            }
                          >
                            {cliente.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(cliente.created_at), "dd 'de' MMM, yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/admin/clientes/${cliente.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Perfil
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
