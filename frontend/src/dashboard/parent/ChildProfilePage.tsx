import React from 'react';
import { useParentStore } from '@/stores/parentStore';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { useChild } from '@/hooks/parent/useChildren';
import { getAccessState, childAgeFromDob, getChildColor } from '@/lib/parentUtils';
import { PrivacyStatusBadge } from '@/components/parent/PrivacyStatusBadge';
import { PrivacyLockedPanel } from '@/components/parent/PrivacyLockedPanel';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

interface ChildProfilePageProps {
  adolescentId: number;
  onNavigate: (path: string) => void;
}

export function ChildProfilePage({ adolescentId, onNavigate }: ChildProfilePageProps) {
  const setActiveChild = useParentStore((s) => s.setActiveChild);
  const { data: dashboard } = useParentDashboard();
  const { child, isLoading } = useChild(adolescentId);

  const profile =
    dashboard?.children.find((c) => c.adolescent_id === adolescentId) ?? null;
  const access = profile ? getAccessState(profile) : 'full_access';
  const color = getChildColor(adolescentId);
  const name = child?.name ?? profile?.name ?? 'Family member';
  const age = childAgeFromDob(child?.date_of_birth ?? profile?.date_of_birth);

  React.useEffect(() => {
    setActiveChild(adolescentId);
  }, [adolescentId, setActiveChild]);

  if (isLoading && !child) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const base = `/dashboard/parent/children/${adolescentId}`;

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="text-sm text-muted hover:text-ink"
        onClick={() => onNavigate('/dashboard/parent')}
      >
        ← Back to Family
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: color.bg, color: color.text }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-ink">{name}</h2>
            <p className="text-sm text-muted">
              {age != null ? `${age} years old` : 'Age not set'} · Daughter
            </p>
            {profile && <PrivacyStatusBadge state={access} />}
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => onNavigate(`${base}/settings`)}
        >
          Edit profile
        </Button>
      </div>

      {access === 'privacy_locked' ? (
        <PrivacyLockedPanel
          childName={name}
          onBookAppointment={() =>
            onNavigate(`/dashboard/parent/appointments/book?child=${adolescentId}`)
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onNavigate(`${base}/cycle`)}>Cycle & health</Button>
            <Button variant="secondary" onClick={() => onNavigate(`${base}/meals`)}>
              Meals
            </Button>
            <Button variant="secondary" onClick={() => onNavigate(`${base}/appointments`)}>
              Appointments
            </Button>
            <Button onClick={() => onNavigate(`/dashboard/parent/appointments/book?child=${adolescentId}`)}>
              Book appointment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-xs text-muted uppercase">Upcoming appointments</p>
              <p className="text-2xl font-bold text-ink mt-1">
                {child?.health_summary?.upcoming_appointments ?? 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted uppercase">Cycle logs</p>
              <p className="text-2xl font-bold text-ink mt-1">
                {profile?.cycle_summary?.total_logs ?? '—'}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted uppercase">Next period</p>
              <p className="text-sm font-semibold text-ink mt-1">
                {profile?.next_period_predicted?.split('T')[0] ?? 'Not predicted yet'}
              </p>
            </Card>
          </div>

          {profile?.has_health_anomaly && (
            <Card className="p-4 border-amber-200 bg-amber-50/50">
              <p className="text-sm font-semibold text-amber-800">Health pattern alert</p>
              <p className="text-xs text-muted mt-1">
                An irregular pattern was detected. Consider booking a check-up.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
