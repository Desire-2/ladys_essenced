import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Cell,
} from 'recharts';
import { Card } from '../ui/Card';
import { Heart, Moon, Zap, Activity, AlertTriangle } from 'lucide-react';

/* ───────────────────────────────────────────────
   Types & Helpers
   ─────────────────────────────────────────────── */

export interface CycleLogWellness {
  id?: number;
  start_date: string;
  end_date?: string | null;
  end_date_estimated?: string | null;
  end_date_is_inferred?: boolean;
  mood?: string | null;
  energy_level?: string | null;
  sleep_quality?: string | null;
  stress_level?: string | null;
  exercise_activities?: string | null;
  symptoms?: string[] | string | null;
  flow_intensity?: string | null;
}

interface WellnessTrendsProps {
  logs: CycleLogWellness[];
  isLoading?: boolean;
}

/* ── Score encoding for ordinal wellness values ── */
const MOOD_SCORE: Record<string, number> = { very_low: 1, low: 2, neutral: 3, good: 4, very_good: 5 };
const MOOD_LABEL: Record<string, string> = { very_low: 'Very Low', low: 'Low', neutral: 'Neutral', good: 'Good', very_good: 'Very Good' };
const ENERGY_SCORE: Record<string, number> = { very_low: 1, low: 2, moderate: 3, high: 4 };
const ENERGY_LABEL: Record<string, string> = { very_low: 'Very Low', low: 'Low', moderate: 'Moderate', high: 'High' };
const SLEEP_SCORE: Record<string, number> = { poor: 1, fair: 2, good: 3, excellent: 4 };
const SLEEP_LABEL: Record<string, string> = { poor: 'Poor', fair: 'Fair', good: 'Good', excellent: 'Excellent' };
const STRESS_SCORE: Record<string, number> = { low: 4, moderate: 3, high: 2, very_high: 1 }; // inverted: high score = low stress
const STRESS_LABEL: Record<string, string> = { low: 'Low', moderate: 'Moderate', high: 'High', very_high: 'Very High' };

/* ── Color palette ── */
const COLORS = {
  mood: '#7A4F6D',
  moodLight: '#7A4F6D40',
  energy: '#C4785A',
  energyLight: '#C4785A40',
  sleep: '#8FAF8A',
  sleepLight: '#8FAF8A40',
  stress: '#A87C6A',
  stressLight: '#A87C6A40',
  exercise: '#6B8E6B',
  exerciseLight: '#6B8E6B40',
  positive: '#8FAF8A',
  neutral: '#C4785A',
  negative: '#B56576',
};

/* ── Tooltip style matching the app theme ── */
const tooltipStyle: React.CSSProperties = {
  backgroundColor: '#FDFAF6',
  border: '1px solid #E8DDD4',
  borderRadius: '12px',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '11px',
  padding: '10px 14px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
};

/* ── Tooltip label helpers ── */
const formatTooltipLabel = (
  _label: string,
  payload: Array<{ payload: Record<string, unknown> }> | undefined,
): string => {
  const entry = payload?.[0]?.payload as Record<string, unknown> | undefined;
  if (!entry?.fullLabel) return _label;
  const base = `${entry.fullLabel} — ${entry.label}`;
  if (entry.end_date_is_inferred && entry.end_date_estimated) {
    const d = new Date(String(entry.end_date_estimated));
    const est = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${base} (Est. end: ${est})`;
  }
  return base;
};

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */

export const WellnessTrends: React.FC<WellnessTrendsProps> = ({ logs, isLoading = false }) => {

  /* ── Transform raw logs into chart-ready data ── */
  const chartData = useMemo(() => {
    // Only keep logs that have at least one wellness field
    const valid = logs.filter(
      (l) => l.mood || l.energy_level || l.sleep_quality || l.stress_level || l.exercise_activities
    );

    // Take last 10 logs, sorted by date ascending
    const sorted = [...valid]
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(-10);

    return sorted.map((log, idx) => {
      const moodVal = log.mood ? MOOD_SCORE[log.mood] ?? null : null;
      const energyVal = log.energy_level ? ENERGY_SCORE[log.energy_level] ?? null : null;
      const sleepVal = log.sleep_quality ? SLEEP_SCORE[log.sleep_quality] ?? null : null;
      const stressVal = log.stress_level ? STRESS_SCORE[log.stress_level] ?? null : null; // inverted
      const rawStress = log.stress_level ? log.stress_level : null;
      const hasExercise = log.exercise_activities && log.exercise_activities.trim() ? 1 : 0;

      // Label: short date or "Cycle N"
      const d = new Date(log.start_date);
      const label = `C${idx + 1}`;
      const fullLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      return {
        ...log,
        label,
        fullLabel,
        mood: moodVal,
        energy: energyVal,
        sleep: sleepVal,
        stress: stressVal,          // inverted score (high = relaxed)
        rawStress,                   // original string for tooltip
        hasExercise,
        // Color-coded mood category
        moodCategory: moodVal !== null
          ? moodVal >= 4 ? 'positive' : moodVal <= 2 ? 'negative' : 'neutral'
          : 'neutral',
      };
    });
  }, [logs]);

  /* ── Aggregate wellness stats ── */
  const stats = useMemo(() => {
    const moodVals = chartData.map((d) => d.mood).filter((v): v is number => v !== null);
    const energyVals = chartData.map((d) => d.energy).filter((v): v is number => v !== null);
    const sleepVals = chartData.map((d) => d.sleep).filter((v): v is number => v !== null);
    const stressVals = chartData.map((d) => d.stress).filter((v): v is number => v !== null);
    const exerciseCount = chartData.reduce((sum, d) => sum + (d.hasExercise || 0), 0);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const pct = (arr: number[], threshold: number) =>
      arr.length > 0 ? Math.round((arr.filter((v) => v <= threshold).length / arr.length) * 100) : 0;

    return {
      avgMood: avg(moodVals),
      avgEnergy: avg(energyVals),
      avgSleep: avg(sleepVals),
      avgStress: avg(stressVals),
      lowMoodPct: pct(moodVals, 2),
      lowEnergyPct: pct(energyVals, 1),
      poorSleepPct: pct(sleepVals, 1),
      highStressPct: pct(stressVals, 2), // stress ≤ 2 = high stress (inverted)
      exerciseRate: chartData.length > 0 ? Math.round((exerciseCount / chartData.length) * 100) : 0,
      totalLogsWithWellness: chartData.length,
    };
  }, [chartData]);

  /* ── Empty / Loading State ── */
  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#7A4F6D]/5 flex items-center justify-center text-[#7A4F6D] animate-pulse">
            <Activity className="w-6 h-6" />
          </div>
          <p className="text-xs text-muted font-semibold">Loading wellness trends...</p>
        </div>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#7A4F6D]/5 flex items-center justify-center text-[#7A4F6D]">
            <Heart className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-ink">No wellness data yet</h4>
          <p className="text-xs text-muted max-w-[280px]">
            Track your mood, sleep, and stress when logging cycles to unlock personalized wellness trends.
          </p>
        </div>
      </Card>
    );
  }

  /* ── Mood bar fill color ── */
  const moodBarFill = (entry: any) => {
    if (entry.mood === null) return '#E8DDD4';
    if (entry.mood >= 4) return COLORS.positive;
    if (entry.mood <= 2) return COLORS.negative;
    return COLORS.neutral;
  };

  // Total stats that will be used in stat cards
  const totalWellnessLogs = stats.totalLogsWithWellness;

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */

  return (
    <div className="space-y-5 font-sans select-none">
      
      {/* ── Section: Quick Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Mood Score */}
        <StatCard
          icon={<Heart className="w-4 h-4" />}
          label="Mood"
          value={stats.avgMood > 0 ? stats.avgMood.toFixed(1) : '—'}
          max="/5"
          color={COLORS.mood}
          sub={`${stats.lowMoodPct}% low`}
          subColor={stats.lowMoodPct > 40 ? COLORS.negative : COLORS.positive}
        />
        {/* Energy Level */}
        <StatCard
          icon={<Zap className="w-4 h-4" />}
          label="Energy"
          value={stats.avgEnergy > 0 ? stats.avgEnergy.toFixed(1) : '—'}
          max="/4"
          color={COLORS.energy}
          sub={`${stats.lowEnergyPct}% low`}
          subColor={stats.lowEnergyPct > 40 ? COLORS.negative : COLORS.positive}
        />
        {/* Sleep Quality */}
        <StatCard
          icon={<Moon className="w-4 h-4" />}
          label="Sleep"
          value={stats.avgSleep > 0 ? stats.avgSleep.toFixed(1) : '—'}
          max="/4"
          color={COLORS.sleep}
          sub={`${stats.poorSleepPct}% poor`}
          subColor={stats.poorSleepPct > 30 ? COLORS.negative : COLORS.positive}
        />
        {/* Stress (inverted so higher = better) */}
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Relaxation"
          value={stats.avgStress > 0 ? stats.avgStress.toFixed(1) : '—'}
          max="/4"
          color={COLORS.stress}
          sub={`${stats.highStressPct}% stressed`}
          subColor={stats.highStressPct > 40 ? COLORS.negative : COLORS.positive}
        />
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Mood Trend Bar Chart ── */}
        <Card className="p-4.5 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#7A4F6D] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" /> Mood Trend
            </h4>
            <span className="text-[9px] text-muted font-semibold">Last {chartData.length} cycles</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#8B8278', fontWeight: 600 }}
                  axisLine={{ stroke: '#E8DDD4' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 9, fill: '#8B8278', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => ['', '↓', '↘', '→', '↗', '↑'][v] ?? ''}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, _name: string, props: any) => {
                    const moodLabel = MOOD_LABEL[['very_low', 'low', 'neutral', 'good', 'very_good'][Math.round(value) - 1]] ?? `${value}`;
                    return [moodLabel, 'Mood'];
                  }}
                  labelFormatter={formatTooltipLabel}
                />
                <Bar dataKey="mood" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={moodBarFill(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[9px] font-semibold text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS.positive }} /> Good
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS.neutral }} /> Neutral
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS.negative }} /> Low
            </span>
          </div>
        </Card>

        {/* ── Stress & Sleep Line Chart ── */}
        <Card className="p-4.5 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#8FAF8A] flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5" /> Sleep &amp; Stress
            </h4>
            <span className="text-[9px] text-muted font-semibold">{totalWellnessLogs} logs</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#8B8278', fontWeight: 600 }}
                  axisLine={{ stroke: '#E8DDD4' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0.5, 4.5]}
                  ticks={[1, 2, 3, 4]}
                  tick={{ fontSize: 9, fill: '#8B8278', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => ['', 'Poor', 'Fair', 'Good', 'Excel.'][Math.round(v)] ?? ''}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === 'Sleep') {
                      const label = SLEEP_LABEL[['poor', 'fair', 'good', 'excellent'][Math.round(value) - 1]] ?? `${value}`;
                      return [label, 'Sleep Quality'];
                    }
                    const label = STRESS_LABEL[['very_high', 'high', 'moderate', 'low'][Math.round(value) - 1]] ?? `${value}`;
                    return [label, 'Stress (inverted: high=relaxed)'];
                  }}
                  labelFormatter={formatTooltipLabel}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#8B8278' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Line
                  type="monotone"
                  dataKey="sleep"
                  name="Sleep"
                  stroke={COLORS.sleep}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COLORS.sleep, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: COLORS.sleep, strokeWidth: 2, stroke: '#fff' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="stress"
                  name="Stress"
                  stroke={COLORS.stress}
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                  dot={{ r: 3, fill: COLORS.stress, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: COLORS.stress, strokeWidth: 2, stroke: '#fff' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[9px] font-semibold text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.sleep }} /> Sleep
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-dashed" style={{ backgroundColor: COLORS.stress }} /> Stress (inv.)
            </span>
          </div>
        </Card>

      </div>

      {/* ── Second Row: Energy & Exercise ── */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4.5 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#C4785A] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Energy &amp; Exercise
            </h4>
            <span className="text-[9px] text-muted font-semibold">
              {stats.exerciseRate}% active
            </span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#8B8278', fontWeight: 600 }}
                  axisLine={{ stroke: '#E8DDD4' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 4.5]}
                  ticks={[1, 2, 3, 4]}
                  tick={{ fontSize: 9, fill: '#8B8278', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => ['', '↓', '→', '↑', '⚡'][Math.round(v)] ?? ''}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 1.5]}
                  ticks={[0, 1]}
                  tick={{ fontSize: 9, fill: '#8B8278', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v === 0 ? 'No' : 'Yes'}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'Energy') {
                      const label = ENERGY_LABEL[['very_low', 'low', 'moderate', 'high'][Math.round(value) - 1]] ?? `${value}`;
                      return [label, 'Energy'];
                    }
                    if (name === 'Exercise') {
                      return [value >= 0.5 ? 'Yes' : 'No', 'Exercise'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={formatTooltipLabel}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#8B8278' }}
                  iconType="rect"
                  iconSize={8}
                />
                <Bar
                  yAxisId="left"
                  dataKey="energy"
                  name="Energy"
                  fill={COLORS.energy}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={24}
                  opacity={0.8}
                />
                <Area
                  yAxisId="right"
                  dataKey="hasExercise"
                  name="Exercise"
                  fill={COLORS.exerciseLight}
                  stroke={COLORS.exercise}
                  strokeWidth={2}
                  type="stepAfter"
                  dot={false}
                  activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted font-medium text-center mt-2">
            {stats.exerciseRate >= 50
              ? 'Great consistency! Keep up the active lifestyle.'
              : stats.exerciseRate >= 25
                ? 'Moderate activity — try adding light walks during luteal phase.'
                : 'Low activity — gentle exercise can help regulate cycles and boost mood.'}
          </p>
        </Card>
      </div>

      {/* ── Health Insights Banner ── */}
      {stats.lowMoodPct > 40 || stats.highStressPct > 40 || stats.poorSleepPct > 30 ? (
        <div className="p-3.5 bg-terracotta/5 border border-terracotta/20 rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="w-4.5 h-4.5 text-terracotta shrink-0 mt-0.5" />
          <p className="text-[11px] text-ink font-semibold leading-relaxed">
            <span className="text-terracotta font-black uppercase text-[9px] tracking-wider">Wellness Flag: </span>
            {stats.lowMoodPct > 40 && 'Frequent low moods detected. '}
            {stats.highStressPct > 40 && 'High stress levels reported. '}
            {stats.poorSleepPct > 30 && 'Poor sleep quality noted. '}
            Consider discussing these patterns with Umwari or a healthcare provider for personalized support.
          </p>
        </div>
      ) : null}

    </div>
  );
};

/* ═══════════════════════════════════════════════
   StatCard sub-component
   ═══════════════════════════════════════════════ */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  max: string;
  color: string;
  sub: string;
  subColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, max, color, sub, subColor }) => (
  <div
    className="bg-white border border-[#E8DDD4] rounded-xl p-3.5 flex flex-col items-start gap-1 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center gap-1.5">
      <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest text-muted">{label}</span>
    </div>
    <div className="flex items-baseline gap-0.5 mt-0.5">
      <span className="text-xl font-extrabold font-heading text-ink">{value}</span>
      <span className="text-[9px] text-muted font-semibold">{max}</span>
    </div>
    <span className="text-[9px] font-bold" style={{ color: subColor }}>{sub}</span>
  </div>
);

export default WellnessTrends;
