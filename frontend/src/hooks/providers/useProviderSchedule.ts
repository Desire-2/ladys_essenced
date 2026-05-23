import { useCallback, useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import { providerApi } from '@/services/providerApi';
import type { ScheduleDay } from '@/types/provider';

export function useProviderSchedule(startDate?: Date, endDate?: Date) {
  const start = startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const end = endDate ? format(endDate, 'yyyy-MM-dd') : format(addDays(new Date(), 6), 'yyyy-MM-dd');

  const [schedule, setSchedule] = useState<ScheduleDay | null>(null);
  const [providerInfo, setProviderInfo] = useState<{
    name: string;
    specialization: string;
    clinic_name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await providerApi.getSchedule(start, end);
      setSchedule(res.schedule);
      setProviderInfo(res.provider_info);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { schedule, providerInfo, isLoading, isError, refetch };
}
