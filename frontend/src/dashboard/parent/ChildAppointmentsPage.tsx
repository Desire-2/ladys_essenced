import React, { useState } from 'react';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import {
  useChildAppointments,
  useCancelAppointment,
} from '@/hooks/parent/useParentAppointments';
import { ParentAppointmentCard } from '@/components/parent/ParentAppointmentCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface ChildAppointmentsPageProps {
  adolescentId: number;
  onNavigate: (path: string) => void;
}

export function ChildAppointmentsPage({
  adolescentId,
  onNavigate,
}: ChildAppointmentsPageProps) {
  const { data: dashboard } = useParentDashboard();
  const profile = dashboard?.children.find((c) => c.adolescent_id === adolescentId);
  const name = profile?.name ?? 'Family member';
  const [statusFilter, setStatusFilter] = useState('');
  const { appointments, isLoading, refetch } = useChildAppointments(adolescentId, {
    status: statusFilter || undefined,
  });
  const { mutateAsync: cancel, isPending: cancelling } = useCancelAppointment();

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="text-sm text-muted hover:text-ink"
        onClick={() => onNavigate(`/dashboard/parent/children/${adolescentId}`)}
      >
        ← {name}&apos;s profile
      </button>
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-xl font-heading font-bold">{name}&apos;s appointments</h2>
        <Button
          onClick={() =>
            onNavigate(`/dashboard/parent/appointments/book?child=${adolescentId}`)
          }
        >
          + Book appointment
        </Button>
      </div>

      <select
        className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {isLoading ? (
        <Spinner />
      ) : appointments.length ? (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <ParentAppointmentCard
              key={appt.id}
              appointment={appt}
              onCancel={async (id) => {
                await cancel(id);
                refetch();
              }}
              isCancelling={cancelling}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted text-center py-8">No appointments yet.</p>
      )}
    </div>
  );
}
