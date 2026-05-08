import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

Deno.serve(async (req) => {
  try {
    const payload = await req.json()

    let user_id = ''
    let email = ''
    let tipo = 'PF'
    let status = ''

    if (payload.type === 'INSERT' && payload.table === 'usuarios') {
      user_id = payload.record.id
      email = payload.record.email
      tipo = payload.record.tipo || 'PF'
      status = payload.record.status
    } else if (payload.user_id) {
      user_id = payload.user_id
      email = payload.email
      tipo = payload.tipo || 'PF'
      status = payload.status || 'pendente'
    }

    if (!email || status !== 'pendente') {
      return new Response(
        JSON.stringify({ message: 'Ignorado. Não é um novo usuário pendente.' }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Wait a bit to ensure the client has inserted the profile records (usuarios_pf/pj)
    await sleep(2000)

    let nome = 'Cliente'
    if (tipo === 'PF') {
      const { data } = await supabase
        .from('usuarios_pf')
        .select('nome')
        .eq('user_id', user_id)
        .single()
      if (data?.nome) nome = data.nome
    } else {
      const { data } = await supabase
        .from('usuarios_pj')
        .select('razao_social')
        .eq('user_id', user_id)
        .single()
      if (data?.razao_social) nome = data.razao_social
    }

    const assunto = 'Bem-vindo ao Internet Bank! Cadastro recebido'
    const tipoFormatado = tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #8B5CF6; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Internet Bank</h1>
        </div>
        <div style="padding: 32px; color: #333333;">
          <h2 style="color: #333333; margin-top: 0;">Olá, ${nome}!</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">
            Recebemos seu cadastro como <strong>${tipoFormatado}</strong>. Estamos analisando seus documentos e em breve você receberá uma resposta.
          </p>
          <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
            <a href="https://carteiraseaconnection.goskip.app/" style="background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Acompanhar status</a>
          </div>
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 0;">
            Se você não realizou este cadastro, por favor ignore este email.
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Internet Bank &copy; 2026. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `

    let success = false
    let attempt = 0
    const delays = [2000, 4000, 8000]
    let lastError = null

    while (attempt < 3 && !success) {
      if (attempt > 0) {
        console.log(`Tentativa ${attempt + 1}. Aguardando ${delays[attempt - 1]}ms...`)
        await sleep(delays[attempt - 1])
      }

      try {
        if (!RESEND_API_KEY) {
          console.warn('RESEND_API_KEY não configurada. Simulando envio com sucesso.')
          success = true
          break
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: [email],
            subject: assunto,
            html: html,
          }),
        })

        const data = await res.json()

        if (res.ok) {
          success = true
          console.log('Email enviado com sucesso:', data.id)
        } else {
          console.error('Erro ao enviar email:', data)
          lastError = JSON.stringify(data)
          attempt++
        }
      } catch (err) {
        console.error('Exceção ao enviar email:', err)
        lastError = String(err)
        attempt++
      }
    }

    if (!success) {
      console.log('Falha após 3 tentativas. Armazenando em emails_pendentes.')
      const { error: dbError } = await supabase.from('emails_pendentes').insert({
        user_id: user_id,
        email: email,
        assunto: assunto,
        template: html,
        tentativas: attempt,
        erro: lastError,
        status: 'falha',
      })
      if (dbError) {
        console.error('Erro ao salvar em emails_pendentes:', dbError)
      }
    }

    return new Response(
      JSON.stringify({ success, message: success ? 'Email enviado' : 'Falha ao enviar email' }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Erro no processamento:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
