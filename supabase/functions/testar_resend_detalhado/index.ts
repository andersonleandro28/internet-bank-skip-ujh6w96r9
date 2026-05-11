import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

Deno.serve(async () => {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY')
    console.log('API Key presente:', !!apiKey)

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: 'RESEND_API_KEY nao configurada em Secrets',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const payload = {
      from: 'ACLOP <contato@aclop.com.br>',
      to: ['andersonleandro28@gmail.com'],
      subject: 'Teste Aclop (Remetente Oficial)',
      html: '<h1>Teste funcionando com contato@aclop.com.br</h1>',
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('Status:', res.status)

    const bodyText = await res.text()
    console.log('Response body:', bodyText)

    let parsedBody
    try {
      parsedBody = JSON.parse(bodyText)
    } catch {
      parsedBody = bodyText
    }

    if (res.ok) {
      return new Response(
        JSON.stringify({
          sucesso: true,
          email_id: parsedBody.id || null,
          mensagem: 'Email enviado com sucesso',
          body: parsedBody,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    } else {
      return new Response(
        JSON.stringify({
          sucesso: false,
          status: res.status,
          body: parsedBody,
          dica: 'Verifique API Key e dominio',
        }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } },
      )
    }
  } catch (error) {
    console.error('Exceção:', error)
    return new Response(
      JSON.stringify({
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
