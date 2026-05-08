import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

interface FinanceiroTabelaProps {
  data: any[]
  clientes: Record<string, string>
}

export function FinanceiroTabela({ data, clientes }: FinanceiroTabelaProps) {
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const tableData = useMemo(() => {
    const agg = data.reduce(
      (acc, curr) => {
        const uid = curr.user_id
        if (!acc[uid]) {
          acc[uid] = {
            id: uid,
            nome: clientes[uid] || 'Cliente Desconhecido',
            transacoes: 0,
            receita: 0,
          }
        }
        acc[uid].transacoes += 1
        acc[uid].receita += Number(curr.taxa_aplicada || 0)
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(agg).sort((a, b) => (b as any).receita - (a as any).receita)
  }, [data, clientes])

  const totalPages = Math.ceil(tableData.length / itemsPerPage)
  const paginatedData = tableData.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const handleExport = () => {
    const headers = ['Cliente', 'Transacoes', 'Receita Total']
    const rows = tableData.map((c: any) => [
      `"${c.nome}"`,
      c.transacoes,
      c.receita.toFixed(2).replace('.', ','),
    ])

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `receita_clientes_${format(new Date(), 'yyyyMMdd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
        <CardTitle className="text-lg font-semibold text-slate-800">Receita por Cliente</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={tableData.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold text-center">Transações</TableHead>
                <TableHead className="font-semibold text-right">Receita Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-slate-700">{row.nome}</TableCell>
                    <TableCell className="text-center text-slate-500">{row.transacoes}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      {formatCurrency(row.receita)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                    Nenhuma receita encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-slate-500">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
