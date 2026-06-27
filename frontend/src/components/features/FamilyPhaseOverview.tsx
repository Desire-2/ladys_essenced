import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Lock, ChevronRight, BrainCircuit, Sparkles, AlertTriangle, Activity } from 'lucide-react';
import { fetchPhaseInsights, type PhaseInsightsResponse } from '@/lib/cycleLogsApi';
import type { ChildProfile } from '@/types/parent';

const PHASE_DOT: Record<string, string> = {
  menstrual: 'bg-terracotta',
  follicular: 'bg-sage',
  ovulation: 'bg-mauve',
  luteal: 'bg-zinc-400',
};

const PHASE_LABELS: Record<string, string> = {
  menstrual: 'Menstruation',
  follicular: 'Follicular Phase',
  ovulation: 'Ovulation',
  luteal: 'Luteal Phase',
};

const PHASE_BADGE: Record<string, string> = {
  menstrual: 'bg-terracotta/10 text-terracotta border-terracotta/20',
  follicular: 'bg-sage/10 text-sage border-sage/20',
  ovulation: 'bg-mauve/10 text-mauve border-mauve/20',
  luteal: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

const PRIORITY_CLASSES: Record<string, string> = {
  positive: 'text-sage-800 bg-sage/5',
  warning: 'text-terracotta-800 bg-terracotta/5',
  info: 'text-zinc-700 bg-mauve/5',
};

interface ChildPhaseState {
  adolescentId: number;
  name: string;
  accessGranted: boolean;
  loading: boolean;
  data: PhaseInsightsResponse | null;
  error: string | null;
}

interface FamilyPhaseOverviewProps {
  children: ChildProfile[];
  onViewChild: (adolescentId: number) => void;
}

function ChildPhaseCard({
  state,
  onView,
}: {
  state: ChildPhaseState;
  onView: () => void;
}) {
  const { name, accessGranted, loading, data, error } = state;
  const phaseKey = data?.current_phase ?? 'follicular';
  const phaseDot = PHASE_DOT[phaseKey] || 'bg-muted';
  const phaseLabel = PHASE_LABELS[phaseKey] || phaseKey;
  const phaseBadge = PHASE_BADGE[phaseKey] || 'bg-surface text-muted border-border';
  const totalLogs = data?.total_cycles_analyzed ?? 0;

  // Get first non-generic tip if available
  const phaseData = data?.phases?.[phaseKey];
  const firstTip = phaseData?.tips?.find(
    (t) => t.priority === 'warning' || t.priority === 'positive'
  ) ?? phaseData?.tips?.[0];

  return (
    <div
      className="border border-border rounded-xl bg-surface overflow-hidden transition-all duration-200 hover:shadow-sm hover:border-muted cursor-pointer select-none"
      onClick={onView}
    >
      <div className="p-3.5">
        {/* Header row: dot + name + phase badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', phaseDot)} />
            <span className="text-sm font-bold text-ink truncate">{name}</span>
            {!accessGranted && <Lock className="w-3 h-3 text-muted shrink-0" />}
          </div>
          <span className={cn(
            'text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0',
            phaseBadge
          )}>
            {phaseLabel}
          </span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="h-4 bg-muted/20 rounded animate-pulse" />
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex items-center gap-1.5 text-[10px] text-terracotta">
            <AlertTriangle className="w-3 h-3" /> Could not load
          </div>
        )}

        {/* Privacy locked */}
        {!loading && !accessGranted && (
          <div className="text-[10px] text-muted italic flex items-center gap-1">
            <Lock className="w-3 h-3" /> Privacy mode on — book appointments instead
          </div>
        )}

        {/* Insight / data summary */}
        {!loading && !error && accessGranted && data && (
          <div className="space-y-1.5">
            {data.has_sufficient_data ? (
              <>
                {firstTip && (
                  <p className={cn(
                    'text-[10px] leading-relaxed px-2 py-1 rounded border',
                    PRIORITY_CLASSES[firstTip.priority] || 'text-muted bg-surface border-border'
                  )}>
                    {firstTip.tip.length > 100
                      ? firstTip.tip.slice(0, 100) + '...'
                      : firstTip.tip}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[9px] text-muted">
                  <span>{totalLogs} cycle{totalLogs !== 1 ? 's' : ''}</span>
                  {data.wellness_data_available > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Activity className="w-2.5 h-2.5" /> {data.wellness_data_available} with wellness
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-[10px] text-muted italic">
                Need at least 2 logged cycles for phase insights
              </p>
            )}
          </div>
        )}


      </div>

      {/* Footer link */}
      <div className="px-3.5 pb-2.5">
        <button
          type="button"
          className="text-[9px] font-bold text-terracotta hover:text-terracotta/80 flex items-center gap-0.5 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          View cycle details <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export const FamilyPhaseOverview: React.FC<FamilyPhaseOverviewProps> = ({
  children,
  onViewChild,
}) => {
  // Initialize state for each child
  const [childStates, setChildStates] = useState<ChildPhaseState[]>(() =>
    children.map((child) => ({
      adolescentId: child.adolescent_id,
      name: child.name,
      accessGranted: child.access_granted,
      loading: child.access_granted, // Only load if access granted
      data: null,
      error: null,
    }))
  );

  useEffect(() => {
    const accessibleChildren = children.filter((c) => c.access_granted);
    if (accessibleChildren.length === 0) return;

    // Fetch phase insights for all accessible children in parallel
    Promise.allSettled(
      accessibleChildren.map((child) =>
        fetchPhaseInsights(undefined, child.user_id)
          .then((res) => ({ adolescentId: child.adolescent_id, data: res }))
          .catch((err) => ({
            adolescentId: child.adolescent_id,
            error: String(err),
          }))
      )
    ).then((results) => {
      const updates: Record<number, { data?: PhaseInsightsResponse; error?: string }> = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data) {
          updates[result.value.adolescentId] = { data: result.value.data };
        } else if (result.status === 'fulfilled' && result.value.error) {
          updates[result.value.adolescentId] = { error: result.value.error };
        }
      });

      setChildStates((prev) =>
        prev.map((state) => {
          const update = updates[state.adolescentId];
          if (update) {
            return {
              ...state,
              loading: false,
              data: update.data ?? state.data,
              error: update.error ?? state.error,
            };
          }
          return { ...state, loading: false };
        })
      );
    });
  }, [children]);

  if (childStates.length === 0) return null;

  return (
    <div>
      <h3 className="font-heading font-bold text-ink mb-3 flex items-center gap-2">
        <BrainCircuit className="w-4.5 h-4.5 text-mauve" /> Phase Overview
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {childStates.map((state) => (
          <ChildPhaseCard
            key={state.adolescentId}
            state={state}
            onView={() => onViewChild(state.adolescentId)}
          />
        ))}
      </div>
    </div>
  );
};

export default FamilyPhaseOverview;
