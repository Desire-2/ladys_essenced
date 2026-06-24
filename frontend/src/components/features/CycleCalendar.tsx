import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/axios';
import { X, Heart, Activity, Moon, Zap, Dumbbell, AlertTriangle, Droplets } from 'lucide-react';

interface CalendarDayData {
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

interface CalendarStats {
  total_logs: number;
  data_points: number;
  average_cycle_length: number | null;
  variability: Record<string, unknown> | null;
  predictions: Record<string, unknown>[];
}

interface CycleCalendarProps {
  lastPeriodStart: string;
  cycleLength?: number;
  periodLength?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const PHASE_LABELS: Record<string, { label: string; bilingual: string; description: string }> = {
  menstrual: { label: 'Menstruation', bilingual: 'Imihango', description: 'Uterine lining sheds — period days' },
  follicular: { label: 'Follicular Phase', bilingual: 'Ubuzima busanzwe', description: 'Egg follicles mature, estrogen rises' },
  ovulation: { label: 'Ovulation Day', bilingual: 'Uburumbuke', description: 'Egg released — peak fertility (24h)' },
  fertile: { label: 'Fertile Window', bilingual: 'Uburumbuke', description: 'Sperm can survive — pregnancy possible' },
  luteal: { label: 'Luteal Phase', bilingual: 'Imbere y\'imihango', description: 'Progesterone rises, lining thickens' },
};

const PHASE_COLORS: Record<string, string> = {
  menstrual: 'bg-terracotta/15 text-terracotta border-terracotta/20',
  follicular: 'bg-sage/15 text-sage border-sage/20',
  ovulation: 'bg-mauve/20 text-mauve border-mauve/30 ring-1 ring-mauve/40',
  luteal: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  fertile: 'bg-mauve/15 text-mauve border-mauve/20',
};

/** Phase indicator bar colors — matching Phase Insights and legend */
const PHASE_BAR_COLORS: Record<string, string> = {
  menstrual: 'bg-terracotta',
  follicular: 'bg-sage',
  ovulation: 'bg-mauve',
  luteal: 'bg-zinc-300',
  fertile: 'bg-mauve',
};

const CYCLE_TYPE_LABELS: Record<string, string> = {
  short: 'Short Cycle (21-25 days)',
  normal: 'Normal Cycle (26-32 days)',
  long: 'Long Cycle (33-40 days)',
  irregular: 'Irregular Cycles',
  unknown: 'Unknown',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  very_high: 'text-sage',
  high: 'text-sage',
  medium: 'text-terracotta',
  low: 'text-muted',
  very_low: 'text-muted/60',
};

const MOOD_EMOJIS: Record<string, string> = {
  very_low: '😢',
  low: '😞',
  medium: '😐',
  good: '🙂',
  very_good: '😊',
  excellent: '😄',
};

const MOOD_LABELS: Record<string, string> = {
  very_low: 'Very Low',
  low: 'Low',
  medium: 'Medium',
  good: 'Good',
  very_good: 'Very Good',
  excellent: 'Excellent',
};

const ENERGY_LABELS: Record<string, string> = {
  very_low: 'Very Low',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very High',
};

const SLEEP_LABELS: Record<string, string> = {
  poor: 'Poor',
  fair: 'Fair',
  good: 'Good',
  excellent: 'Excellent',
};

const STRESS_LABELS: Record<string, string> = {
  very_low: 'Very Low',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very High',
};

function getPhaseForDay(day: CalendarDayData): string {
  if (day.is_period_day) return 'menstrual';
  if (day.is_ovulation_day) return 'ovulation';
  if (day.is_fertility_day) return 'fertile';
  // Return the actual phase from backend, with sensible defaults
  if (day.phase === 'follicular') return 'follicular';
  if (day.phase === 'luteal') return 'luteal';
  if (day.phase === 'ovulation') return 'ovulation';
  return day.phase || 'follicular';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getMonthDateRange(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export const CycleCalendar: React.FC<CycleCalendarProps> = ({
  lastPeriodStart,
  cycleLength = 28,
  periodLength = 5,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [days, setDays] = useState<CalendarDayData[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null);
  const [hoveredDay, setHoveredDay] = useState<CalendarDayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Build a lookup map for quick day access
  const dayMap = React.useMemo(() => {
    const map = new Map<string, CalendarDayData>();
    days.forEach(d => map.set(d.date, d));
    return map;
  }, [days]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/cycle-logs/calendar', {
        params: { year: currentYear, month: currentMonth + 1 },
      });
      setDays(data.days || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
      setError('Could not load calendar data');
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    if (lastPeriodStart) {
      fetchData();
    }
  }, [lastPeriodStart, currentYear, currentMonth, fetchData]);

  const navigateMonth = (direction: number) => {
    const newMonth = currentMonth + direction;
    if (newMonth < 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else if (newMonth > 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(newMonth);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Build grid cells
  const cells = getMonthDateRange(currentYear, currentMonth);
  const monthName = MONTH_NAMES[currentMonth];

  const getDayData = (dayNum: number): CalendarDayData | null => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return dayMap.get(dateStr) || null;
  };

  const handleDayClick = (day: CalendarDayData) => {
    setSelectedDay(day);
  };

  const handleDayHover = (day: CalendarDayData | null, e?: React.MouseEvent) => {
    setHoveredDay(day);
    if (day && e) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <>
      <div className="font-sans border border-border p-5 rounded-xl bg-surface select-none relative">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-ink transition-all cursor-pointer"
              title="Previous month"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h4 className="font-heading font-semibold text-ink text-base min-w-[140px] text-center">
              {monthName} {currentYear}
            </h4>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-ink transition-all cursor-pointer"
              title="Next month"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {!today || currentMonth !== today.getMonth() || currentYear !== today.getFullYear() ? (
              <button
                onClick={goToToday}
                className="text-[10px] font-bold text-terracotta hover:underline px-2 py-1 cursor-pointer"
              >
                Today
              </button>
            ) : null}
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="py-8 text-center text-xs text-muted animate-pulse">Loading calendar data...</div>
        )}
        {error && !loading && (
          <div className="py-4 text-center text-xs text-terracotta flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        {/* Weekday labels */}
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted mb-1.5 gap-0.5">
          {WEEK_DAYS.map((wd, i) => (
            <div key={i} className="py-1">{wd}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 text-center gap-0.5 text-sm">
          {cells.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={idx} className="p-1" />;
            }

            const dayData = getDayData(dayNum);
            const dateObj = new Date(currentYear, currentMonth, dayNum);
            const isToday = dateObj.toDateString() === today.toDateString();

            if (!dayData) {
              // No data for this day - render plain
              return (
                <div
                  key={idx}
                  className={cn(
                    'p-1.5 rounded-lg flex items-center justify-center font-medium transition-all',
                    isToday ? 'ring-2 ring-mauve bg-mauve/10 text-mauve font-bold' : 'text-muted/60'
                  )}
                >
                  <span>{dayNum}</span>
                </div>
              );
            }

            const phase = getPhaseForDay(dayData);
            const isPeriod = dayData.is_period_day;
            const isFertile = dayData.is_fertility_day && !isPeriod;
            const isOvulation = dayData.is_ovulation_day;
            const isPredicted = dayData.is_predicted;

            const cellClass = cn(
              'p-1.5 rounded-lg flex items-center justify-center font-semibold transition-all relative cursor-pointer select-none',
              isPeriod && !isToday && 'bg-terracotta/20 text-terracotta border border-terracotta/30',
              isFertile && !isToday && 'bg-mauve/25 text-mauve border border-mauve/30',
              isOvulation && !isToday && 'bg-mauve/30 text-mauve border border-mauve/40 ring-1 ring-mauve/50',
              !isPeriod && !isFertile && !isOvulation && !isToday && phase === 'follicular' && 'bg-sage/15 text-sage border border-sage/20',
              !isPeriod && !isFertile && !isOvulation && !isToday && phase !== 'follicular' && 'hover:bg-cream text-ink bg-surface',
              isToday && 'ring-2 ring-mauve bg-mauve text-white font-bold',
              isPredicted && !isPeriod && !isFertile && !isOvulation && 'opacity-90',
              isPredicted && 'border-dashed border-muted/50'
            );

            const phaseBarColor = phase && PHASE_BAR_COLORS[phase]
              ? PHASE_BAR_COLORS[phase]
              : isPredicted ? 'bg-muted/40' : undefined;

            return (
              <div
                key={idx}
                className={cn(cellClass, 'flex-col py-1 gap-0')}
                onClick={() => handleDayClick(dayData)}
                onMouseEnter={(e) => handleDayHover(dayData, e)}
                onMouseLeave={() => handleDayHover(null)}
              >
                <span className="z-10 text-[13px] leading-none">{dayNum}</span>

                {/* Phase indicator bar — colored strip showing this day's phase */}
                {/* Fertile days get a ringed bar; other phases get a plain bar with phase-appropriate opacity */}
                {isFertile && !isPredicted && !isPeriod ? (
                  <span className="mt-0.5 w-3.5 h-1 rounded-full bg-mauve ring-1 ring-mauve/60" />
                ) : phaseBarColor ? (
                  <span
                    className={cn(
                      'mt-0.5 w-3.5 h-1 rounded-full transition-all duration-150',
                      phaseBarColor,
                      isPeriod && 'opacity-90',
                      !isPeriod && !isOvulation && 'opacity-70'
                    )}
                  />
                ) : null}

                {/* Predicted indicator dot */}
                {isPredicted && (
                  <span className={cn(
                    'absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full',
                    isPeriod ? 'bg-terracotta' : isOvulation ? 'bg-mauve' : 'bg-muted/60'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        {stats && stats.average_cycle_length && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted">
            <span>
              Avg: <strong className="text-ink">{stats.average_cycle_length}d</strong>
              {stats.data_points > 0 && ` · ${stats.data_points} cycles`}
            </span>
            {stats.variability && (
              <span className={cn(
                'font-semibold',
                (stats.variability as any).variability === 'regular' || (stats.variability as any).variability === 'very_regular'
                  ? 'text-sage' : 'text-terracotta'
              )}>
                {(stats.variability as any).variability?.replace(/_/g, ' ')}
              </span>
            )}
            {(stats as any).cycle_type && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/10 text-muted font-semibold">
                {CYCLE_TYPE_LABELS[(stats as any).cycle_type] || (stats as any).cycle_type}
              </span>
            )}
          </div>
        )}

        {/* Phase legend — always visible, separate from stats */}
        <div className="mt-2 pt-2 border-t border-border flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
          <span className="font-semibold text-[9px] uppercase tracking-wider text-muted/60">Phases</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-terracotta/60" />
            <span>Menstrual</span>
          </div>          <div className="flex items-center gap-1.5">
              {/* Follicular cells use default bg-surface, not a special color — show as cream with border */}
              <span className="w-2.5 h-2.5 rounded-sm border border-border bg-cream" />
              <span>Follicular</span>
            </div>
          <div className="flex items-center gap-1.5">
            {/* Ovulation uses sage to match cell styling (isOvulation => bg-sage/20) */}
            <span className="w-2.5 h-2.5 rounded-sm bg-sage/60" />
            <span>Ovulation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-zinc-300" />
            <span>Luteal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-mauve/40 bg-mauve/10" />
            <span>Fertile</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-muted/40 bg-transparent" />
            <span>Predicted</span>
          </div>
        </div>
      </div>

      {/* ============ FLOATING TOOLTIP ============ */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-900/95 backdrop-blur-sm text-white rounded-xl shadow-2xl p-3.5 min-w-[200px] max-w-[280px] border border-white/10"
          style={{
            left: Math.min(tooltipPos.x + 16, window.innerWidth - 300),
            top: Math.max(tooltipPos.y - 10, 10),
          }}
        >
          <div className="text-xs font-bold text-white/90 mb-1.5">{formatDate(hoveredDay.date)}</div>
          
          <div className="space-y-1 text-[11px]">
            {/* Phase */}
            {hoveredDay.phase && (
              <div className="flex items-center justify-between">
                <span className="text-white/60">Phase</span>
                <span className="font-semibold capitalize">{hoveredDay.phase}</span>
              </div>
            )}

            {/* Cycle Day */}
            {hoveredDay.cycle_day && (
              <div className="flex items-center justify-between">
                <span className="text-white/60">Cycle Day</span>
                <span className="font-semibold">Day {hoveredDay.cycle_day}</span>
              </div>
            )}

            {/* Period indicators */}
            {hoveredDay.is_period_day && (
              <div className="flex items-center justify-between">
                <span className="text-white/60">Status</span>
                <span className="font-semibold flex items-center gap-1 text-terracotta-300">
                  <Droplets className="w-3 h-3" />
                  {hoveredDay.is_predicted ? 'Predicted Period' : 'Period Day'}
                  {hoveredDay.is_period_start && ' (Start)'}
                  {hoveredDay.is_period_end && ' (End)'}
                </span>
              </div>
            )}

            {/* Flow intensity */}
            {hoveredDay.flow_intensity && (
              <div className="flex items-center justify-between">
                <span className="text-white/60">Flow</span>
                <span className="font-semibold capitalize">{hoveredDay.flow_intensity}</span>
              </div>
            )}

            {/* Ovulation */}
            {hoveredDay.is_ovulation_day && (
              <div className="flex items-center justify-between">
                <span className="text-white/60">Ovulation</span>
                <span className="font-semibold text-sage-300">🔵 Peak fertility</span>
              </div>
            )}

            {/* Fertile window */}
            {hoveredDay.is_fertility_day && !hoveredDay.is_ovulation_day && (
              <div className="flex items-center justify-between">
                <span className="text-white/60">Fertility</span>
                <span className="font-semibold text-mauve-300">🌸 Fertile window</span>
              </div>
            )}

            {/* Predicted confidence */}
            {hoveredDay.is_predicted && hoveredDay.confidence && (
              <div className="flex items-center justify-between">
                <span className="text-white/60">Confidence</span>
                <span className={cn('font-semibold capitalize', CONFIDENCE_COLORS[hoveredDay.confidence] || '')}>
                  {hoveredDay.confidence.replace(/_/g, ' ')}
                </span>
              </div>
            )}

            {/* Divider before wellness */}
            {(hoveredDay.mood || hoveredDay.energy_level || hoveredDay.sleep_quality || hoveredDay.stress_level || hoveredDay.exercise_activities) && (
              <div className="border-t border-white/10 my-1.5" />
            )}

            {/* Mood */}
            {hoveredDay.mood && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Mood
                </span>
                <span className="font-semibold">
                  {MOOD_EMOJIS[hoveredDay.mood] || ''} {MOOD_LABELS[hoveredDay.mood] || hoveredDay.mood}
                </span>
              </div>
            )}

            {/* Energy */}
            {hoveredDay.energy_level && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Energy
                </span>
                <span className="font-semibold">{ENERGY_LABELS[hoveredDay.energy_level] || hoveredDay.energy_level}</span>
              </div>
            )}

            {/* Sleep */}
            {hoveredDay.sleep_quality && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1">
                  <Moon className="w-3 h-3" /> Sleep
                </span>
                <span className="font-semibold">{SLEEP_LABELS[hoveredDay.sleep_quality] || hoveredDay.sleep_quality}</span>
              </div>
            )}

            {/* Stress */}
            {hoveredDay.stress_level && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Stress
                </span>
                <span className="font-semibold">{STRESS_LABELS[hoveredDay.stress_level] || hoveredDay.stress_level}</span>
              </div>
            )}

            {/* Exercise */}
            {hoveredDay.exercise_activities && (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" /> Exercise
                </span>
                <span className="font-semibold text-right max-w-[140px] truncate">{hoveredDay.exercise_activities}</span>
              </div>
            )}

            {/* Symptoms */}
            {hoveredDay.symptoms && hoveredDay.symptoms.length > 0 && (
              <>
                <div className="border-t border-white/10 my-1.5" />
                <div className="flex flex-wrap gap-1">
                  {hoveredDay.symptoms.map((s, i) => (
                    <span key={i} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            {hoveredDay.notes && (
              <div className="text-[10px] text-white/70 italic mt-1 line-clamp-2">"{hoveredDay.notes}"</div>
            )}
          </div>

          <div className="text-[9px] text-white/40 text-center mt-2">Click for details</div>
        </div>
      )}

      {/* ============ DETAIL MODAL ============ */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-[fadeInUp_0.15s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedDay(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-cream text-muted hover:text-ink transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Date header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold font-heading text-ink">
                  {new Date(selectedDay.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-[11px] text-muted">
                  {new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                </p>
              </div>
              {selectedDay.is_today && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-mauve/10 text-mauve border border-mauve/20">
                  Today
                </span>
              )}
            </div>

            {/* Phase badge */}
            {selectedDay.phase && (
              <div className="flex items-center gap-2 mb-4">
                <span className={cn(
                  'text-[10px] font-bold px-2.5 py-1 rounded-full border',
                  PHASE_COLORS[getPhaseForDay(selectedDay)]
                )}>
                  {PHASE_LABELS[getPhaseForDay(selectedDay)]?.label || selectedDay.phase}
                  {' • '}
                  {PHASE_LABELS[getPhaseForDay(selectedDay)]?.bilingual || selectedDay.phase}
                </span>
                {selectedDay.is_predicted && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Predicted
                  </span>
                )}
              </div>
            )}

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Cycle Day */}
              {selectedDay.cycle_day && (
                <div className="p-3 bg-cream/50 border border-border rounded-xl text-center">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Cycle Day</span>
                  <span className="text-xl font-extrabold text-ink font-heading">Day {selectedDay.cycle_day}</span>
                </div>
              )}

              {/* Period info */}
              {selectedDay.is_period_day && (
                <div className="p-3 bg-terracotta/5 border border-terracotta/15 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">
                    {selectedDay.is_predicted ? 'Predicted Period' : 'Period Day'}
                  </span>
                  <span className="text-xl font-extrabold text-terracotta font-heading">
                    {selectedDay.flow_intensity ? selectedDay.flow_intensity.charAt(0).toUpperCase() + selectedDay.flow_intensity.slice(1) : 'Active'}
                  </span>
                </div>
              )}

              {/* Fertility */}
              {selectedDay.is_fertility_day && (
                <div className="p-3 bg-mauve/5 border border-mauve/15 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Fertility</span>
                  <span className="text-lg font-extrabold text-mauve font-heading">
                    {selectedDay.is_ovulation_day ? '🟢 Peak ovulation' : '🌸 Fertile window'}
                  </span>
                </div>
              )}

              {/* Confidence */}
              {selectedDay.confidence && (
                <div className="p-3 bg-surface border border-border rounded-xl text-center">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Confidence</span>
                  <span className={cn(
                    'text-sm font-extrabold font-heading capitalize',
                    CONFIDENCE_COLORS[selectedDay.confidence] || ''
                  )}>
                    {selectedDay.confidence.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>

            {/* Wellness data section */}
            {(selectedDay.mood || selectedDay.energy_level || selectedDay.sleep_quality || selectedDay.stress_level || selectedDay.exercise_activities) && (
              <div className="mb-4">
                <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Heart className="w-3 h-3" /> Wellness Tracking
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedDay.mood && (
                    <div className="flex items-center gap-2 p-2 bg-cream/30 rounded-lg">
                      <span className="text-lg">{MOOD_EMOJIS[selectedDay.mood] || '😐'}</span>
                      <div>
                        <span className="text-[9px] text-muted block">Mood</span>
                        <span className="text-xs font-bold text-ink">{MOOD_LABELS[selectedDay.mood] || selectedDay.mood}</span>
                      </div>
                    </div>
                  )}
                  {selectedDay.energy_level && (
                    <div className="flex items-center gap-2 p-2 bg-cream/30 rounded-lg">
                      <Zap className="w-4 h-4 text-terracotta shrink-0" />
                      <div>
                        <span className="text-[9px] text-muted block">Energy</span>
                        <span className="text-xs font-bold text-ink">{ENERGY_LABELS[selectedDay.energy_level] || selectedDay.energy_level}</span>
                      </div>
                    </div>
                  )}
                  {selectedDay.sleep_quality && (
                    <div className="flex items-center gap-2 p-2 bg-cream/30 rounded-lg">
                      <Moon className="w-4 h-4 text-mauve shrink-0" />
                      <div>
                        <span className="text-[9px] text-muted block">Sleep</span>
                        <span className="text-xs font-bold text-ink">{SLEEP_LABELS[selectedDay.sleep_quality] || selectedDay.sleep_quality}</span>
                      </div>
                    </div>
                  )}
                  {selectedDay.stress_level && (
                    <div className="flex items-center gap-2 p-2 bg-cream/30 rounded-lg">
                      <Activity className="w-4 h-4 text-terracotta shrink-0" />
                      <div>
                        <span className="text-[9px] text-muted block">Stress</span>
                        <span className="text-xs font-bold text-ink">{STRESS_LABELS[selectedDay.stress_level] || selectedDay.stress_level}</span>
                      </div>
                    </div>
                  )}
                  {selectedDay.exercise_activities && (
                    <div className="flex items-center gap-2 p-2 bg-cream/30 rounded-lg col-span-2">
                      <Dumbbell className="w-4 h-4 text-sage shrink-0" />
                      <div className="truncate">
                        <span className="text-[9px] text-muted block">Exercise</span>
                        <span className="text-xs font-bold text-ink truncate">{selectedDay.exercise_activities}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Symptoms */}
            {selectedDay.symptoms && selectedDay.symptoms.length > 0 && (
              <div className="mb-3">
                <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Symptoms</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDay.symptoms.map((s, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-cream border border-border px-2.5 py-1 rounded-full text-zinc-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedDay.notes && (
              <div className="p-3 bg-cream/30 border border-border rounded-xl">
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Notes</span>
                <p className="text-xs text-ink/80 italic leading-relaxed">"{selectedDay.notes}"</p>
              </div>
            )}

            {/* Empty state */}
            {!selectedDay.is_period_day && !selectedDay.is_fertility_day && !selectedDay.is_ovulation_day &&
             !selectedDay.mood && !selectedDay.symptoms?.length && !selectedDay.notes && (
              <div className="py-6 text-center text-xs text-muted/70 italic">
                {selectedDay.is_predicted
                  ? 'No data logged for this predicted day.'
                  : 'No tracking data for this day.'}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CycleCalendar;
