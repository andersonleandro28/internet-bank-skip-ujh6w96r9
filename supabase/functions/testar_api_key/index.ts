import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

Deno.serve(async () => {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY')

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          erro: 'RESEND_API_KEY nao configurada em Secrets',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const res = await fetch('https://api.resend.com/audiences', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const bodyText = await res.text()
    let parsedBody
    try {
      parsedBody = JSON.parse(bodyText)
    } catch (e) {
      parsedBody = bodyText
    }

    return new Response(
      JSON.stringify({
        status: res.status,
        body: parsedBody,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    console.error('Exceção:', error)
    return new Response(
      JSON.stringify({
        erro: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
