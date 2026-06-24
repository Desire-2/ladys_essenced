import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { api } from '../lib/axios';
import { asArray } from '../lib/apiHelpers';
import { mapMealLog } from '../lib/apiMappers';
import { flattenMealStats } from '../lib/mealLogsApi';
import { fetchUpcomingAppointments } from '../lib/appointmentsApi';
import { fetchHealthProviders, type HealthProviderSummary } from '../lib/healthProvidersApi';
import { useAuthStore } from '../stores/authStore';
import { useUmwariStore } from '../stores/umwariStore';
import type { UmwariHealthContext } from '../types/umwari';

// ──────────────────────────────────────────
// Context + Provider (singleton pattern)
// ──────────────────────────────────────────

interface UmwariContextValue {
  data: UmwariHealthContext | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<UmwariHealthContext | null>;
}

const UmwariContext = createContext<UmwariContextValue>({
  data: null,
  isLoading: true,
  error: null,
  refetch: async () => null,
});

export function UmwariContextProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<UmwariHealthContext | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Reactively watch the auth store so we re-fetch when the user logs in
  const accessToken = useAuthStore((s) => s.accessToken);

  const fetchContext = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Skip fetching if the user isn't authenticated — avoids spamming 401 errors
    // from login/register pages and early mount before session restore completes.
    if (!accessToken) {
      setData(null);
      setIsLoading(false);
      return null;
    }

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
        providersRes,
        insightsRes,
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
        api.post('/umwari/insights', {
          language: useUmwariStore.getState().language === 'rw' ? 'kinyarwanda' : 'english',
        }),
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

      // Wellness data extraction from cycle logs (mood, sleep, stress, energy, exercise)
      const moods = recentLogs
        .map((log: any) => log.mood)
        .filter(Boolean);
      const sleepQualities = recentLogs
        .map((log: any) => log.sleep_quality)
        .filter(Boolean);
      const stressLevels = recentLogs
        .map((log: any) => log.stress_level)
        .filter(Boolean);
      const energyLevels = recentLogs
        .map((log: any) => log.energy_level)
        .filter(Boolean);
      const exerciseEntries = recentLogs
        .map((log: any) => log.exercise_activities)
        .filter((e: any) => e && typeof e === 'string' && e.trim());

      // Calculate wellness statistics
      const negativeMoods = moods.filter((m: string) => ['low', 'very_low'].includes(m)).length;
      const highStress = stressLevels.filter((s: string) => ['high', 'very_high'].includes(s)).length;
      const poorSleep = sleepQualities.filter((s: string) => ['fair', 'poor'].includes(s)).length;
      const lowEnergy = energyLevels.filter((e: string) => ['low', 'very_low'].includes(e)).length;

      // Find dominant mood
      const moodCounts: Record<string, number> = {};
      moods.forEach((m: string) => { moodCounts[m] = (moodCounts[m] || 0) + 1; });
      const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

      const hasWellnessData = moods.length > 0 || sleepQualities.length > 0 || stressLevels.length > 0;

      // Exercise consistency
      const exerciseConsistency = exerciseEntries.length > 0 && moods.length > 0
        ? Math.round((exerciseEntries.length / moods.length) * 100)
        : undefined;

      // Nutrition Gaps
      const nutritionGaps: string[] = [];
      if (mealStatsData?.average_protein < 40) nutritionGaps.push('low protein');
      if (mealStatsData?.average_calories < 1400) nutritionGaps.push('low calories');

      const recentMoods = mealLogs
        .map((m) => m.mood_after)
        .filter(Boolean)
        .slice(0, 5) as string[];

      // Extract regularity score and health insights count from API
      const regularityScore = stats?.regularity_score ?? undefined;
      const confidenceLevel = stats?.confidence_level ?? undefined;
      const healthInsightsCount = anom?.anomalies?.length ?? undefined;

      // Extract pre-generated AI health insights (may be cached on backend)
      const insightsLang = useUmwariStore.getState().language === 'rw' ? 'kinyarwanda' : 'english';
      const aiInsights: UmwariHealthContext['aiInsights'] =
        insightsRes.status === 'fulfilled' &&
        insightsRes.value.data?.success &&
        insightsRes.value.data?.insights
          ? {
              inyunganizi: insightsRes.value.data.insights.inyunganizi || '',
              icyo_wakora: Array.isArray(insightsRes.value.data.insights.icyo_wakora)
                ? insightsRes.value.data.insights.icyo_wakora
                : [],
              ihumure: insightsRes.value.data.insights.ihumure || '',
              language: insightsRes.value.data.language || insightsLang,
              generated_at: insightsRes.value.data.generated_at || '',
            }
          : undefined;

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
          regularityScore,
          confidenceLevel,
          healthInsightsCount,
        } : undefined,
        wellnessSummary: {
          dominantMood,
          negativeMoodPercentage: moods.length > 0 ? Math.round((negativeMoods / moods.length) * 100) : undefined,
          highStressPercentage: stressLevels.length > 0 ? Math.round((highStress / stressLevels.length) * 100) : undefined,
          poorSleepPercentage: sleepQualities.length > 0 ? Math.round((poorSleep / sleepQualities.length) * 100) : undefined,
          lowEnergyPercentage: energyLevels.length > 0 ? Math.round((lowEnergy / energyLevels.length) * 100) : undefined,
          exerciseConsistency,
          hasWellnessData,
        },
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
        aiInsights,
      };

      setData(context);
      return context;
    } catch (err: any) {
      console.error('Failed to resolve context:', err);
      setError(err?.message || 'Error occurred while loading context');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  return (
    <UmwariContext.Provider value={{ data, isLoading, error, refetch: fetchContext }}>
      {children}
    </UmwariContext.Provider>
  );
}

// ──────────────────────────────────────────
// Consumer hook — call this from any component
// ──────────────────────────────────────────

export function useUmwariContext() {
  return useContext(UmwariContext);
}
