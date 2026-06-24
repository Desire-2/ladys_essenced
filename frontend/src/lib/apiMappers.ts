import type { CycleLog, MealLog } from '../types';
import type { InsightItem } from '../components/features/InsightCard';
import { asArray } from './apiHelpers';
import { parseMealDescription } from './mealLogsApi';

export interface DashboardCycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
  regularityScore: number;
  regularityLabel?: string;
  regularityStdDev?: number;
  confidenceLevel?: string;
  computableCycles?: number;
  latestPeriodStart?: string;
  hasCycleData: boolean;
}

export interface DashboardPredictions {
  next_period_date: string;
  fertile_window_start: string;
  fertile_window_end: string;
  /** Flask returns labels like high / medium / low, not always a number */
  confidence_label: string;
}

export interface DashboardNutritionStats {
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  total_calories: number;
  hasMealData: boolean;
}

const FLOW_MAP: Record<string, CycleLog['flow_level']> = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  spotting: 'light',
};

export function mapCycleLog(raw: Record<string, unknown>): CycleLog {
  const flow = String(raw.flow_intensity ?? raw.flow_level ?? 'medium').toLowerCase();
  return {
    id: Number(raw.id),
    user_id: Number(raw.user_id ?? 0),
    start_date: String(raw.start_date),
    end_date: raw.end_date ? String(raw.end_date) : undefined,
    flow_level: FLOW_MAP[flow] ?? 'medium',
    symptoms: Array.isArray(raw.symptoms) ? (raw.symptoms as string[]) : [],
    notes: raw.notes ? String(raw.notes) : undefined,
    confidence_score: raw.confidence_score != null ? Number(raw.confidence_score) : undefined,
    mood: raw.mood ? String(raw.mood) : null,
    energy_level: raw.energy_level ? String(raw.energy_level) : null,
    sleep_quality: raw.sleep_quality ? String(raw.sleep_quality) : null,
    stress_level: raw.stress_level ? String(raw.stress_level) : null,
    exercise_activities: raw.exercise_activities ? String(raw.exercise_activities) : null,
    created_at: String(raw.created_at ?? raw.start_date),
  };
}

export function mapMealLog(raw: Record<string, unknown>): MealLog {
  const description = String(raw.description ?? raw.details ?? '');
  const parsed = parseMealDescription(description);
  const foodItems = Array.isArray(raw.food_items)
    ? (raw.food_items as string[])
    : parsed.foodItems.length > 0
      ? parsed.foodItems
      : description
        ? [description]
        : [];

  return {
    id: Number(raw.id),
    user_id: Number(raw.user_id ?? 0),
    meal_type: (raw.meal_type as MealLog['meal_type']) ?? 'lunch',
    food_items: foodItems,
    protein: raw.protein != null ? Number(raw.protein) : undefined,
    carbs: raw.carbs != null ? Number(raw.carbs) : undefined,
    fats: raw.fat != null ? Number(raw.fat) : raw.fats != null ? Number(raw.fats) : undefined,
    calories: raw.calories != null ? Number(raw.calories) : undefined,
    mood_after: raw.mood_after ? String(raw.mood_after) : parsed.moodAfter,
    created_at: String(raw.meal_time ?? raw.date ?? raw.created_at ?? ''),
  };
}

const REGULARITY_LABELS: Record<string, string> = {
  ultra_regular: 'Ultra Regular',
  regular: 'Regular',
  mostly_regular: 'Mostly Regular',
  somewhat_irregular: 'Somewhat Irregular',
  irregular: 'Irregular',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  very_high: 'Very High',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  very_low: 'Very Low',
  no_data: 'No Data',
};

export function mapCycleStats(raw: unknown): DashboardCycleStats {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const basic = (data.basic_stats && typeof data.basic_stats === 'object'
    ? data.basic_stats
    : {}) as Record<string, unknown>;
  const regularity = (data.regularity && typeof data.regularity === 'object'
    ? data.regularity
    : {}) as Record<string, unknown>;
  const confidence = (data.confidence && typeof data.confidence === 'object'
    ? data.confidence
    : {}) as Record<string, unknown>;

  const avgCycle =
    Number(data.average_cycle_length ?? basic.average_cycle_length) || 0;
  const avgPeriod = Number(data.average_period_length ?? basic.average_period_length) || 0;
  const totalLogs = Number(data.total_logs ?? basic.total_logs) || 0;
  const validCycles = Number(data.valid_cycles ?? basic.valid_cycles ?? basic.data_points) || 0;
  const latestStart = (data.latest_period_start ?? basic.latest_period_start) as string | undefined;
  const regularityScore = Number(regularity.score ?? data.health_score) || 0;
  const regularityLabel = REGULARITY_LABELS[String(regularity.label ?? '')] ?? undefined;
  const confidenceLevel = CONFIDENCE_LABELS[String(confidence.level ?? '')] ?? undefined;

  return {
    avgCycleLength: avgCycle || 28,
    avgPeriodLength: avgPeriod || 5,
    regularityScore,
    regularityLabel,
    regularityStdDev: regularity.std_dev != null ? Number(regularity.std_dev) : undefined,
    confidenceLevel,
    computableCycles: validCycles,
    latestPeriodStart: latestStart,
    hasCycleData: totalLogs > 0 && Boolean(latestStart),
  };
}

export function mapPredictions(raw: unknown, statsRaw?: unknown): DashboardPredictions {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const stats = (statsRaw && typeof statsRaw === 'object' ? statsRaw : {}) as Record<string, unknown>;
  const list = asArray<Record<string, unknown>>(data.predictions);
  const first = list[0] ?? {};

  return {
    next_period_date: String(
      first.predicted_start ?? stats.next_period_prediction ?? ''
    ),
    fertile_window_start: String(
      first.fertile_window_start ?? stats.fertile_window_start ?? ''
    ),
    fertile_window_end: String(
      first.fertile_window_end ?? stats.fertile_window_end ?? ''
    ),
    confidence_label: String(
      first.confidence ?? stats.next_period_confidence ?? ''
    ).replace(/_/g, ' '),
  };
}

/** Sum today's logged meals for the daily nutrition card. */
export function mapTodayNutrition(meals: MealLog[]): DashboardNutritionStats {
  const todayKey = new Date().toDateString();
  const todayMeals = meals.filter((m) => {
    const d = new Date(m.created_at);
    return !Number.isNaN(d.getTime()) && d.toDateString() === todayKey;
  });

  if (todayMeals.length === 0) {
    return {
      total_protein: 0,
      total_carbs: 0,
      total_fats: 0,
      total_calories: 0,
      hasMealData: false,
    };
  }

  return {
    total_protein: todayMeals.reduce((s, m) => s + (m.protein ?? 0), 0),
    total_carbs: todayMeals.reduce((s, m) => s + (m.carbs ?? 0), 0),
    total_fats: todayMeals.reduce((s, m) => s + (m.fats ?? 0), 0),
    total_calories: todayMeals.reduce((s, m) => s + (m.calories ?? 0), 0),
    hasMealData: true,
  };
}

export function mapInsights(raw: unknown): InsightItem[] {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const items: InsightItem[] = [];
  let id = 1;

  const healthInsights = asArray<Record<string, unknown>>(data.insights);
  for (const ins of healthInsights) {
    const category = String(ins.category ?? ins.type ?? 'general');
    items.push({
      id: id++,
      title: category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      card_type:
        category.includes('iron') ? 'iron'
        : category.includes('water') || category.includes('hydrat') ? 'water'
        : category.includes('rest') || category.includes('sleep') ? 'rest'
        : 'general',
      message: String(ins.message ?? ins.detail ?? ''),
    });
  }

  const recommendations = asArray<Record<string, unknown>>(data.recommendations);
  for (const rec of recommendations.slice(0, 3)) {
    const tips = Array.isArray(rec.tips) ? rec.tips.join(' ') : '';
    items.push({
      id: id++,
      title: String(rec.title ?? 'Recommendation'),
      card_type: 'general',
      message: String(rec.message ?? tips),
    });
  }

  return items;
}

export function mapAnomaly(raw: unknown): { anomaly_detected: boolean; alert_text: string } {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    anomaly_detected: Boolean(data.anomaly_detected ?? data.has_anomaly),
    alert_text: String(data.alert_text ?? data.message ?? data.alert ?? ''),
  };
}
