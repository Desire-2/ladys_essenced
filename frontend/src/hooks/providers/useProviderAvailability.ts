import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { providerApi } from '@/services/providerApi';
import type { AvailabilityConfig } from '@/types/provider';
import { DEFAULT_AVAILABILITY } from '@/types/provider';

export function useProviderAvailability() {
  const [data, setData] = useState<AvailabilityConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const config = await providerApi.getAvailability();
      setData({ ...DEFAULT_AVAILABILITY, ...config });
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, isError, refetch };
}

export function useUpdateAvailability(onSuccess?: () => void) {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (config: AvailabilityConfig) => {
    setIsPending(true);
    try {
      await providerApi.updateAvailability(config);
      toast.success('Availability updated successfully');
      onSuccess?.();
    } catch {
      toast.error('Failed to update availability');
      throw new Error('save failed');
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}
