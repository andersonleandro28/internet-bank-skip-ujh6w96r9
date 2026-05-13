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
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { ...options, emailRedirectTo: `${window.location.origin}/login?verified=true` },
      })
      if (error) {
        console.error('[Supabase Auth Diagnostic] Erro no signUp:', error)
      }
      return { data, error }
    } catch (err) {
      console.error('[Supabase Auth Diagnostic] Exceção inesperada no signUp:', err)
      return { error: err }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

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

    return { error }
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
