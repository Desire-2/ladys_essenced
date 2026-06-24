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
