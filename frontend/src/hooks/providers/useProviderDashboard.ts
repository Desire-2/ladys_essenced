import { useCallback, useEffect, useState } from 'react';
import { providerApi } from '@/services/providerApi';
import type { DashboardStats } from '@/types/provider';

export function useProviderDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      setData(await providerApi.getDashboardStats());
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const id = window.setInterval(refetch, 120_000);
    return () => window.clearInterval(id);
  }, [refetch]);

  return { data, isLoading, isError, refetch };
}
