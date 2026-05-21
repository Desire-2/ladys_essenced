import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/axios';
import { asArray } from '../lib/apiHelpers';
import { mapMealLog } from '../lib/apiMappers';
import { flattenMealStats } from '../lib/mealLogsApi';
import { fetchUpcomingAppointments } from '../lib/appointmentsApi';
import { fetchHealthProviders, type HealthProviderSummary } from '../lib/healthProvidersApi';
import type { UmwariHealthContext } from '../types/umwari';

export function useUmwariContext() {
  const [data, setData] = useState<UmwariHealthContext | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all needed data in parallel using allSettled so one failure doesn't block context compilation
      const [
        profileRes,
        cycleStatsRes,
        cycleLogsRes,
        predictionsRes,
        fertileWindowRes,
        anomalyRes,
        mealStatsRes,
        mealsRes,
        appointmentsRes,
        providersRes
      ] = await Promise.allSettled([
        api.get('/auth/profile'),
        api.get('/cycle-logs/stats'),
        api.get('/cycle-logs'),
        api.get('/cycle-logs/predictions'),
        api.get('/cycle-logs/fertile-window'),
        api.get('/cycle-logs/anomaly-detection'),
        api.get('/meal-logs/stats'),
        api.get('/meal-logs'),
        fetchUpcomingAppointments(),
        fetchHealthProviders(),
      ]);

      // Extract results safely
      const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
      const stats = cycleStatsRes.status === 'fulfilled' ? cycleStatsRes.value.data : null;
      const recentLogs = cycleLogsRes.status === 'fulfilled'
        ? asArray(cycleLogsRes.value.data)
        : [];
      const pred = predictionsRes.status === 'fulfilled' ? predictionsRes.value.data : null;
      const fertile = fertileWindowRes.status === 'fulfilled' ? fertileWindowRes.value.data : null;
      const anom = anomalyRes.status === 'fulfilled' ? anomalyRes.value.data : null;
      const mealStatsRaw = mealStatsRes.status === 'fulfilled' ? mealStatsRes.value.data : null;
      const mealStatsData = flattenMealStats(mealStatsRaw);
      const mealLogsRaw = mealsRes.status === 'fulfilled'
        ? asArray(mealsRes.value.data)
        : [];
      const mealLogs = mealLogsRaw.map((m) => mapMealLog(m as Record<string, unknown>));
      const apptData = appointmentsRes.status === 'fulfilled'
        ? appointmentsRes.value
        : [];
      
      const providerData = providersRes.status === 'fulfilled'
        ? (providersRes.value as HealthProviderSummary[])
        : [];

      // Symptoms gathering
      const allSymptoms = recentLogs
        .flatMap((log: any) => log.symptoms ?? [])
        .filter(Boolean);
      const uniqueSymptoms = [...new Set(allSymptoms)].slice(0, 8) as string[];

      // Nutrition Gaps
      const nutritionGaps: string[] = [];
      if (mealStatsData?.average_protein < 40) nutritionGaps.push('low protein');
      if (mealStatsData?.average_calories < 1400) nutritionGaps.push('low calories');

      const recentMoods = mealLogs
        .map((m) => m.mood_after)
        .filter(Boolean)
        .slice(0, 5) as string[];

      // Build context
      const context: UmwariHealthContext = {
        user: {
          firstName: profile?.first_name ?? 'Friend',
          age: profile?.date_of_birth
            ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
            : undefined,
          userType: profile?.user_type ?? 'adolescent',
        },
        cycleSummary: stats ? {
          totalLogs: stats.total_logs ?? 0,
          averageCycleLength: stats.average_cycle_length,
          averagePeriodLength: stats.average_period_length,
          lastPeriodStart: recentLogs[0]?.start_date,
          nextPredictedPeriod: pred?.next_period_date,
          regularityStatus: stats.regularity_status,
          recentSymptoms: uniqueSymptoms,
          anomalyDetected: anom?.anomaly_detected ?? false,
          fertileWindowStart: fertile?.fertile_window_start,
          fertileWindowEnd: fertile?.fertile_window_end,
        } : undefined,
        mealSummary: {
          logsThisWeek: mealLogs.filter((m) => {
            const d = new Date(m.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return d >= weekAgo;
          }).length,
          averageCalories: mealStatsData?.average_calories,
          nutritionGaps,
          recentMoods,
        },
        appointmentSummary: {
          upcoming: apptData.slice(0, 3).map((a) => ({
            type: a.appointment_type,
            date: a.scheduled_datetime,
            providerName: a.health_provider_name,
          })),
          lastAppointmentDate: undefined,
          hasUpcomingCheckup: apptData.some((a) => a.appointment_type === 'checkup'),
        },
        availableProviders: providerData.map((p) => ({
          id: p.id,
          name: p.name,
          specialization: p.specialization,
          clinic: p.clinic,
          isVerified: p.is_verified,
        })),
      };

      setData(context);
    } catch (err: any) {
      console.error('Failed to resolve context:', err);
      setError(err?.message || 'Error occurred while loading context');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  return { data, isLoading, error, refetch: fetchContext };
}
