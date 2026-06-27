import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Heart,
  Moon,
  Zap,
  Activity,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Sparkles,
} from 'lucide-react';
import { fetchPhaseInsights, type PhaseInsightsResponse, type PhaseInfo } from '@/lib/cycleLogsApi';

const PHASE_ORDER = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const;

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
  positive: 'bg-sage/5 border-sage/15',
  warning: 'bg-terracotta/5 border-terracotta/15',
  info: 'bg-mauve/5 border-mauve/15',
};

function PhaseCard({ phaseKey, phase, isExpanded, onToggle, isCurrent }: {
  phaseKey: string;
  phase: PhaseInfo;
  isExpanded: boolean;
  isCurrent: boolean;
  onToggle: () => void;
}) {
  const ws = phase.wellness_summary;

  return (
    <div
      className={cn(
        'border border-border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer select-none',
        isExpanded ? 'shadow-sm' : 'hover:shadow-sm hover:border-muted',
        isCurrent ? 'ring-1 ring-mauve/30' : ''
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
          {isCurrent && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-mauve/10 text-mauve border border-mauve/20 uppercase tracking-wider">
              Current
            </span>
          )}
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
          {/* Wellness summary badges */}
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

interface ParentCyclePhaseInsightsProps {
  adolescentId: number;
  childName: string;
  childUserId?: number;
}

export const ParentCyclePhaseInsights: React.FC<ParentCyclePhaseInsightsProps> = ({
  adolescentId,
  childName,
  childUserId,
}) => {
  const [data, setData] = useState<PhaseInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const targetUserId = childUserId ?? adolescentId;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPhaseInsights(undefined, targetUserId)
      .then((res) => {
        setData(res);
        if (res.current_phase && !expandedPhase) {
          setExpandedPhase(res.current_phase);
        }
      })
      .catch((err) => {
        console.error(`Failed to load phase insights for child ${adolescentId}:`, err);
        setError('Could not load phase insights');
      })
      .finally(() => setLoading(false));
  }, [targetUserId, adolescentId]);

  const handleToggle = (phaseKey: string) => {
    setExpandedPhase((prev) => (prev === phaseKey ? null : phaseKey));
  };

  return (
    <div className="font-sans">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold font-heading text-ink flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-mauve" /> {childName}&apos;s Phase Insights
        </h3>
        <span className="text-[9px] text-muted font-bold uppercase tracking-wider">
          {data ? `${data.total_cycles_analyzed} cycles analyzed` : ''}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-6 text-center text-xs text-muted animate-pulse">
          Analyzing {childName}&apos;s cycle phases...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="py-4 text-center text-xs text-terracotta flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {/* No data / insufficient data */}
      {!loading && !error && data && !data.has_sufficient_data && (
        <div className="p-4 border border-dashed border-border rounded-xl text-center text-xs text-muted/70 italic">
          {childName} needs at least 2 logged cycles before phase insights become available.
        </div>
      )}

      {/* Phase cards */}
      {!loading && !error && data && data.has_sufficient_data && (
        <div className="space-y-2">
          {PHASE_ORDER.map((phaseKey) => {
            const phase = data.phases[phaseKey];
            if (!phase) return null;
            return (
              <PhaseCard
                key={phaseKey}
                phaseKey={phaseKey}
                phase={phase}
                isExpanded={expandedPhase === phaseKey}
                isCurrent={phaseKey === data.current_phase}
                onToggle={() => handleToggle(phaseKey)}
              />
            );
          })}
        </div>
      )}

      {/* Wellness tracking hint */}
      {!loading && !error && data && data.wellness_data_available === 0 && data.has_sufficient_data && (
        <div className="mt-2 p-2.5 bg-cream/40 border border-dashed border-border rounded-lg text-[10px] text-muted text-center flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-terracotta" />
          Log {childName}&apos;s mood, energy, and sleep during periods for even more personalized tips.
        </div>
      )}

      {/* Privacy note */}
      {!loading && !error && data && data.has_sufficient_data && (
        <div className="mt-2 text-[9px] text-muted/60 text-center">
          Insights based on {childName}&apos;s logged cycle data
        </div>
      )}
    </div>
  );
};

export default ParentCyclePhaseInsights;
