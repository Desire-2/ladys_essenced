import { useMemo, useState } from 'react';
import { VerificationBanner } from '@/components/providers/VerificationBanner';
import { AppointmentTable } from '@/components/providers/AppointmentTable';
import { UpdateAppointmentModal } from '@/components/providers/UpdateAppointmentModal';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import {
  useProviderAppointments,
  useUpdateAppointment,
} from '@/hooks/providers/useProviderAppointments';
import { useProviderProfile } from '@/hooks/providers/useProviderProfile';
import type { ProviderAppointment } from '@/types/provider';

interface ProviderAppointmentsPageProps {
  onNavigate: (path: string) => void;
}

export function ProviderAppointmentsPage({ onNavigate }: ProviderAppointmentsPageProps) {
  const { profile } = useProviderProfile();
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editAppt, setEditAppt] = useState<ProviderAppointment | null>(null);

  const filters = useMemo(
    () => ({
      status: status || undefined,
      priority: priority || undefined,
      date_filter: dateFilter || undefined,
      patient_search: search || undefined,
    }),
    [status, priority, dateFilter, search],
  );

  const { data, isLoading, isError, refetch } = useProviderAppointments(filters);
  const { mutate: updateAppt, isPending } = useUpdateAppointment(refetch);

  if (!profile?.is_verified) {
    return <VerificationBanner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search patient name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs text-sm"
        />
        <select
          className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Status: All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No show</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
        <select
          className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">Priority: All</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <div className="flex gap-1">
          {['today', 'week', 'month', ''].map((f) => (
            <button
              key={f || 'all'}
              type="button"
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                dateFilter === f ? 'bg-sage/20 border-sage text-ink' : 'border-border text-muted'
              }`}
            >
              {f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-muted mb-3">Failed to load appointments.</p>
          <Button type="button" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : (
        <AppointmentTable
          appointments={data?.appointments ?? []}
          onView={(id) => onNavigate(`/providers/appointments/${id}`)}
          onAction={setEditAppt}
        />
      )}

      <UpdateAppointmentModal
        appointment={editAppt}
        isOpen={!!editAppt}
        onClose={() => setEditAppt(null)}
        isSaving={isPending}
        onSave={async (payload) => {
          if (!editAppt) return;
          await updateAppt({ id: editAppt.id, payload });
        }}
      />
    </div>
  );
}
