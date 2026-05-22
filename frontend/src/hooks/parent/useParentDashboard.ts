import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';
import { useParentStore } from '@/stores/parentStore';
import type { ParentDashboardData } from '@/types/parent';

export function useParentDashboard() {
  const setChildren = useParentStore((s) => s.setChildren);
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ParentDashboardData>('/parents/dashboard');
      setData(res.data);
      if (res.data?.children) setChildren(res.data.children);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load family dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [setChildren]);

  useEffect(() => {
    refetch();
    const id = window.setInterval(refetch, 120_000);
    return () => window.clearInterval(id);
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
