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

    // Cliente Supabase com token
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader || '' } },
    })

    // Cliente Admin para dar bypass no RLS e atualizar a senha do usuario
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const requestData = await req.json().catch(() => ({}))
    const token = requestData.token
    const nova_senha = requestData.nova_senha || requestData.password

    if (!token || !nova_senha) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (typeof nova_senha !== 'string' || nova_senha.length < 8) {
      return new Response(JSON.stringify({ error: 'Senha deve ter mínimo 8 caracteres' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Link inválido ou expirado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (tokenData.used_at || new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Link inválido ou expirado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.user_id,
      { password: nova_senha },
    )

    if (updateError) {
      console.error('Erro ao atualizar senha no auth.users:', updateError)
      return new Response(JSON.stringify({ error: 'Erro ao atualizar senha' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: markError } = await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    if (markError) {
      console.error('Erro ao marcar token como usado:', markError)
      return new Response(JSON.stringify({ error: 'Erro ao processar requisição' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ data: { message: 'Senha redefinida com sucesso' } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Erro interno:', error)
    return new Response(JSON.stringify({ error: 'Erro ao processar requisição' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
