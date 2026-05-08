import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function sendEmailWithRetry(payload: any, maxRetries = 3) {
  let attempt = 0
  const baseDelay = 2000

  while (attempt < maxRetries) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Resend Error: ${res.status} - ${errorText}`)
      }

      return await res.json()
    } catch (err: any) {
      attempt++
      console.error(`Tentativa ${attempt} falhou:`, err.message)
      if (attempt >= maxRetries) {
        throw err
      }
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const now = new Date()
    // Obtém detalhes do mês anterior
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ]
    const monthName = monthNames[firstDayLastMonth.getMonth()]
    const year = firstDayLastMonth.getFullYear()
    const mesAno = `${monthName}/${year}`

    // Buscar todos os usuários aprovados
    const { data: usuarios, error: usersErr } = await supabase
      .from('usuarios')
      .select(`
        id,
        email,
        usuarios_pf ( nome ),
        usuarios_pj ( razao_social )
      `)
      .eq('status', 'aprovado')

    if (usersErr) throw usersErr
    if (!usuarios || usuarios.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum usuário aprovado encontrado.' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const results = []
    const chunkSize = 10

    // Processamento em lotes para evitar sobrecarga de requisições concorrentes
    for (let i = 0; i < usuarios.length; i += chunkSize) {
      const chunk = usuarios.slice(i, i + chunkSize)

      const promises = chunk.map(async (user: any) => {
        try {
          const pfArray = user.usuarios_pf as any[]
          const pjArray = user.usuarios_pj as any[]
          const nome =
            (pfArray && pfArray.length > 0 ? pfArray[0].nome : null) ||
            (pjArray && pjArray.length > 0 ? pjArray[0].razao_social : null) ||
            'Cliente'

          const { data: requisicoes, error: reqErr } = await supabase
            .from('requisicoes')
            .select('tipo, valor_total, taxa_aplicada, created_at, status')
            .eq('user_id', user.id)
            .eq('status', 'aprovado')
            .gte('created_at', firstDayLastMonth.toISOString())
            .lte('created_at', lastDayLastMonth.toISOString())
            .order('created_at', { ascending: false })

          if (reqErr) throw reqErr

          const total_transacoes = requisicoes?.length || 0
          const valor_movimentado =
            requisicoes?.reduce((acc, r) => acc + Number(r.valor_total || 0), 0) || 0
          const taxa_total =
            requisicoes?.reduce((acc, r) => acc + Number(r.taxa_aplicada || 0), 0) || 0
          const ticket_medio = total_transacoes > 0 ? valor_movimentado / total_transacoes : 0

          const formatCurrency = (val: number) =>
            val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          const formatDate = (dateStr: string) => {
            const d = new Date(dateStr)
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
          }

          const rowsHtml =
            requisicoes && requisicoes.length > 0
              ? requisicoes
                  .slice(0, 10)
                  .map(
                    (r: any) => `
              <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${formatDate(r.created_at)}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333; text-transform: capitalize;">${r.tipo}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${formatCurrency(Number(r.valor_total))}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${formatCurrency(Number(r.taxa_aplicada))}</td>
              </tr>
            `,
                  )
                  .join('')
              : `<tr><td colspan="4" style="padding: 10px; text-align: center; color: #666;">Nenhuma transação no período.</td></tr>`

          const subject = `Seu relatório de transações — ${mesAno}`
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <div style="background-color: #1a4d2e; padding: 24px; text-align: center;">
                <h1 style="color: #7fff00; margin: 0; font-size: 24px;">Aclop Bank</h1>
              </div>
              
              <div style="padding: 32px 24px;">
                <h2 style="color: #1a4d2e; margin-top: 0;">Olá, ${nome}!</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Aqui está o seu relatório de transações referente a <strong>${mesAno}</strong>.</p>
                
                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; display: flex; flex-wrap: wrap; gap: 16px;">
                  <div style="flex: 1; min-width: 120px;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Total de Transações</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #1a4d2e;">${total_transacoes}</p>
                  </div>
                  <div style="flex: 1; min-width: 120px;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Valor Movimentado</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #1a4d2e;">${formatCurrency(valor_movimentado)}</p>
                  </div>
                  <div style="flex: 1; min-width: 120px;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Taxas Pagas</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #1a4d2e;">${formatCurrency(taxa_total)}</p>
                  </div>
                  <div style="flex: 1; min-width: 120px;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Ticket Médio</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #1a4d2e;">${formatCurrency(ticket_medio)}</p>
                  </div>
                </div>

                <h3 style="color: #1a4d2e; margin-bottom: 16px;">Últimas Transações</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                  <thead>
                    <tr>
                      <th style="text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563;">Data</th>
                      <th style="text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563;">Tipo</th>
                      <th style="text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563;">Valor</th>
                      <th style="text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563;">Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>

                <div style="text-align: center; margin-top: 32px;">
                  <a href="https://carteiraseaconnection.goskip.app/extrato" style="display: inline-block; background-color: #7fff00; color: #1a4d2e; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">Ver extrato completo</a>
                </div>
              </div>
              
              <div style="background-color: #1a4d2e; padding: 16px; text-align: center;">
                <p style="color: #e5e7eb; margin: 0; font-size: 12px;">Aclop Bank © ${new Date().getFullYear()}</p>
              </div>
            </div>
          `

          const payload = {
            from: 'Aclop Bank <onboarding@resend.dev>',
            to: [user.email],
            subject,
            html,
          }

          try {
            await sendEmailWithRetry(payload)
            return { status: 'success', email: user.email }
          } catch (err: any) {
            console.error(`Erro ao enviar email para ${user.email}:`, err.message)
            await supabase.from('emails_pendentes').insert({
              user_id: user.id,
              email: user.email,
              assunto: subject,
              template: html,
              status: 'reenvio_necessario',
              erro: err.message,
            })
            return { status: 'failed', email: user.email, error: err.message }
          }
        } catch (err: any) {
          return { status: 'error', email: user.email, error: err.message }
        }
      })

      const chunkResults = await Promise.all(promises)
      results.push(...chunkResults)
    }

    return new Response(
      JSON.stringify({
        message: 'Relatórios processados com sucesso.',
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    console.error('Erro na execução do relatório mensal:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
