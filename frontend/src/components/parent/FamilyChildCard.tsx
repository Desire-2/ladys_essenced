import React, { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchPhaseInsights } from '@/lib/cycleLogsApi';
import type { ChildProfile } from '@/types/parent';
import { getAccessState, getChildColor, childAgeFromDob, daysUntil } from '@/lib/parentUtils';
import { cn, formatDateTime } from '@/lib/utils';
import { ChildHealthBadge } from './ChildHealthBadge';
import { PrivacyStatusBadge } from './PrivacyStatusBadge';

const PHASE_DOT: Record<string, string> = {
  menstrual: 'bg-terracotta',
  follicular: 'bg-sage',
  ovulation: 'bg-mauve',
  luteal: 'bg-zinc-400',
};

const PHASE_LABELS: Record<string, string> = {
  menstrual: 'Menstruation',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
};

interface FamilyChildCardProps {
  child: ChildProfile;
  onView: (adolescentId: number) => void;
  /** Optional pre-fetched current phase to avoid duplicate API calls */
  currentPhase?: string | null;
}

export function FamilyChildCard({ child, onView, currentPhase: propPhase }: FamilyChildCardProps) {
  const color = getChildColor(child.adolescent_id);
  const access = getAccessState(child);
  const age = childAgeFromDob(child.date_of_birth);
  const nextAppt = child.upcoming_appointments[0];
  const days = daysUntil(child.next_period_predicted);

  // Current phase indicator — use prop if provided, otherwise fetch inline
  const [localPhase, setLocalPhase] = useState<string | null>(null);
  const [phaseLoading, setPhaseLoading] = useState(false);

  useEffect(() => {
    if (propPhase !== undefined) {
      setLocalPhase(propPhase);
      return;
    }
    if (access !== 'privacy_locked' && child.access_granted) {
      setPhaseLoading(true);
      fetchPhaseInsights(undefined, child.adolescent_id)
        .then((res) => setLocalPhase(res.current_phase || null))
        .catch(() => {
          // Silently fail — phase indicator is decorative
        })
        .finally(() => setPhaseLoading(false));
    }
  }, [child.adolescent_id, child.access_granted, access, propPhase]);

  const currentPhase = propPhase !== undefined ? propPhase : localPhase;

  const phaseDot = currentPhase ? PHASE_DOT[currentPhase] : null;
  const phaseLabel = currentPhase ? PHASE_LABELS[currentPhase] || currentPhase : null;

  return (
    <Card className="family-child-card min-w-[280px] max-w-sm flex-shrink-0 p-5">
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
          style={{
            background: color.bg,
            color: color.text,
            opacity: access === 'privacy_locked' ? 0.6 : 1,
          }}
        >
          {child.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Phase indicator dot + label */}
          {phaseLoading ? (
            <Loader2 className="w-3 h-3 text-muted animate-spin" />
          ) : phaseDot && phaseLabel ? (
            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cream border border-border">
              <span className={cn('w-1.5 h-1.5 rounded-full', phaseDot)} />
              {phaseLabel}
            </span>
          ) : null}
          {child.unread_notifications > 0 && (
            <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-terracotta text-cream text-xs font-bold flex items-center justify-center">
              {child.unread_notifications}
            </span>
          )}
        </div>
      </div>

      <h3 className="font-heading text-lg font-bold text-ink mt-3">{child.name}</h3>
      <p className="text-xs text-muted mt-0.5">
        {age != null ? `${age} years` : 'Age not set'} · Daughter
      </p>

      <div className="mt-2">
        <PrivacyStatusBadge state={access} />
      </div>

      {access === 'privacy_locked' ? (
        <div className="mt-4 p-3 rounded-xl bg-mauve/5 border border-mauve/15 text-left">
          <p className="text-xs font-semibold text-mauve flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Privacy mode is on
          </p>
          <p className="text-[11px] text-muted mt-1 leading-relaxed">
            {child.name} manages her own health data privately. You can still book appointments.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-left">
          <ChildHealthBadge child={child} />
          {days != null && days >= 0 && (
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-terracotta/70 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(8, 100 - (days / 28) * 100))}%` }}
              />
            </div>
          )}
          {nextAppt && (
            <p className="text-xs text-muted">
              Appointment: {formatDateTime(nextAppt.date)} · {nextAppt.status}
            </p>
          )}
          {!child.has_own_phone && (
            <p className="text-[11px] text-muted">Managed account · No phone yet</p>
          )}
          {child.has_health_anomaly && (
            <p className="text-xs text-amber-700 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> Health pattern changed
            </p>
          )}
        </div>
      )}

      <Button
        variant="secondary"
        className="w-full mt-4 text-sm"
        onClick={() => onView(child.adolescent_id)}
      >
        View Profile →
      </Button>
    </Card>
  );
}
