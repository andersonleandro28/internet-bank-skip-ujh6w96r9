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

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader || '' } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const { tipo_operacao, valor, descricao } = body

    if (!tipo_operacao || typeof valor !== 'number' || descricao === undefined) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios ausentes' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (valor <= 0) {
      return new Response(JSON.stringify({ error: 'Valor deve ser maior que zero' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let taxa = 0
    let desc_op = ''
    let desc_taxa = ''

    switch (tipo_operacao) {
      case 'pix_enviado':
        taxa = Math.max(valor * 0.005, 0.5)
        desc_op = 'PIX Enviado'
        desc_taxa = 'PIX'
        break
      case 'boleto_pago':
        taxa = Math.max(valor * 0.0042, 2.0)
        desc_op = 'Boleto Pago'
        desc_taxa = 'Boleto'
        break
      case 'recarga_cartao':
        taxa = Math.max(valor * 0.005, 1.0)
        desc_op = 'Recarga Cartão'
        desc_taxa = 'Cartão'
        break
      case 'transferencia':
        taxa = Math.max(valor * 0.001, 1.5)
        desc_op = 'Transferência'
        desc_taxa = 'Transferência'
        break
      default:
        return new Response(JSON.stringify({ error: 'Tipo de operação inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const descricaoFinal = descricao || desc_op

    // 2. Buscar saldo_anterior
    const { data: conta, error: contaError } = await supabaseClient
      .from('contas')
      .select('saldo')
      .eq('user_id', user.id)
      .single()

    if (contaError || !conta) {
      return new Response(JSON.stringify({ error: 'Conta não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const saldo_anterior = Number(conta.saldo)

    // 4. Validar saldo
    if (saldo_anterior < valor + taxa) {
      return new Response(JSON.stringify({ error: 'Saldo insuficiente para esta operação' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 6 e 7. Inserir atomicamente via RPC
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc(
      'inserir_transacao_atomicamente',
      {
        p_user_id: user.id,
        p_valor: valor,
        p_taxa: taxa,
        p_desc_op: desc_op,
        p_desc_taxa: desc_taxa,
        p_descricao_extra: descricaoFinal,
      },
    )

    if (rpcError) {
      console.error('Erro na RPC:', rpcError)
      if (rpcError.message.includes('Saldo insuficiente')) {
        return new Response(JSON.stringify({ error: 'Saldo insuficiente para esta operação' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ error: 'Erro ao processar transação' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        data: {
          message: 'Transação realizada com sucesso',
          operacao_id: rpcData.operacao_id,
          taxa_id: rpcData.taxa_id,
          novo_saldo: rpcData.novo_saldo,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    console.error('Exceção:', error)
    return new Response(JSON.stringify({ error: 'Erro ao processar transação' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
