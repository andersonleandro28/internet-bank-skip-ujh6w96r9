import { createClient } from 'jsr:@supabase/supabase-js@2'

export const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const formatCurrency = (value: any) => {
  const num = Number(value)
  return isNaN(num)
    ? '0,00'
    : num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function getUserName(user_id: string, tipo: string) {
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
  return nome
}

export async function sendEmail({
  to,
  subject,
  html,
  user_id,
  tipo,
  payload,
}: {
  to: string
  subject: string
  html: string
  user_id: string
  tipo: string
  payload: any
}) {
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
          to: [to],
          subject,
          html,
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
    } catch (err: any) {
      console.error('Exceção ao enviar email:', err)
      lastError = String(err)
      attempt++
    }
  }

  if (success) {
    await supabase.from('emails_log').insert({
      user_id,
      tipo,
      status: 'enviado',
      tentativas: attempt === 0 ? 1 : attempt,
      erro: null,
    })
  } else {
    await supabase.from('emails_log').insert({
      user_id,
      tipo,
      status: 'erro',
      tentativas: attempt,
      erro: lastError,
    })

    await supabase.from('emails_pendentes').insert({
      user_id,
      email: to,
      assunto: subject,
      template: html,
      tipo,
      payload,
      tentativas: 1,
      erro: lastError,
      status: 'pendente',
      proxima_tentativa: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
  }

  return success
}

export const baseEmailHtml = (conteudo: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
  <div style="background-color: #1a4d2e; padding: 24px; text-align: center;">
    <h1 style="color: #7fff00; margin: 0; font-size: 24px;">Aclop Bank</h1>
  </div>
  <div style="padding: 32px; color: #333333;">
    ${conteudo}
  </div>
  <div style="background-color: #1a4d2e; padding: 16px; text-align: center;">
    <p style="font-size: 12px; color: #ffffff; margin: 0; opacity: 0.8;">
      Aclop Bank &copy; 2026. Todos os direitos reservados.
    </p>
  </div>
</div>
`
