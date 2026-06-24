import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import {
  Heart,
  Moon,
  Zap,
  Dumbbell,
  Activity,
  Droplets,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BrainCircuit,
} from 'lucide-react';
import { fetchPhaseInsights, type PhaseInsightsResponse, type PhaseInfo, type PhaseTip } from '../../lib/cycleLogsApi';

const PHASE_ORDER = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const;

const PHASE_COLORS: Record<string, string> = {
  menstrual: 'border-l-terracotta bg-terracotta/5',
  follicular: 'border-l-sage bg-sage/5',
  ovulation: 'border-l-mauve bg-mauve/5',
  luteal: 'border-l-zinc-400 bg-zinc-50',
};

const PHASE_BADGE: Record<string, string> = {
  menstrual: 'bg-terracotta/10 text-terracotta border-terracotta/20',
  follicular: 'bg-sage/10 text-sage border-sage/20',
  ovulation: 'bg-mauve/10 text-mauve border-mauve/20',
  luteal: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

const PHASE_DOT: Record<string, string> = {
  menstrual: 'bg-terracotta',
  follicular: 'bg-sage',
  ovulation: 'bg-mauve',
  luteal: 'bg-zinc-400',
};

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  positive: <Heart className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />,
  info: <Info className="w-3.5 h-3.5 text-mauve shrink-0 mt-0.5" />,
};

const PRIORITY_CLASSES: Record<string, string> = {
  positive: 'bg-sage/5 border-sage/15 text-sage-800',
  warning: 'bg-terracotta/5 border-terracotta/15 text-terracotta-800',
  info: 'bg-mauve/5 border-mauve/15 text-zinc-700',
};

function PhaseCard({ phaseKey, phase, isExpanded, onToggle }: {
  phaseKey: string;
  phase: PhaseInfo;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const ws = phase.wellness_summary;

  return (
    <div
      className={cn(
        'border border-border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer select-none',
        isExpanded ? 'shadow-sm' : 'hover:shadow-sm hover:border-muted',
        PHASE_COLORS[phaseKey] || 'border-l-muted'
      )}
      onClick={onToggle}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          <span className={cn('w-3 h-3 rounded-full shrink-0', PHASE_DOT[phaseKey] || 'bg-muted')} />
          <div>
            <span className="text-sm font-bold text-ink block leading-tight">{phase.label}</span>
            <span className="text-[10px] text-muted font-medium">{phase.bilingual} · {phase.days_typical}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </div>
      </div>

      {/* Phase description */}
      <div className="px-3.5 pb-2">
        <p className="text-[11px] text-muted/80 italic leading-relaxed">{phase.description}</p>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3.5 pb-4 space-y-3">
          {/* Wellness summary (if available) */}
          {ws && (ws.most_common_mood || ws.most_common_energy || ws.most_common_sleep || ws.most_common_stress) && (
            <div className="flex flex-wrap gap-2">
              {ws.most_common_mood && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-cream border border-border px-2 py-1 rounded-full text-ink">
                  <Heart className="w-3 h-3 text-terracotta" /> Mood: {ws.most_common_mood.replace(/_/g, ' ')}
                </span>
              )}
              {ws.most_common_energy && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-cream border border-border px-2 py-1 rounded-full text-ink">
                  <Zap className="w-3 h-3 text-terracotta" /> Energy: {ws.most_common_energy.replace(/_/g, ' ')}
                </span>
              )}
              {ws.most_common_sleep && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-cream border border-border px-2 py-1 rounded-full text-ink">
                  <Moon className="w-3 h-3 text-mauve" /> Sleep: {ws.most_common_sleep.replace(/_/g, ' ')}
                </span>
              )}
              {ws.most_common_stress && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-cream border border-border px-2 py-1 rounded-full text-ink">
                  <Activity className="w-3 h-3 text-terracotta" /> Stress: {ws.most_common_stress.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          )}

          {/* Tips list */}
          <div className="space-y-2">
            {phase.tips.map((tip, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-start gap-2 p-2.5 rounded-lg border text-[11px] leading-relaxed',
                  PRIORITY_CLASSES[tip.priority] || 'bg-surface border-border'
                )}
              >
                {PRIORITY_ICONS[tip.priority] || <Info className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />}
                <span className="text-ink/90">{tip.tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CyclePhaseInsightsProps {
  hasCycleTracking: boolean;
}

export const CyclePhaseInsights: React.FC<CyclePhaseInsightsProps> = ({ hasCycleTracking }) => {
  const [data, setData] = useState<PhaseInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  useEffect(() => {
    if (!hasCycleTracking) return;
    setLoading(true);
    setError(null);
    fetchPhaseInsights()
      .then((res) => {
        setData(res);
        if (res.current_phase && !expandedPhase) {
          setExpandedPhase(res.current_phase);
        }
      })
      .catch((err) => {
        console.error('Failed to load phase insights:', err);
        setError('Could not load phase insights');
      })
      .finally(() => setLoading(false));
  }, [hasCycleTracking]);

  const handleToggle = (phaseKey: string) => {
    setExpandedPhase((prev) => (prev === phaseKey ? null : phaseKey));
  };

  if (!hasCycleTracking) return null;

  return (
    <div className="font-sans">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold font-heading text-ink flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-mauve" /> Cycle Phase Insights
        </h3>
        <span className="text-[9px] text-muted font-bold uppercase tracking-wider">
          {data ? `${data.total_cycles_analyzed} cycles analyzed` : ''}
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-6 text-center text-xs text-muted animate-pulse">
          Analyzing your cycle phases...
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="py-4 text-center text-xs text-terracotta flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {/* No data state */}
      {!loading && !error && data && !data.has_sufficient_data && (
        <div className="p-4 border border-dashed border-border rounded-xl text-center text-xs text-muted/70 italic">
          Log at least 2 cycles to receive personalized phase-by-phase health insights and wellness tips.
        </div>
      )}

      {/* Phase cards */}
      {!loading && !error && data && data.has_sufficient_data && (
        <div className="space-y-2">
          {PHASE_ORDER.map((phaseKey) => {
            const phase = data.phases[phaseKey];
            if (!phase) return null;
            const isCurrent = phaseKey === data.current_phase;
            return (
              <div key={phaseKey} className="relative">
                {isCurrent && (
                  <span className="absolute -top-1.5 right-2 z-10 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-mauve/10 text-mauve border border-mauve/20 uppercase tracking-wider">
                    Current Phase
                  </span>
                )}
                <PhaseCard
                  phaseKey={phaseKey}
                  phase={phase}
                  isExpanded={expandedPhase === phaseKey}
                  onToggle={() => handleToggle(phaseKey)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Wellness data hint */}
      {!loading && !error && data && data.wellness_data_available === 0 && data.has_sufficient_data && (
        <div className="mt-2 p-2.5 bg-cream/40 border border-dashed border-border rounded-lg text-[10px] text-muted text-center flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-terracotta" />
          Track mood, energy, and sleep in your cycle logs for even more personalized tips.
        </div>
      )}
    </div>
  );
};

export default CyclePhaseInsights;
