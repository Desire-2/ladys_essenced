import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { asArray } from '@/lib/apiHelpers';
import { normalizeAdminStats } from '@/lib/adminNormalize';
import type { AdminStats } from '@/types/admin';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashboardRes, providerStatsRes, pendingRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/health-providers/statistics').catch(() => ({ data: {} })),
        api.get('/admin/content/pending').catch(() => ({ data: { content: [] } })),
      ]);
      const dashboard = (dashboardRes.data?.data ?? dashboardRes.data) as Record<string, unknown>;
      const providerStats = (providerStatsRes.data?.data ?? providerStatsRes.data) as Record<string, unknown>;
      const pendingCount = asArray(pendingRes.data?.content ?? pendingRes.data).length;

      setStats(
        normalizeAdminStats(dashboard, {
          pendingContent: pendingCount,
          unverifiedProviders: Number(providerStats.unverified_providers) || 0,
        })
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh disabled to prevent continuous requests - can be enabled via manual refetch button
  }, []);

  return { stats, isLoading, error, refetch: fetchStats };
}
