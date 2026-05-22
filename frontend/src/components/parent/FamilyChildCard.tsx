import React from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { ChildProfile } from '@/types/parent';
import { getAccessState, getChildColor, childAgeFromDob, daysUntil } from '@/lib/parentUtils';
import { formatDateTime } from '@/lib/utils';
import { ChildHealthBadge } from './ChildHealthBadge';
import { PrivacyStatusBadge } from './PrivacyStatusBadge';

interface FamilyChildCardProps {
  child: ChildProfile;
  onView: (adolescentId: number) => void;
}

export function FamilyChildCard({ child, onView }: FamilyChildCardProps) {
  const color = getChildColor(child.adolescent_id);
  const access = getAccessState(child);
  const age = childAgeFromDob(child.date_of_birth);
  const nextAppt = child.upcoming_appointments[0];
  const days = daysUntil(child.next_period_predicted);

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
        {child.unread_notifications > 0 && (
          <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-terracotta text-cream text-xs font-bold flex items-center justify-center">
            {child.unread_notifications}
          </span>
        )}
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
