import { useCallback, useEffect, useState } from 'react';
import { providerApi } from '@/services/providerApi';
import type { ProviderNotification } from '@/types/provider';

export function useProviderNotifications(page = 1) {
  const [notifications, setNotifications] = useState<ProviderNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await providerApi.getNotifications(page, 20);
      setNotifications(res.notifications);
      setTotal(res.total);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: number) => {
    await providerApi.markNotificationRead(id);
    refetch();
  };

  const markAllRead = async () => {
    await providerApi.markAllNotificationsRead();
    refetch();
  };

  return { notifications, total, unreadCount, isLoading, refetch, markRead, markAllRead };
}
