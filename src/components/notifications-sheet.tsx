import { useNotifications, Notification } from '@/hooks/use-notifications'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'

export function NotificationsSheet() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors">
          <Bell className="w-6 h-6 md:w-5 md:h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Notificações</SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                Marcar lidas
              </button>
            )}
          </div>
        </SheetHeader>
        <Tabs defaultValue="todas" className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="px-4 py-2 border-b shrink-0">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="nao_lidas">
                Não Lidas {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="todas"
            className="flex-1 overflow-y-auto p-0 m-0 data-[state=active]:block data-[state=inactive]:hidden"
          >
            <ScrollArea className="h-full">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Nenhuma notificação encontrada.
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationItem key={n.id} notif={n} onRead={markAsRead} navigate={navigate} />
                ))
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent
            value="nao_lidas"
            className="flex-1 overflow-y-auto p-0 m-0 data-[state=active]:block data-[state=inactive]:hidden"
          >
            <ScrollArea className="h-full">
              {notifications.filter((n) => !n.lida).length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Você não tem notificações não lidas.
                </div>
              ) : (
                notifications
                  .filter((n) => !n.lida)
                  .map((n) => (
                    <NotificationItem
                      key={n.id}
                      notif={n}
                      onRead={markAsRead}
                      navigate={navigate}
                    />
                  ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function NotificationItem({
  notif,
  onRead,
  navigate,
}: {
  notif: Notification
  onRead: (id: string) => void
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <SheetClose asChild>
      <div
        onClick={() => {
          if (!notif.lida) onRead(notif.id)
          if (notif.link) navigate(notif.link)
        }}
        className={cn(
          'p-4 border-b cursor-pointer transition-colors hover:bg-slate-50 flex items-start gap-3',
          !notif.lida ? 'bg-purple-50/40' : 'bg-white',
        )}
      >
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm',
            notif.tipo === 'sucesso'
              ? 'bg-emerald-500'
              : notif.tipo === 'erro'
                ? 'bg-red-500'
                : 'bg-amber-500',
          )}
        />
        <div className="flex-1">
          <p
            className={cn(
              'text-sm',
              !notif.lida ? 'font-semibold text-slate-900' : 'text-slate-600',
            )}
          >
            {notif.mensagem}
          </p>
          <span className="text-xs text-slate-400 mt-1.5 block font-medium">
            {new Date(notif.created_at).toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
    </SheetClose>
  )
}
