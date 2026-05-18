import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string, options?: any) => Promise<{ error: any; data?: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setSession(null)
        setUser(null)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    })

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn('[Supabase Auth Diagnostic] Erro na sessão:', error.message)
          if (error.message.toLowerCase().includes('refresh token')) {
            supabase.auth.signOut().catch(() => {})
          }
        }
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch((err) => {
        console.warn('[Supabase Auth Diagnostic] Exceção na sessão:', err)
        supabase.auth.signOut().catch(() => {})
        setSession(null)
        setUser(null)
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [])

  const customSignUp = async (email: string, password: string, options?: any) => {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
          data: options?.data || {},
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = data?.message || data?.msg || ''
        const isEmailError =
          res.status === 500 &&
          (msg.includes('confirmation email') ||
            data?.code === 'unexpected_failure' ||
            data?.error_code === 'unexpected_failure')

        if (isEmailError) {
          console.warn('[Supabase Auth Diagnostic] Ignorando erro 500 de SMTP. Simulando sucesso.')
          return { data: { user: { id: '', email }, session: null }, error: null }
        }

        return {
          data: null,
          error: { message: msg || 'Erro ao realizar cadastro', status: res.status },
        }
      }

      return { data, error: null }
    } catch (e: any) {
      console.error('[Supabase Auth Diagnostic] Erro no fetch customizado:', e)
      return { data: null, error: e }
    }
  }

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      const { data: funcData, error: funcError } = await supabase.functions.invoke('signup-admin', {
        body: { email, password, data: options?.data },
      })

      if (funcError) {
        console.warn(
          '[Supabase Auth Diagnostic] Erro de rede na edge function, usando fetch customizado:',
          funcError.message,
        )
        return await customSignUp(email, password, options)
      }

      if (funcData?.error) {
        const errorMsgStr = (funcData.error || '').toLowerCase()
        if (
          errorMsgStr.includes('already been registered') ||
          errorMsgStr.includes('already exists')
        ) {
          return {
            data: null,
            error: {
              message: 'Este e-mail já está cadastrado. Por favor, faça login.',
              status: 400,
            },
          }
        }

        return { data: null, error: { message: funcData.error, status: 400 } }
      }

      return { data: { user: funcData?.data?.user, session: null }, error: null }
    } catch (err: any) {
      console.warn('[Supabase Auth Diagnostic] Exceção inesperada no signUp:', err.message || err)
      const errStr = typeof err === 'string' ? err : JSON.stringify(err) + (err?.message || '')
      if (
        errStr.toLowerCase().includes('already been registered') ||
        errStr.toLowerCase().includes('already exists')
      ) {
        return {
          data: null,
          error: { message: 'Este e-mail já está cadastrado. Por favor, faça login.', status: 400 },
        }
      }
      return await customSignUp(email, password, options)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        return { error }
      }

      if (data?.user) {
        try {
          await supabase.from('historico_logins' as any).insert({
            user_id: data.user.id,
            ip: 'IP não capturado', // Em uma implementação real, usaria uma edge function ou API para capturar o IP real
            dispositivo: navigator.userAgent,
          })
        } catch (e) {
          console.error('Falha ao registrar login', e)
        }
      }

      return { error: null }
    } catch (err: any) {
      console.warn('[Supabase Auth Diagnostic] Erro de rede interceptado no signIn:', err)
      return {
        error: {
          message: err?.message?.includes('network')
            ? 'Erro de conexão'
            : 'Invalid login credentials',
          status: 400,
        },
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPasswordForEmail = async (email: string) => {
    const { data, error } = await supabase.functions.invoke('enviar-reset-senha', {
      body: { email },
    })
    if (error) return { error }
    if (data?.error) return { error: new Error(data.error) }
    return { error: null }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signUp,
        signIn,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
