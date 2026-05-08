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
    const { record } = await req.json()
    if (!record || record.status !== 'confirmado') {
      return new Response('Ignorado.', { status: 200 })
    }

    const user_id = record.user_id
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('email, tipo')
      .eq('id', user_id)
      .single()
    if (!usuario) return new Response('Usuário não encontrado', { status: 404 })

    const { data: conta } = await supabase
      .from('contas')
      .select('saldo')
      .eq('user_id', user_id)
      .single()

    const nome = await getUserName(user_id, usuario.tipo)
    const valorFormatado = formatCurrency(record.valor)
    const saldoFormatado = formatCurrency(conta?.saldo || 0)

    const dataHora = new Date(record.confirmed_at || record.created_at || new Date())
    const dataStr = dataHora.toLocaleDateString('pt-BR')
    const horaStr = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const assunto = `Depósito de R$ ${valorFormatado} creditado com sucesso!`
    const conteudo = `
      <h2 style="color: #333333; margin-top: 0;">Olá, ${nome}!</h2>
      <p style="font-size: 16px; line-height: 1.5;">Um depósito foi creditado em sua conta!</p>
      
      <div style="margin: 24px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 16px 0;">
        <p style="margin: 8px 0; font-size: 14px;"><strong>Valor:</strong> R$ ${valorFormatado}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Data/Hora:</strong> ${dataStr} às ${horaStr}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Novo saldo:</strong> R$ ${saldoFormatado}</p>
      </div>

      <div style="margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 6px; text-align: center;">
        <span style="display: inline-block; vertical-align: middle; color: #1a4d2e; font-weight: bold; font-size: 18px;">
          🟢 Depósito Confirmado
        </span>
      </div>

      <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
        <a href="https://carteiraseaconnection.goskip.app/extrato" style="background-color: #7fff00; color: #1a4d2e; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Ver extrato</a>
      </div>
    `

    const html = baseEmailHtml(conteudo)
    const success = await sendEmail({
      to: usuario.email,
      subject: assunto,
      html,
      user_id,
      tipo: 'deposito_creditado',
      payload: record,
    })

    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
