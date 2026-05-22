import React, { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { asArray } from '@/lib/apiHelpers';
import { mapNotification } from '@/lib/notificationsApi';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { getChildColor } from '@/lib/parentUtils';
import { Notification } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

interface FamilyNotificationsPageProps {
  onNavigate: (path: string) => void;
}

export function FamilyNotificationsPage({ onNavigate }: FamilyNotificationsPageProps) {
  const { data: dashboard } = useParentDashboard();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine' | number>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/notifications', { params: { per_page: 50 } })
      .then((res) => {
        const rows = asArray<Record<string, unknown>>(res.data?.items ?? res.data);
        setNotifications(rows.map(mapNotification));
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const childUserIds = new Map(
    dashboard?.children.map((c) => [c.user_id, c]) ?? []
  );

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'mine') return !childUserIds.has(n.user_id as number);
    const child = dashboard?.children.find((c) => c.adolescent_id === filter);
    return child && n.user_id === child.user_id;
  });

  const markRead = async (id: number, route?: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      if (route) onNavigate(route);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-ink">Family notifications</h2>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            filter === 'all' ? 'bg-terracotta text-cream' : 'bg-border text-muted'
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            filter === 'mine' ? 'bg-terracotta text-cream' : 'bg-border text-muted'
          }`}
          onClick={() => setFilter('mine')}
        >
          Mine
        </button>
        {dashboard?.children.map((c) => (
          <button
            key={c.adolescent_id}
            type="button"
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              filter === c.adolescent_id ? 'bg-terracotta text-cream' : 'bg-border text-muted'
            }`}
            onClick={() => setFilter(c.adolescent_id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length ? (
        <ul className="space-y-3">
          {filtered.map((n) => {
            const child = childUserIds.get(n.user_id as number);
            const color = child ? getChildColor(child.adolescent_id) : null;
            const label = child ? child.name : 'You';
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markRead(n.id, (n as Notification & { action_data?: { route?: string } }).action_data?.route)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    n.is_read ? 'border-border bg-surface/50' : 'border-terracotta/30 bg-cream'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={
                        color
                          ? { background: color.bg, color: color.text }
                          : { background: 'rgba(196,120,90,0.2)', color: '#C4785A' }
                      }
                    >
                      {label.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink">{n.title}</p>
                      <p className="text-xs text-muted line-clamp-2 mt-0.5">{n.message}</p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-terracotta shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted text-center py-12">No notifications yet.</p>
      )}
    </div>
  );
}
