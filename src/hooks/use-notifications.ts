import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export type Notification = {
  id: string
  user_id: string
  tipo: 'sucesso' | 'aviso' | 'erro'
  mensagem: string
  lida: boolean
  link: string | null
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(data as Notification[])
      setUnreadCount(data.filter((n) => !n.lida).length)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notificacoes_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)

          toast(newNotif.mensagem, {
            duration: 3000,
            style: {
              backgroundColor:
                newNotif.tipo === 'sucesso'
                  ? '#10b981'
                  : newNotif.tipo === 'erro'
                    ? '#ef4444'
                    : '#f59e0b',
              color: '#ffffff',
              borderColor: 'transparent',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
            action: newNotif.link
              ? {
                  label: 'Ver',
                  onClick: () => {
                    navigate(newNotif.link!)
                    markAsRead(newNotif.id)
                  },
                }
              : undefined,
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotif = payload.new as Notification
          setNotifications((prev) => {
            const updated = prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
            setUnreadCount(updated.filter((n) => !n.lida).length)
            return updated
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, navigate])

  const markAsRead = async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      setUnreadCount(updated.filter((n) => !n.lida).length)
      return updated
    })
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, lida: true }))
      setUnreadCount(0)
      return updated
    })
    if (user) {
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false)
    }
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}
