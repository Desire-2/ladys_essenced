import { formatDistanceToNow, parseISO } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useProviderNotifications } from '@/hooks/providers/useProviderNotifications';

export function ProviderNotificationsPage() {
  const { notifications, isLoading, markRead, markAllRead } = useProviderNotifications();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" className="text-sm" onClick={markAllRead}>
          Mark all read
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-center text-muted py-12 border border-dashed border-border rounded-xl">
          No notifications yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`border rounded-xl p-4 text-sm flex justify-between gap-3 ${
                n.is_read ? 'border-border bg-surface opacity-80' : 'border-sage/40 bg-sage/5'
              }`}
            >
              <div>
                <p className="font-medium text-ink capitalize">{n.type.replace(/_/g, ' ')}</p>
                <p className="text-muted mt-1">{n.message}</p>
                <p className="text-[10px] text-muted mt-2">
                  {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.is_read && (
                <Button type="button" variant="ghost" className="text-xs shrink-0" onClick={() => markRead(n.id)}>
                  Mark read
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
