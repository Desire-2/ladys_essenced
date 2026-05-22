import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import { asArray } from '@/lib/apiHelpers';
import type { SystemLog, PaginatedResponse } from '@/types/admin';

interface LogFilters {
  page?: number;
  per_page?: number;
  action?: string;
  user_id?: number;
  start_date?: string;
  end_date?: string;
}

export function useSystemLogs(initialFilters: LogFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<SystemLog> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchLogs = useCallback(async (filterOverrides?: Partial<LogFilters>) => {
    setIsLoading(true);
    setError(null);
    const mergedFilters = { ...filters, ...filterOverrides };
    try {
      const params = new URLSearchParams();
      Object.entries(mergedFilters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });

      const { data: res } = await api.get(`/admin/system/logs?${params.toString()}`);
      const logs = asArray<SystemLog>(res);
      setData({
        ...(typeof res === 'object' && res !== null ? res : {}),
        logs,
        data: logs,
        total: (res as PaginatedResponse<SystemLog>)?.total ?? logs.length,
        pages: (res as PaginatedResponse<SystemLog>)?.pages ?? 1,
        current_page: (res as PaginatedResponse<SystemLog>)?.current_page ?? 1,
        per_page: (res as PaginatedResponse<SystemLog>)?.per_page ?? 50,
        has_next: (res as PaginatedResponse<SystemLog>)?.has_next ?? false,
        has_prev: (res as PaginatedResponse<SystemLog>)?.has_prev ?? false,
      } as PaginatedResponse<SystemLog>);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch logs';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchLogs();
  }, []);

  // Auto-refresh disabled to prevent continuous requests - can be enabled via manual refetch button
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchLogs();
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, []);

  return {
    data,
    isLoading,
    error,
    filters,
    setFilters: (newFilters: LogFilters) => setFilters(newFilters),
    fetchLogs,
  };
}
