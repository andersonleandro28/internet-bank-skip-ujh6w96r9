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
    const { record, limite } = await req.json()
    if (!record) return new Response('Ignorado.', { status: 200 })

    const user_id = record.user_id
    const saldoAtual = record.saldo
    const limiteAlerta = limite || 500
    const diferenca = limiteAlerta - saldoAtual

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('email, tipo, ultimo_alerta_saldo')
      .eq('id', user_id)
      .single()
    if (!usuario) return new Response('Usuário não encontrado', { status: 404 })

    const nome = await getUserName(user_id, usuario.tipo)

    const saldoFormatado = formatCurrency(saldoAtual)
    const limiteFormatado = formatCurrency(limiteAlerta)
    const diferencaFormatada = formatCurrency(diferenca)

    const assunto = 'Alerta: Seu saldo está baixo'
    const conteudo = `
      <h2 style="color: #333333; margin-top: 0;">Olá, ${nome}!</h2>
      <p style="font-size: 16px; line-height: 1.5;">Seu saldo está abaixo do limite configurado de alerta.</p>
      
      <div style="margin: 24px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 16px 0;">
        <p style="margin: 8px 0; font-size: 14px;"><strong>Saldo atual:</strong> R$ ${saldoFormatado}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Limite de alerta:</strong> R$ ${limiteFormatado}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Diferença:</strong> R$ ${diferencaFormatada}</p>
      </div>

      <div style="margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 6px; text-align: center;">
        <span style="display: inline-block; vertical-align: middle; color: #1a4d2e; font-weight: bold; font-size: 18px;">
          ⚠️ Atenção ao seu saldo
        </span>
      </div>

      <p style="font-size: 16px; line-height: 1.5; text-align: center; margin-top: 24px;">
        Considere depositar saldo para continuar usando os serviços.
      </p>

      <div style="text-align: center; margin-top: 24px; margin-bottom: 16px;">
        <a href="https://carteiraseaconnection.goskip.app/carregar" style="background-color: #7fff00; color: #1a4d2e; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Solicitar depósito</a>
      </div>
    `

    const html = baseEmailHtml(conteudo)
    const success = await sendEmail({
      to: usuario.email,
      subject: assunto,
      html,
      user_id,
      tipo: 'alerta_saldo',
      payload: record,
    })

    if (success) {
      await supabase
        .from('usuarios')
        .update({ ultimo_alerta_saldo: new Date().toISOString() })
        .eq('id', user_id)
    }

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
