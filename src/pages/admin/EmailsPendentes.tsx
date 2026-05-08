import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { RefreshCw, MailWarning, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface EmailPendente {
  id: string
  email: string
  assunto: string
  status: string
  erro: string
  created_at: string
  template: string
}

export default function EmailsPendentes() {
  const [emails, setEmails] = useState<EmailPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [reenviando, setReenviando] = useState<string | null>(null)
  const [testando, setTestando] = useState(false)

  const fetchEmails = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('emails_pendentes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar e-mails pendentes')
    } else {
      setEmails(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEmails()
  }, [])

  const handleReenviar = async (email: EmailPendente) => {
    setReenviando(email.id)
    try {
      const { error } = await supabase
        .from('emails_pendentes')
        .update({
          status: 'pendente',
          tentativas: 0,
          proxima_tentativa: new Date().toISOString(),
        })
        .eq('id', email.id)

      if (error) throw error

      // Call the retry edge function immediately to force processing
      await supabase.functions.invoke('retry_emails_pendentes', { method: 'POST' })

      toast.success('Reenvio processado com sucesso.')
      fetchEmails()
    } catch (error) {
      toast.error('Erro ao reenviar e-mail')
    } finally {
      setReenviando(null)
    }
  }

  const handleTriggerRelatorio = async () => {
    setTestando(true)
    toast.info('Processando relatórios mensais...')
    try {
      const { data, error } = await supabase.functions.invoke('enviar_relatorio_mensal', {
        method: 'POST',
      })
      if (error) throw error

      console.log('Resultados do relatório:', data)
      toast.success('Relatórios mensais disparados com sucesso! Verifique a caixa de entrada.')
      fetchEmails()
    } catch (error: any) {
      toast.error(`Erro ao processar relatórios: ${error.message}`)
    } finally {
      setTestando(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">E-mails Pendentes</h1>
          <p className="text-slate-500 mt-1">
            Gerencie os e-mails que falharam durante o envio automático ou simule processos em
            massa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={handleTriggerRelatorio}
            disabled={testando}
            className="flex gap-2 items-center bg-[#1a4d2e] hover:bg-[#1a4d2e]/90 text-white"
          >
            {testando ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Testar Relatório Mensal
          </Button>
          <Button onClick={fetchEmails} variant="outline" size="icon" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailWarning className="h-5 w-5 text-amber-500" />
            Fila de Retentativas e Erros
          </CardTitle>
          <CardDescription>
            Mostrando o registro de todos os envios marcados como pendentes ou que necessitam de
            intervenção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      Nenhum e-mail pendente ou com erro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell className="text-sm">
                        {new Date(email.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{email.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm" title={email.assunto}>
                        {email.assunto}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            email.status === 'reenvio_necessario' || email.status === 'erro'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {email.status || 'pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReenviar(email)}
                          disabled={reenviando === email.id}
                        >
                          {reenviando === email.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'Marcar Reenvio'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
