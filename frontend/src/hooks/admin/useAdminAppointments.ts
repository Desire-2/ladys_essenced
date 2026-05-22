import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import { asArray } from '@/lib/apiHelpers';
import { normalizeAdminAppointment } from '@/lib/adminNormalize';
import type { AdminAppointment, PaginatedResponse } from '@/types/admin';

interface AppointmentFilters {
  page?: number;
  status?: string;
  provider_id?: number;
  type?: string;
  start_date?: string;
  end_date?: string;
}

export function useAdminAppointments(initialFilters: AppointmentFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<AdminAppointment> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  // Sync initialFilters to filters state
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters.page, initialFilters.status, initialFilters.provider_id, initialFilters.type, initialFilters.start_date, initialFilters.end_date]);

  const fetchAppointments = useCallback(async (filterOverrides?: Partial<AppointmentFilters>) => {
    setIsLoading(true);
    setError(null);
    const mergedFilters = { ...filters, ...filterOverrides };
    try {
      const params = new URLSearchParams();
      Object.entries(mergedFilters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });

      const { data: res } = await api.get(`/admin/appointments/manage?${params.toString()}`);
      const appointments = asArray<Record<string, unknown>>(res).map(normalizeAdminAppointment);
      setData({
        ...(typeof res === 'object' && res !== null ? res : {}),
        appointments,
        data: appointments,
        total: (res as PaginatedResponse<AdminAppointment>)?.total ?? appointments.length,
        pages: (res as PaginatedResponse<AdminAppointment>)?.pages ?? 1,
        current_page: (res as PaginatedResponse<AdminAppointment>)?.current_page ?? 1,
        per_page: (res as PaginatedResponse<AdminAppointment>)?.per_page ?? 20,
        has_next: (res as PaginatedResponse<AdminAppointment>)?.has_next ?? false,
        has_prev: (res as PaginatedResponse<AdminAppointment>)?.has_prev ?? false,
      } as PaginatedResponse<AdminAppointment>);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch appointments';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Only fetch once on initial mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  return {
    data,
    isLoading,
    error,
    filters,
    setFilters: (newFilters: AppointmentFilters) => setFilters(newFilters),
    fetchAppointments,
  };
}

export function useCancelAppointment(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const cancel = async (appointmentId: number, reason?: string) => {
    setIsLoading(true);
    try {
      await api.patch(`/admin/appointments/${appointmentId}/cancel`, { reason });
      toast.success('Appointment cancelled');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to cancel appointment';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { cancel, isLoading };
}

export function useReassignAppointment(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const reassign = async (appointmentId: number, providerId: number) => {
    setIsLoading(true);
    try {
      await api.patch(`/admin/appointments/${appointmentId}/reassign`, {
        provider_id: providerId,
      });
      toast.success('Appointment reassigned');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reassign appointment';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { reassign, isLoading };
}
