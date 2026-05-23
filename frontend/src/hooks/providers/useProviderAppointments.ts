import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { providerApi } from '@/services/providerApi';
import type { ProviderAppointment, UpdateAppointmentPayload } from '@/types/provider';

export function useProviderAppointments(filters: {
  page?: number;
  status?: string;
  priority?: string;
  date_filter?: string;
  patient_search?: string;
} = {}) {
  const [data, setData] = useState<{
    appointments: ProviderAppointment[];
    total: number;
    pages: number;
    current_page: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const filterKey = JSON.stringify(filters);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      setData(await providerApi.getAppointments(filters));
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, isError, refetch };
}

export function useProviderAppointment(id: number) {
  const [data, setData] = useState<ProviderAppointment | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const [isError, setIsError] = useState(false);

  const refetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    try {
      setData(await providerApi.getAppointment(id));
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, isError, refetch };
}

export function useUnassignedAppointments() {
  const [data, setData] = useState<{ appointments: import('@/types/provider').UnassignedAppointment[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await providerApi.getUnassignedAppointments());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const id = window.setInterval(refetch, 60_000);
    return () => window.clearInterval(id);
  }, [refetch]);

  return { data, isLoading, refetch };
}

export function useClaimAppointment(onSuccess?: () => void) {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (appointmentId: number) => {
    setIsPending(true);
    try {
      await providerApi.claimAppointment(appointmentId);
      toast.success('Appointment claimed successfully');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      const text = msg?.error || msg?.message || '';
      if (text.toLowerCase().includes('already')) {
        toast.error('This appointment was just claimed by another provider.');
      } else {
        toast.error('Failed to claim appointment. Please try again.');
      }
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}

export function useUpdateAppointment(onSuccess?: () => void) {
  const [isPending, setIsPending] = useState(false);

  const mutate = async ({
    id,
    payload,
  }: {
    id: number;
    payload: UpdateAppointmentPayload;
  }) => {
    setIsPending(true);
    try {
      await providerApi.updateAppointment(id, payload);
      toast.success('Appointment updated');
      onSuccess?.();
    } catch {
      toast.error('Failed to update appointment');
      throw new Error('update failed');
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}
