import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/axios';
import { asArray } from '@/lib/apiHelpers';
import { getParentErrorMessage } from '@/lib/parentUtils';

export function useChildCycleLogs(adolescentId: number, page = 1) {
  const [data, setData] = useState<{ items: unknown[]; total: number; pages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!adolescentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/parents/children/${adolescentId}/cycle-logs?page=${page}&per_page=10`
      );
      const body = res.data;
      setData({
        items: asArray(body?.items ?? body),
        total: body?.total ?? 0,
        pages: body?.pages ?? 1,
      });
    } catch (err: unknown) {
      setError(getParentErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [adolescentId, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useCreateChildCycleLog(adolescentId: number) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (payload: Record<string, unknown>) => {
    setIsPending(true);
    try {
      const res = await api.post(`/parents/children/${adolescentId}/cycle-logs`, payload);
      toast.success('Cycle log saved');
      return res.data;
    } catch (err: unknown) {
      toast.error(getParentErrorMessage(err));
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useChildMealLogs(adolescentId: number, page = 1) {
  const [data, setData] = useState<{ items: unknown[]; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!adolescentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/parents/children/${adolescentId}/meal-logs?page=${page}&per_page=10`
      );
      const body = res.data;
      setData({
        items: asArray(body?.items ?? body),
        total: body?.total ?? 0,
      });
    } catch (err: unknown) {
      setError(getParentErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [adolescentId, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
