import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let etapa = 'Inicio'

  try {
    console.log(JSON.stringify({ severity: 'INFO', message: 'Iniciando inserir-transacao', timestamp: new Date().toISOString() }))
    
    etapa = 'Autenticação'
    const authHeader = req.headers.get('Authorization')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader || '' } },
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Não autorizado')
    }

    console.log(JSON.stringify({ severity: 'INFO', message: `Autenticado: User ID: ${user.id}` }))

    etapa = 'Leitura do Body'
    const body = await req.json().catch(() => ({}))
    const { tipo_operacao, valor, descricao } = body

    console.log(JSON.stringify({ severity: 'INFO', message: `Dados recebidos: Operação: ${tipo_operacao}, Valor: ${valor}` }))

    if (!tipo_operacao || typeof valor !== 'number' || descricao === undefined) {
      throw new Error('Campos obrigatórios ausentes')
    }

    if (valor <= 0) {
      throw new Error('Valor deve ser maior que zero')
    }

    etapa = 'Calculo de Taxa'
    let taxa = 0
    let desc_op = ''
    let desc_taxa = ''

    switch (tipo_operacao) {
      case 'pix_enviado':
        taxa = Math.max(valor * 0.005, 0.50)
        desc_op = 'PIX Enviado'
        desc_taxa = 'PIX'
        break
      case 'boleto_pago':
        taxa = Math.max(valor * 0.0042, 2.00)
        desc_op = 'Boleto Pago'
        desc_taxa = 'Boleto'
        break
      case 'recarga_cartao':
        taxa = Math.max(valor * 0.005, 1.00)
        desc_op = 'Recarga Cartão'
        desc_taxa = 'Cartão'
        break
      case 'transferencia':
        taxa = Math.max(valor * 0.001, 1.50)
        desc_op = 'Transferência'
        desc_taxa = 'Transferência'
        break
      default:
        throw new Error('Tipo de operação inválido')
    }

    console.log(JSON.stringify({ severity: 'INFO', message: `Taxa calculada: ${taxa}` }))
    const descricaoFinal = descricao || desc_op

    etapa = 'Busca de Saldo'
    const { data: conta, error: contaError } = await supabaseClient
      .from('contas')
      .select('saldo')
      .eq('user_id', user.id)
      .single()

    if (contaError || !conta) {
      throw new Error('Conta não encontrada')
    }

    const saldo_anterior = Number(conta.saldo)
    const total_necessario = valor + taxa
    
    if (saldo_anterior < total_necessario) {
      throw new Error('Saldo insuficiente para esta operação')
    }

    etapa = 'Execução da Transação (RPC)'
    console.log(JSON.stringify({ severity: 'INFO', message: 'Iniciando RPC inserir_transacao_atomicamente' }))
    
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('inserir_transacao_atomicamente', {
      p_user_id: user.id,
      p_valor: valor,
      p_taxa: taxa,
      p_desc_op: desc_op,
      p_desc_taxa: desc_taxa,
      p_descricao_extra: descricaoFinal
    })

    if (rpcError) {
      if (rpcError.message.includes('Saldo insuficiente')) {
         throw new Error('Saldo insuficiente para esta operação')
      }
      throw new Error(rpcError.message)
    }

    console.log(JSON.stringify({ severity: 'INFO', message: 'Transação concluída com sucesso', rpcData }))

    return new Response(JSON.stringify({
      data: {
        message: 'Transação realizada com sucesso',
        operacao_id: rpcData.operacao_id,
        taxa_id: rpcData.taxa_id,
        novo_saldo: rpcData.novo_saldo
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    
    const errorDetails = {
      etapa,
      mensagemOriginal: errorMsg,
      timestamp: new Date().toISOString()
    }
    
    console.error(JSON.stringify({ 
      severity: 'ERROR',
      message: `Falha ao processar transação na etapa: ${etapa}`,
      details: errorDetails
    }))
    
    const status = errorMsg.includes('Não autorizado') ? 401 : 400
    
    // Mensagem amigável para o usuário
    let userMessage = errorMsg
    if (errorMsg.includes('PGRST')) {
      userMessage = 'Erro interno ao processar a transação no banco de dados'
    } else if (errorMsg.includes('JSON')) {
      userMessage = 'Formato de dados inválido'
    }

    return new Response(JSON.stringify({ 
      error: userMessage,
      details: errorDetails
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
