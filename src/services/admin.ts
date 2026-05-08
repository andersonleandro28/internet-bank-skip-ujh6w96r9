import { supabase } from '@/lib/supabase/client'

export const aprovarUsuario = async (userId: string, adminId: string) => {
  const { error } = await supabase.rpc('aprovar_usuario' as any, {
    p_user_id: userId,
    p_admin_id: adminId,
  })
  if (error) throw error
}

export const reprovarUsuario = async (userId: string, adminId: string) => {
  const { error } = await supabase.rpc('reprovar_usuario' as any, {
    p_user_id: userId,
    p_admin_id: adminId,
  })
  if (error) throw error
}

export const aprovarRequisicao = async (reqId: string, adminId: string) => {
  const { error } = await supabase.rpc('aprovar_requisicao' as any, {
    req_id: reqId,
    p_admin_id: adminId,
  })
  if (error) throw error
}

export const reprovarRequisicao = async (reqId: string, adminId: string) => {
  const { error } = await supabase.rpc('reprovar_requisicao' as any, {
    req_id: reqId,
    p_admin_id: adminId,
  })
  if (error) throw error
}
