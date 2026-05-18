import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import {
  sendEmail,
  baseEmailHtml,
  getUserName,
  formatCurrency,
  supabase,
} from '../_shared/email.ts'

Deno.serve(async (req) => {
  try {
    const now = new Date()
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

    const { data: usuarios, error: usersErr } = await supabase
      .from('usuarios')
      .select('id, email, tipo')
      .eq('status', 'aprovado')
    if (usersErr) throw usersErr
    if (!usuarios || usuarios.length === 0)
      return new Response('Nenhum usuário aprovado.', { status: 200 })

    const results = []

    for (const user of usuarios) {
      try {
        const nome = await getUserName(user.id, user.tipo)
        const { data: requisicoes } = await supabase
          .from('requisicoes')
          .select('tipo, valor_total, taxa_aplicada, created_at, status')
          .eq('user_id', user.id)
          .eq('status', 'aprovado')
          .gte('created_at', firstDayLastMonth.toISOString())
          .lte('created_at', lastDayLastMonth.toISOString())
          .order('created_at', { ascending: false })

        const total_transacoes = requisicoes?.length || 0
        const valor_movimentado =
          requisicoes?.reduce((acc, r) => acc + Number(r.valor_total || 0), 0) || 0
        const taxa_total =
          requisicoes?.reduce((acc, r) => acc + Number(r.taxa_aplicada || 0), 0) || 0
        const ticket_medio = total_transacoes > 0 ? valor_movimentado / total_transacoes : 0

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
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">R$ ${formatCurrency(r.valor_total)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">R$ ${formatCurrency(r.taxa_aplicada)}</td>
            </tr>
          `,
                )
                .join('')
            : `<tr><td colspan="4" style="padding: 10px; text-align: center; color: #666;">Nenhuma transação no período.</td></tr>`

        const assunto = `Seu relatório de transações — ${mesAno}`
        const conteudo = `
          <h2 style="color: #1a4d2e; margin-top: 0;">Olá, ${nome}!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Aqui está o seu relatório de transações referente a <strong>${mesAno}</strong>.</p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; display: flex; flex-wrap: wrap; gap: 16px;">
            <div style="flex: 1; min-width: 120px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Transações</p>
              <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #1a4d2e;">${total_transacoes}</p>
            </div>
            <div style="flex: 1; min-width: 120px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Movimentado</p>
              <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #1a4d2e;">R$ ${formatCurrency(valor_movimentado)}</p>
            </div>
            <div style="flex: 1; min-width: 120px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Taxas Pagas</p>
              <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #1a4d2e;">R$ ${formatCurrency(taxa_total)}</p>
            </div>
            <div style="flex: 1; min-width: 120px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Ticket Médio</p>
              <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #1a4d2e;">R$ ${formatCurrency(ticket_medio)}</p>
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
            <a href="https://www.aclop.com.br/extrato" style="display: inline-block; background-color: #7fff00; color: #1a4d2e; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">Ver extrato completo</a>
          </div>
        `

        const html = baseEmailHtml(conteudo)
        const success = await sendEmail({
          to: user.email,
          subject: assunto,
          html,
          user_id: user.id,
          tipo: 'relatorio_mensal',
          payload: { mesAno, user_id: user.id },
        })
        results.push({ email: user.email, success })
      } catch (err: any) {
        results.push({ email: user.email, success: false, error: err.message })
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
