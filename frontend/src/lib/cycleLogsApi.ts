import axios from 'axios';
import { api } from './axios';

export interface CycleLogFormData {
  start_date: string;
  end_date?: string;
  flow_level: 'light' | 'medium' | 'heavy';
  symptoms: string[];
  notes?: string;
  mood?: string;
  energy_level?: string;
  sleep_quality?: string;
  stress_level?: string;
  exercise_activities?: string;
}

export interface CycleLogCreateResponse {
  message: string;
  id: number;
  calculated_cycle_length?: number;
  calculated_period_length?: number;
  prediction?: {
    predicted_start: string;
    confidence: string;
    predicted_cycle_length?: number;
  };
  data_quality?: {
    total_logs: number;
    has_enough_data: boolean;
    recommendation: string;
  };
}

/** Map form fields to Flask POST/PUT body. */
export function buildCycleLogPayload(data: CycleLogFormData, options?: { userId?: number }) {
  const payload: Record<string, unknown> = {
    start_date: data.start_date,
    flow_intensity: data.flow_level,
    symptoms: data.symptoms,
  };
  if (data.end_date) payload.end_date = data.end_date;
  if (data.notes) payload.notes = data.notes;
  if (data.mood) payload.mood = data.mood;
  if (data.energy_level) payload.energy_level = data.energy_level;
  if (data.sleep_quality) payload.sleep_quality = data.sleep_quality;
  if (data.stress_level) payload.stress_level = data.stress_level;
  if (data.exercise_activities) payload.exercise_activities = data.exercise_activities;
  if (options?.userId) payload.user_id = options.userId;
  return payload;
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? err.message ?? 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

export async function createCycleLog(data: CycleLogFormData): Promise<CycleLogCreateResponse> {
  const { data: res } = await api.post<CycleLogCreateResponse>(
    '/cycle-logs',
    buildCycleLogPayload(data)
  );
  return res;
}

export async function updateCycleLog(
  logId: number,
  data: CycleLogFormData
): Promise<{ message: string }> {
  const { data: res } = await api.put<{ message: string }>(
    `/cycle-logs/${logId}`,
    buildCycleLogPayload(data)
  );
  return res;
}

export async function deleteCycleLog(logId: number): Promise<void> {
  await api.delete(`/cycle-logs/${logId}`);
}

/** Fetch enriched calendar data for a specific month */
export interface CalendarDay {
  date: string;
  day_of_month: number;
  is_current_month: boolean;
  is_today: boolean;
  is_period_day: boolean;
  is_period_start: boolean;
  is_period_end: boolean;
  is_ovulation_day: boolean;
  is_fertility_day: boolean;
  is_predicted: boolean;
  flow_intensity: string | null;
  symptoms: string[];
  notes: string | null;
  mood: string | null;
  energy_level: string | null;
  sleep_quality: string | null;
  stress_level: string | null;
  exercise_activities: string | null;
  cycle_day: number | null;
  phase: string | null;
  confidence: string | null;
}

export interface CalendarResponse {
  year: number;
  month: number;
  month_name: string;
  days: CalendarDay[];
  stats: {
    total_logs: number;
    data_points: number;
    average_cycle_length: number | null;
    variability: Record<string, unknown> | null;
    predictions: Record<string, unknown>[];
  };
}

export async function fetchCalendarData(year: number, month: number): Promise<CalendarResponse> {
  const { data } = await api.get<CalendarResponse>('/cycle-logs/calendar', {
    params: { year, month },
  });
  return data;
}

/** Phase Insights types and API function */
export interface PhaseWellnessSummary {
  most_common_mood?: string | null;
  most_common_energy?: string | null;
  most_common_sleep?: string | null;
  most_common_stress?: string | null;
  total_logs_with_data?: number;
  cycle_lengths_count?: number;
}

export interface PhaseTip {
  category: string;
  tip: string;
  priority: string;
  phase: string;
}

export interface PhaseInfo {
  label: string;
  bilingual: string;
  days_typical: string;
  description: string;
  wellness_summary: PhaseWellnessSummary;
  tips: PhaseTip[];
}

export interface PhaseInsightsResponse {
  phases: Record<string, PhaseInfo>;
  current_phase: string;
  total_cycles_analyzed: number;
  wellness_data_available: number;
  has_sufficient_data: boolean;
  requested_phase?: string;
}

export async function fetchPhaseInsights(phase?: string, userId?: number): Promise<PhaseInsightsResponse> {
  const params: Record<string, string | number> = {};
  if (phase) params.phase = phase;
  if (userId) params.user_id = userId;
  const { data } = await api.get<PhaseInsightsResponse>('/cycle-logs/phase-insights', { params });
  return data;
}

export function formatPredictionToast(prediction?: CycleLogCreateResponse['prediction']): string | null {
  if (!prediction?.predicted_start) return null;
  const date = new Date(prediction.predicted_start).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const confidence = prediction.confidence
    ? ` (${String(prediction.confidence).replace('_', ' ')})`
    : '';
  return `Next period estimated around ${date}${confidence}.`;
}
