import React from 'react';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { useChildMealLogs } from '@/hooks/parent/useChildHealth';
import { PrivacyLockedPanel } from '@/components/parent/PrivacyLockedPanel';
import { getAccessState } from '@/lib/parentUtils';
import { Spinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';

interface ChildMealsPageProps {
  adolescentId: number;
  onNavigate: (path: string) => void;
}

export function ChildMealsPage({ adolescentId, onNavigate }: ChildMealsPageProps) {
  const { data: dashboard } = useParentDashboard();
  const profile = dashboard?.children.find((c) => c.adolescent_id === adolescentId);
  const name = profile?.name ?? 'Family member';
  const access = profile ? getAccessState(profile) : 'full_access';
  const { data, isLoading } = useChildMealLogs(adolescentId);

  if (access === 'privacy_locked') {
    return (
      <PrivacyLockedPanel
        childName={name}
        onBookAppointment={() =>
          onNavigate(`/dashboard/parent/appointments/book?child=${adolescentId}`)
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="text-sm text-muted hover:text-ink"
        onClick={() => onNavigate(`/dashboard/parent/children/${adolescentId}`)}
      >
        ← {name}&apos;s profile
      </button>
      <h2 className="text-xl font-heading font-bold">{name}&apos;s meal logs</h2>

      {isLoading ? (
        <Spinner />
      ) : data?.items.length ? (
        <ul className="space-y-3">
          {(data.items as Record<string, unknown>[]).map((meal) => (
            <li key={String(meal.id)} className="p-4 border border-border rounded-xl">
              <p className="font-semibold capitalize">{String(meal.meal_type ?? 'meal')}</p>
              <p className="text-xs text-muted">{formatDateTime(String(meal.meal_time))}</p>
              {meal.description && (
                <p className="text-sm mt-1">{String(meal.description)}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted text-center py-8">No meals logged yet.</p>
      )}
    </div>
  );
}
