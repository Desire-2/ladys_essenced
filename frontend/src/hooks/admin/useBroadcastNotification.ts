import { useState } from 'react';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import type { BroadcastPayload } from '@/types/admin';

export function useBroadcastNotification() {
  const [isLoading, setIsLoading] = useState(false);

  const broadcast = async (payload: BroadcastPayload) => {
    setIsLoading(true);
    try {
      await api.post('/notifications/admin/broadcast', {
        title: payload.title,
        message: payload.message,
        severity: payload.severity,
        target_role: payload.role ?? undefined,
      });
      toast.success('Notification broadcast sent successfully');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to broadcast notification';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { broadcast, isLoading };
}
