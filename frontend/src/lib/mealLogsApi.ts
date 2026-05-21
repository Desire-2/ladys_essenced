import { api } from './axios';
import { asArray } from './apiHelpers';
import { getApiErrorMessage } from './cycleLogsApi';

export interface MealLogFormData {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_items: string[];
  protein?: number;
  carbs?: number;
  fats?: number;
  calories?: number;
  mood_after?: string;
  meal_time?: string;
}

export interface MealLogCreateResponse {
  message: string;
  id: number;
}

const MOOD_SUFFIX_RE = /\s*\|\s*Mood:\s*(.+)$/i;

/** Build description string stored in Flask (food list + optional mood). */
export function buildMealDescription(foodItems: string[], moodAfter?: string): string {
  const foods = foodItems.map((f) => f.trim()).filter(Boolean).join(', ');
  if (moodAfter?.trim()) {
    return `${foods} | Mood: ${moodAfter.trim()}`;
  }
  return foods;
}

/** Parse description from API into food items and mood for the UI. */
export function parseMealDescription(description: string): { foodItems: string[]; moodAfter?: string } {
  if (!description?.trim()) {
    return { foodItems: [] };
  }
  const moodMatch = description.match(MOOD_SUFFIX_RE);
  const moodAfter = moodMatch?.[1]?.trim();
  const foodsPart = moodMatch ? description.replace(MOOD_SUFFIX_RE, '').trim() : description.trim();
  const foodItems = foodsPart
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { foodItems, moodAfter };
}

/** Map adolescent form payload to Flask POST body. */
export function buildMealLogPayload(data: MealLogFormData, options?: { userId?: number }) {
  const payload: Record<string, unknown> = {
    meal_type: data.meal_type,
    meal_time: data.meal_time ?? new Date().toISOString(),
    description: buildMealDescription(data.food_items, data.mood_after),
  };
  if (data.calories != null) payload.calories = data.calories;
  if (data.protein != null) payload.protein = data.protein;
  if (data.carbs != null) payload.carbs = data.carbs;
  if (data.fats != null) payload.fat = data.fats;
  if (options?.userId) payload.user_id = options.userId;
  return payload;
}

export async function fetchMealLogs(params?: {
  per_page?: number;
  page?: number;
  user_id?: number;
}): Promise<unknown[]> {
  const { data } = await api.get('/meal-logs', { params: { per_page: 50, ...params } });
  return asArray(data);
}

export async function createMealLog(
  data: MealLogFormData,
  options?: { userId?: number }
): Promise<MealLogCreateResponse> {
  const { data: res } = await api.post<MealLogCreateResponse>(
    '/meal-logs',
    buildMealLogPayload(data, options)
  );
  return res;
}

export async function deleteMealLog(logId: number): Promise<void> {
  await api.delete(`/meal-logs/${logId}`);
}

export interface MealStatsResponse {
  total_logs: number;
  meal_types: Record<string, number>;
  nutrition: {
    average_calories: number | null;
    average_protein: number | null;
    average_carbs: number | null;
    average_fat: number | null;
  };
}

export async function fetchMealStats(): Promise<MealStatsResponse | null> {
  try {
    const { data } = await api.get<MealStatsResponse>('/meal-logs/stats');
    return data;
  } catch {
    return null;
  }
}

/** Flatten nested Flask stats for components expecting top-level averages. */
export function flattenMealStats(raw: MealStatsResponse | null) {
  if (!raw) return null;
  return {
    total_logs: raw.total_logs,
    meal_types: raw.meal_types,
    average_calories: raw.nutrition?.average_calories ?? null,
    average_protein: raw.nutrition?.average_protein ?? null,
    average_carbs: raw.nutrition?.average_carbs ?? null,
    average_fat: raw.nutrition?.average_fat ?? null,
  };
}

export { getApiErrorMessage };
