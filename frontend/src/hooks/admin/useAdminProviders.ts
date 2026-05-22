import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import { extractAdminProviders } from '@/lib/adminNormalize';
import type { AdminProvider, PaginatedResponse, AdminAppointment } from '@/types/admin';

interface ProviderFilters {
  page?: number;
  search?: string;
}

export function useAdminProviders(initialFilters: ProviderFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<AdminProvider> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  // Sync initialFilters to filters state
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters.page, initialFilters.search]);

  const fetchProviders = useCallback(async (filterOverrides?: Partial<ProviderFilters>) => {
    setIsLoading(true);
    setError(null);
    const mergedFilters = { ...filters, ...filterOverrides };
    try {
      const params = new URLSearchParams();
      if (mergedFilters.page) params.set('page', String(mergedFilters.page));
      if (mergedFilters.search) params.set('search', mergedFilters.search);

      const { data: res } = await api.get(`/admin/health-providers?${params.toString()}`);
      const providers = extractAdminProviders(res);
      setData({
        ...(typeof res === 'object' && res !== null ? res : {}),
        providers,
        data: providers,
        total: (res as PaginatedResponse<AdminProvider>)?.total ?? providers.length,
        pages: (res as PaginatedResponse<AdminProvider>)?.pages ?? 1,
        current_page: (res as PaginatedResponse<AdminProvider>)?.current_page ?? 1,
        per_page: (res as PaginatedResponse<AdminProvider>)?.per_page ?? 20,
        has_next: (res as PaginatedResponse<AdminProvider>)?.has_next ?? false,
        has_prev: (res as PaginatedResponse<AdminProvider>)?.has_prev ?? false,
      } as PaginatedResponse<AdminProvider>);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch providers';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Only fetch once on initial mount
  useEffect(() => {
    fetchProviders();
  }, []);

  return {
    data,
    isLoading,
    error,
    filters,
    setFilters: (newFilters: ProviderFilters) => setFilters(newFilters),
    fetchProviders,
  };
}

export function useProviderStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/health-providers/statistics');
      setStats(data.data ?? data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch provider stats';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { stats, isLoading, error, refetch: fetchStats };
}

export function useVerifyProvider(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const verify = async (providerId: number) => {
    setIsLoading(true);
    try {
      await api.post(`/admin/health-providers/${providerId}/verify`);
      toast.success('Provider verified successfully');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to verify provider';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { verify, isLoading };
}

export function useDeleteProvider(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const deleteProvider = async (providerId: number) => {
    setIsLoading(true);
    try {
      await api.delete(`/admin/health-providers/${providerId}`);
      toast.success('Provider removed');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to remove provider';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteProvider, isLoading };
}

export function useProviderAppointments(providerId: number) {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/admin/health-providers/${providerId}/appointments`);
      setAppointments(data.data ?? data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch appointments';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    appointments,
    isLoading,
    error,
    refetch: fetchAppointments,
  };
}
