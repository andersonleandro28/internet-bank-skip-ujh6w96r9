import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

Deno.serve(async () => {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY')

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: 'RESEND_API_KEY nao configurada em Secrets',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ['andersonleandro28@gmail.com'],
        subject: 'Teste Aclop (Remetente Padrão)',
        html: '<h1>Teste funcionando com onboarding@resend.dev</h1>',
      }),
    })

    const data = await res.json()

    if (res.ok) {
      return new Response(
        JSON.stringify({
          sucesso: true,
          email_id: data.id,
          mensagem: 'Email enviado com sucesso',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    } else {
      let dica = 'Verifique a documentacao do Resend'
      if (res.status === 403) {
        dica = 'Verifique se dominio esta verificado no Resend'
      } else if (res.status === 401) {
        dica = 'API Key invalida'
      }

      return new Response(
        JSON.stringify({
          sucesso: false,
          status: res.status,
          erro: data,
          dica,
        }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } },
      )
    }
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
