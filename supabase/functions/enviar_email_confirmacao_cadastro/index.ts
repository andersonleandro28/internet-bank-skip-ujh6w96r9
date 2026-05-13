import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { sendEmail, baseEmailHtml, getUserName, sleep } from '../_shared/email.ts'

Deno.serve(async (req) => {
  try {
    const { record, type, table } = await req.json()
    if (!record || table !== 'usuarios' || type !== 'INSERT') {
      return new Response('Ignorado', { status: 200 })
    }

    if (record.status !== 'pendente') {
      return new Response('Ignorado. Status não é pendente.', { status: 200 })
    }

    // Esperar um pouco para que os perfis PF/PJ sejam inseridos pela aplicação / outros triggers
    await sleep(3000)

    const user_id = record.id
    const email = record.email
    const tipoUser = record.tipo || 'PF'

    const nome = await getUserName(user_id, tipoUser)
    const tipoFormatado = tipoUser === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'

    const assunto = 'Bem-vindo ao Aclop Bank! Cadastro recebido'
    const conteudo = `
      <h2 style="color: #333333; margin-top: 0;">Olá, ${nome}!</h2>
      <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">
        Recebemos seu cadastro como <strong>${tipoFormatado}</strong>. Estamos analisando seus documentos e em breve você receberá uma resposta.
      </p>
      <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
        <a href="https://carteiraseaconnection.goskip.app/" style="background-color: #7fff00; color: #1a4d2e; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Acompanhar status</a>
      </div>
      <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 0;">
        Se você não realizou este cadastro, por favor ignore este email.
      </p>
    `

    const html = baseEmailHtml(conteudo)
    const success = await sendEmail({
      to: email,
      subject: assunto,
      html,
      user_id,
      tipo: 'confirmacao_cadastro',
      payload: record,
    })

    if (!success) {
      console.error(
        `[Edge Function] Falha no envio do email de boas-vindas para: ${email}. Verifique a tabela emails_pendentes e emails_log.`,
      )
    } else {
      console.log(`[Edge Function] Email de boas-vindas enviado com sucesso para: ${email}.`)
    }

    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(`[Edge Function] Exceção crítica em enviar_email_confirmacao_cadastro:`, error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
