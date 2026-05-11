import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { RESEND_API_KEY, supabase } from '../_shared/email.ts'

Deno.serve(async () => {
  try {
    const { data: pendentes } = await supabase
      .from('emails_pendentes')
      .select('*')
      .lte('proxima_tentativa', new Date().toISOString())
      .lt('tentativas', 3)
      .eq('status', 'pendente')

    if (!pendentes || pendentes.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum email para reenvio.' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const results = []

    for (const email of pendentes) {
      try {
        if (!RESEND_API_KEY) {
          results.push({ id: email.id, success: true, simulated: true })
          continue
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: [email.email],
            subject: email.assunto,
            html: email.template,
          }),
        })

        if (res.ok) {
          // Move para emails_log
          await supabase.from('emails_log').insert({
            user_id: email.user_id,
            tipo: email.tipo || 'retry',
            status: 'enviado',
            tentativas: (email.tentativas || 0) + 1,
            erro: null,
          })
          // Deleta pendente
          await supabase.from('emails_pendentes').delete().eq('id', email.id)
          results.push({ id: email.id, success: true })
        } else {
          const data = await res.json()
          const newTentativas = (email.tentativas || 0) + 1

          if (newTentativas >= 3) {
            await supabase
              .from('emails_pendentes')
              .update({
                tentativas: newTentativas,
                status: 'reenvio_necessario',
                erro: JSON.stringify(data),
              })
              .eq('id', email.id)

            await supabase.from('emails_log').insert({
              user_id: email.user_id,
              tipo: email.tipo || 'retry',
              status: 'erro',
              tentativas: newTentativas,
              erro: JSON.stringify(data),
            })
          } else {
            await supabase
              .from('emails_pendentes')
              .update({
                tentativas: newTentativas,
                erro: JSON.stringify(data),
                proxima_tentativa: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              })
              .eq('id', email.id)
          }
          results.push({ id: email.id, success: false })
        }
      } catch (err: any) {
        const newTentativas = (email.tentativas || 0) + 1
        await supabase
          .from('emails_pendentes')
          .update({
            tentativas: newTentativas,
            erro: String(err),
            status: newTentativas >= 3 ? 'reenvio_necessario' : 'pendente',
            proxima_tentativa: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          })
          .eq('id', email.id)
        results.push({ id: email.id, success: false, error: err.message })
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
