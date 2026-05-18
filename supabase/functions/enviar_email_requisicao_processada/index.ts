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
    const { record, old_record } = await req.json()
    if (!record || !['aprovado', 'reprovado'].includes(record.status)) {
      return new Response('Ignorado.', { status: 200 })
    }

    if (old_record && old_record.status === record.status) {
      return new Response('Ignorado. Status não foi alterado.', { status: 200 })
    }

    const user_id = record.user_id
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('email, tipo')
      .eq('id', user_id)
      .single()
    if (!usuario) return new Response('Usuário não encontrado', { status: 404 })

    const nome = await getUserName(user_id, usuario.tipo)
    const isAprovado = record.status === 'aprovado'
    const valorFormatado = formatCurrency(record.valor)
    const taxaFormatada = formatCurrency(record.taxa_aplicada)
    const totalFormatado = formatCurrency(record.valor_total)

    const assunto = isAprovado
      ? `Sua requisição de R$ ${valorFormatado} foi aprovada!`
      : `Sua requisição de R$ ${valorFormatado} foi reprovada`

    const linkAcao = isAprovado
      ? 'https://www.aclop.com.br/extrato'
      : 'https://www.aclop.com.br/transferir'
    const textoBotao = isAprovado ? 'Ver extrato' : 'Tentar novamente'
    const mensagemPrincipal = isAprovado
      ? 'Sua requisição foi aprovada com sucesso!'
      : 'Sua requisição foi reprovada.'

    const statusHtml = isAprovado
      ? `<div style="margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 6px; text-align: center;"><span style="display: inline-block; vertical-align: middle; color: #1a4d2e; font-weight: bold;">✅ Aprovada</span></div>`
      : `<div style="margin-top: 16px; padding: 12px; background-color: #fee2e2; border-radius: 6px; text-align: center;"><span style="display: inline-block; vertical-align: middle; color: #b91c1c; font-weight: bold;">❌ O saldo foi devolvido à sua conta.</span></div>`

    const conteudo = `
      <h2 style="color: #333333; margin-top: 0;">Olá, ${nome}!</h2>
      <p style="font-size: 16px; line-height: 1.5;">${mensagemPrincipal}</p>
      
      <div style="margin: 24px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 16px 0;">
        <p style="margin: 8px 0; font-size: 14px;"><strong>Tipo da Operação:</strong> <span style="text-transform: uppercase;">${record.tipo || 'Transação'}</span></p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Valor Solicitado:</strong> R$ ${valorFormatado}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Taxa Aplicada:</strong> R$ ${taxaFormatada}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Valor Total:</strong> R$ ${totalFormatado}</p>
      </div>

      ${statusHtml}

      <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
        <a href="${linkAcao}" style="background-color: #7fff00; color: #1a4d2e; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">${textoBotao}</a>
      </div>
    `

    const html = baseEmailHtml(conteudo)
    const success = await sendEmail({
      to: usuario.email,
      subject: assunto,
      html,
      user_id,
      tipo: 'requisicao_processada',
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
