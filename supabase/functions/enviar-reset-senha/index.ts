import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // Cliente Supabase com token
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader || '' } },
    })

    // Cliente Admin para bypass RLS na busca de usuários
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const requestData = await req.json().catch(() => ({}))
    const email = requestData.email

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !usuario) {
      return new Response(JSON.stringify({ error: 'Email não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = crypto.randomUUID().replace(/-/g, '')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const { error: insertError } = await supabaseAdmin.from('password_reset_tokens').insert({
      token,
      email,
      expires_at: expiresAt,
      user_id: usuario.id,
    })

    if (insertError) {
      console.error('Erro ao inserir token:', insertError)
      return new Response(JSON.stringify({ error: 'Erro ao processar requisição' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resetLink = `https://aclop.com.br/reset-senha?token=${token}`
    const subject = 'Redefinir sua senha - Aclop'
    const htmlBody = `Clique no link para redefinir sua senha: <a href="${resetLink}">${resetLink}</a>. Link válido por 1 hora.`

    if (RESEND_API_KEY) {
      let success = false
      let attempt = 0
      const delays = [2000, 4000, 8000]

      while (attempt < 3 && !success) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, delays[attempt - 1]))
        }

        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'noreply@aclop.com.br',
              to: [email],
              subject: subject,
              html: htmlBody,
            }),
          })

          if (res.ok) {
            success = true
          } else {
            const status = res.status
            if ([400, 401, 404].includes(status)) {
              console.error('Erro fatal do Resend:', status, await res.text())
              break
            }
            attempt++
          }
        } catch (e) {
          console.error('Erro fetch resend:', e)
          attempt++
        }
      }

      if (!success) {
        console.error('Falha ao enviar email apos retries.')
      }
    } else {
      console.warn('RESEND_API_KEY não configurada. Logando link de reset:', resetLink)
    }

    return new Response(JSON.stringify({ data: { message: 'Email enviado com sucesso' } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Erro não tratado:', error)
    return new Response(JSON.stringify({ error: 'Erro ao processar requisição' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
