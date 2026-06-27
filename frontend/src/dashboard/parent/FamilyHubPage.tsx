import React, { useMemo } from 'react';
import { Bell, Plus, CalendarDays } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { FamilyChildCard } from '@/components/parent/FamilyChildCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FamilyPhaseOverview } from '@/components/features/FamilyPhaseOverview';
import { formatDateTime } from '@/lib/utils';

interface FamilyHubPageProps {
  onNavigate: (path: string) => void;
}

export function FamilyHubPage({ onNavigate }: FamilyHubPageProps) {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch } = useParentDashboard();

  const timeline = useMemo(() => {
    if (!data?.children) return [];
    const events: { time: string; label: string; sort: number }[] = [];
    const now = Date.now();

    for (const child of data.children) {
      if (child.next_period_predicted) {
        const t = new Date(child.next_period_predicted).getTime();
        events.push({
          time: child.next_period_predicted,
          label: `${child.name}: Period predicted ${formatDateTime(child.next_period_predicted)} 🌸`,
          sort: Math.abs(t - now),
        });
      }
      for (const appt of child.upcoming_appointments) {
        events.push({
          time: appt.date,
          label: `${child.name}: Appointment ${formatDateTime(appt.date)} 📅 (${appt.status})`,
          sort: Math.abs(new Date(appt.date).getTime() - now),
        });
      }
      if (child.has_health_anomaly && child.access_granted) {
        events.push({
          time: new Date().toISOString(),
          label: `${child.name}: Health pattern alert ⚠`,
          sort: 0,
        });
      }
    }
    return events.sort((a, b) => a.sort - b.sort).slice(0, 8);
  }, [data]);

  const greeting = user?.name?.split(' ')[0] || 'there';

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-ink">
            Mwaramutse, {greeting} ❤
          </h2>
          <p className="text-sm text-muted mt-1">
            You are caring for {data?.total_children ?? 0} family member
            {(data?.total_children ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Bell className="w-4 h-4 text-terracotta" />
          {(data?.parent_unread_notifications ?? 0) > 0
            ? `${data?.parent_unread_notifications} unread for you`
            : 'No new alerts for you'}
        </div>
      </div>

      {error && (
        <p className="text-sm text-mauve">
          {error}{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-ink">Your family</h3>
          <Button
            className="text-sm h-10"
            onClick={() => onNavigate('/dashboard/parent/children/add')}
          >
            <Plus className="w-4 h-4 mr-1" /> Add member
          </Button>
        </div>

        {data?.children.length ? (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
            {data.children.map((child) => (
              <FamilyChildCard
                key={child.adolescent_id}
                child={child}
                onView={(id) => onNavigate(`/dashboard/parent/children/${id}`)}
              />
            ))}
            <button
              type="button"
              onClick={() => onNavigate('/dashboard/parent/children/add')}
              className="min-w-[140px] flex-shrink-0 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted hover:border-terracotta hover:text-terracotta transition-colors"
            >
              <Plus className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Add member</span>
            </button>
          </div>
        ) : (
          <EmptyState
            title="No family members yet"
            description="Add your daughters to start tracking cycles, meals, and appointments from one phone."
            actionText="Add family member"
            onAction={() => onNavigate('/dashboard/parent/children/add')}
          />
        )}
      </div>

      {/* Family Phase Overview — compact snapshot of each child's current phase */}
      {data?.children && data.children.length > 0 && (
        <FamilyPhaseOverview
          children={data.children}
          onViewChild={(id) => onNavigate(`/dashboard/parent/children/${id}/cycle`)}
        />
      )}

      {/* Quick-access buttons to each child's cycle page */}
      {data?.children && data.children.length > 0 && (
        <div>
          <h3 className="font-heading font-bold text-ink mb-3 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-mauve" />
            Cycle Calendars
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.children.map((child) => (
              <button
                key={child.adolescent_id}
                type="button"
                onClick={() => onNavigate(`/dashboard/parent/children/${child.adolescent_id}/cycle`)}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-surface border border-border hover:border-terracotta hover:text-terracotta hover:bg-terracotta/5 transition-all cursor-pointer text-left"
              >
                <span className="block text-ink">{child.name}</span>
                <span className="block text-[10px] text-muted mt-0.5">
                  {child.access_granted
                    ? (child.cycle_summary?.total_logs ?? 0) > 0
                      ? `${child.cycle_summary?.total_logs ?? 0} logs`
                      : 'No logs yet'
                    : 'Access restricted'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {timeline.length > 0 && (
        <div>
          <h3 className="font-heading font-bold text-ink mb-3">Today across your family</h3>
          <ul className="space-y-2">
            {timeline.map((ev, i) => (
              <li
                key={`${ev.label}-${i}`}
                className="text-sm text-ink bg-cream/80 border border-border rounded-xl px-4 py-3"
              >
                {ev.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
