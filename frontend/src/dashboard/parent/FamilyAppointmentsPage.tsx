import React, { useState } from 'react';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { useChildAppointments, useCancelAppointment } from '@/hooks/parent/useParentAppointments';
import { ParentAppointmentCard } from '@/components/parent/ParentAppointmentCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface FamilyAppointmentsPageProps {
  onNavigate: (path: string) => void;
}

function ChildAppointmentsSection({
  adolescentId,
  childName,
  onCancel,
  cancelling,
}: {
  adolescentId: number;
  childName: string;
  onCancel: (id: number) => Promise<void>;
  cancelling: boolean;
}) {
  const { appointments, isLoading } = useChildAppointments(adolescentId);
  if (isLoading) return <Spinner />;
  if (!appointments.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-heading font-bold text-ink border-b border-border pb-2">
        {childName}
      </h3>
      {appointments.map((appt) => (
        <ParentAppointmentCard
          key={appt.id}
          appointment={appt}
          childName={childName}
          onCancel={onCancel}
          isCancelling={cancelling}
        />
      ))}
    </div>
  );
}

export function FamilyAppointmentsPage({ onNavigate }: FamilyAppointmentsPageProps) {
  const { data, isLoading } = useParentDashboard();
  const { mutateAsync: cancel, isPending: cancelling } = useCancelAppointment();
  const [filterChild, setFilterChild] = useState<number | ''>('');

  const children = filterChild
    ? data?.children.filter((c) => c.adolescent_id === filterChild) ?? []
    : data?.children ?? [];

  const handleCancel = async (id: number) => {
    await cancel(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-2xl font-heading font-bold text-ink">Family appointments</h2>
        <Button onClick={() => onNavigate('/dashboard/parent/appointments/book')}>
          + Book new appointment
        </Button>
      </div>

      <select
        className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        value={filterChild === '' ? '' : String(filterChild)}
        onChange={(e) =>
          setFilterChild(e.target.value ? Number(e.target.value) : '')
        }
      >
        <option value="">All children</option>
        {data?.children.map((c) => (
          <option key={c.adolescent_id} value={c.adolescent_id}>
            {c.name}
          </option>
        ))}
      </select>

      {isLoading ? (
        <Spinner />
      ) : children.length ? (
        <div className="space-y-8">
          {children.map((c) => (
            <ChildAppointmentsSection
              key={c.adolescent_id}
              adolescentId={c.adolescent_id}
              childName={c.name}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted text-center py-12">No appointments scheduled.</p>
      )}
    </div>
  );
}
