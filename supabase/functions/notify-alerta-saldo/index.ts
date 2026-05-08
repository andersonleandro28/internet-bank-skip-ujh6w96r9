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

    let record = payload.record
    if (!record && payload.id) {
      record = payload
    }

    if (!record) {
      return new Response(JSON.stringify({ message: 'Nenhum record fornecido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const user_id = record.user_id
    if (!user_id) {
      return new Response(JSON.stringify({ message: 'user_id não encontrado no registro' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const limite = payload.limite || 500
    const saldoAtual = record.saldo
    const diferenca = limite - saldoAtual

    // Busca usuário
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('email, tipo')
      .eq('id', user_id)
      .single()

    if (userError || !usuario) {
      return new Response(JSON.stringify({ message: 'Usuário não encontrado', error: userError }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let nome = 'Cliente'
    if (usuario.tipo === 'PF') {
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

    const formatCurrency = (value: any) => {
      const num = Number(value)
      return isNaN(num)
        ? '0,00'
        : num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const saldoFormatado = formatCurrency(saldoAtual)
    const limiteFormatado = formatCurrency(limite)
    const diferencaFormatada = formatCurrency(diferenca)

    const assunto = 'Alerta: Seu saldo está baixo'
    const corPrincipal = '#1a4d2e'
    const corDestaque = '#7fff00'
    const corFundo = '#ffffff'
    const corTexto = '#333333'
    const linkAcao = 'https://carteiraseaconnection.goskip.app/carregar'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${corFundo}; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: ${corPrincipal}; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Aclop Bank</h1>
        </div>
        <div style="padding: 32px; color: ${corTexto};">
          <h2 style="color: ${corTexto}; margin-top: 0;">Olá, ${nome}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">
            Seu saldo está abaixo do limite configurado de alerta.
          </p>
          
          <div style="margin: 24px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 16px 0;">
            <p style="margin: 8px 0; font-size: 14px;"><strong>Saldo atual:</strong> R$ ${saldoFormatado}</p>
            <p style="margin: 8px 0; font-size: 14px;"><strong>Limite de alerta:</strong> R$ ${limiteFormatado}</p>
            <p style="margin: 8px 0; font-size: 14px;"><strong>Diferença:</strong> R$ ${diferencaFormatada}</p>
          </div>

          <div style="margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 6px; text-align: center;">
            <span style="display: inline-block; vertical-align: middle; color: ${corPrincipal}; font-weight: bold; font-size: 18px;">
              ⚠️ Atenção ao seu saldo
            </span>
          </div>

          <p style="font-size: 16px; line-height: 1.5; text-align: center; margin-top: 24px;">
            Considere depositar saldo para continuar usando os serviços.
          </p>

          <div style="text-align: center; margin-top: 24px; margin-bottom: 16px;">
            <a href="${linkAcao}" style="background-color: ${corDestaque}; color: ${corPrincipal}; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Solicitar depósito</a>
          </div>
        </div>
        <div style="background-color: ${corPrincipal}; padding: 16px; text-align: center;">
          <p style="font-size: 12px; color: #ffffff; margin: 0; opacity: 0.8;">
            Aclop Bank &copy; 2026. Todos os direitos reservados.
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
            to: [usuario.email],
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

    if (success) {
      // Atualiza o timestamp do último alerta na tabela usuarios para não floodar
      await supabase
        .from('usuarios')
        .update({ ultimo_alerta_saldo: new Date().toISOString() })
        .eq('id', user_id)
    } else {
      console.log('Falha após 3 tentativas. Armazenando em emails_pendentes.')
      const { error: dbError } = await supabase.from('emails_pendentes').insert({
        user_id: user_id,
        email: usuario.email,
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
