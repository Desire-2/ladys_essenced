import { useState } from 'react';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { WeekView, WeekViewMobileList } from '@/components/providers/WeekView';
import { VerificationBanner } from '@/components/providers/VerificationBanner';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useProviderSchedule } from '@/hooks/providers/useProviderSchedule';
import { useProviderProfile } from '@/hooks/providers/useProviderProfile';

interface ProviderSchedulePageProps {
  onNavigate: (path: string) => void;
}

export function ProviderSchedulePage({ onNavigate }: ProviderSchedulePageProps) {
  const { profile } = useProviderProfile();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = addDays(weekStart, 6);
  const { schedule, isLoading, isError, refetch } = useProviderSchedule(weekStart, weekEnd);

  if (!profile?.is_verified) {
    return <VerificationBanner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => setWeekStart((d) => addWeeks(d, -1))}>
          ← Previous week
        </Button>
        <p className="font-semibold text-sm">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Today
          </Button>
          <Button type="button" variant="ghost" onClick={() => setWeekStart((d) => addWeeks(d, 1))}>
            Next week →
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-muted mb-3">Failed to load schedule.</p>
          <Button type="button" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <WeekView
            weekStart={weekStart}
            schedule={schedule ?? {}}
            onSelectAppointment={(id) => onNavigate(`/providers/appointments/${id}`)}
          />
          <WeekViewMobileList
            weekStart={weekStart}
            schedule={schedule ?? {}}
            onSelectAppointment={(id) => onNavigate(`/providers/appointments/${id}`)}
          />
        </>
      )}
    </div>
  );
}
