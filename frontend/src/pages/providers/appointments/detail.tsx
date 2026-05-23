import { format, parseISO } from 'date-fns';
import { AppointmentStatusBadge } from '@/components/providers/AppointmentStatusBadge';
import { PriorityBadge } from '@/components/providers/PriorityBadge';
import { ClinicalNotesEditor } from '@/components/providers/ClinicalNotesEditor';
import { UpdateAppointmentModal } from '@/components/providers/UpdateAppointmentModal';
import { VerificationBanner } from '@/components/providers/VerificationBanner';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  useProviderAppointment,
  useUpdateAppointment,
} from '@/hooks/providers/useProviderAppointments';
import { useProviderProfile } from '@/hooks/providers/useProviderProfile';
import { useState } from 'react';

interface ProviderAppointmentDetailPageProps {
  appointmentId: number;
  onNavigate: (path: string) => void;
}

export function ProviderAppointmentDetailPage({
  appointmentId,
  onNavigate,
}: ProviderAppointmentDetailPageProps) {
  const { profile } = useProviderProfile();
  const { data: appt, isLoading, isError, refetch } = useProviderAppointment(appointmentId);
  const { mutate: updateAppt, isPending } = useUpdateAppointment(refetch);
  const [modalOpen, setModalOpen] = useState(false);

  if (!profile?.is_verified) {
    return <VerificationBanner />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (isError || !appt) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Appointment not found.</p>
        <Button type="button" className="mt-4" onClick={() => onNavigate('/providers/appointments')}>
          Back to appointments
        </Button>
      </div>
    );
  }

  const when = appt.appointment_date
    ? format(parseISO(appt.appointment_date), "MMM d, yyyy 'at' h:mm a")
    : '—';

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="text-sm text-muted hover:text-ink"
        onClick={() => onNavigate('/providers/appointments')}
      >
        ← Back to appointments
      </button>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4 border border-border rounded-xl p-5 bg-surface">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-heading font-bold">#{appt.id}</h1>
            <AppointmentStatusBadge status={appt.status} />
          </div>
          <p className="text-muted">{when}</p>
          <p className="text-sm">{appt.is_telemedicine ? '🖥 Telemedicine' : '🏥 In person'}</p>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Concern</p>
            <p className="text-sm mt-1">{appt.issue}</p>
          </div>
          {appt.notes && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase">Patient notes</p>
              <p className="text-sm mt-1 italic text-muted">{appt.notes}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted uppercase mb-1">Priority</p>
            <PriorityBadge priority={appt.priority} />
          </div>
        </div>

        <aside className="border border-border rounded-xl p-5 bg-cream/20 space-y-3 text-sm">
          <h2 className="font-semibold text-xs uppercase text-muted">Patient</h2>
          <p className="font-bold text-lg text-ink">{appt.patient_name}</p>
          {appt.patient_phone && <p className="text-muted">{appt.patient_phone}</p>}
          {appt.patient_email && <p className="text-muted">{appt.patient_email}</p>}
          {appt.booked_by_name && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted uppercase">Booked by</p>
              <p>{appt.booked_by_name}</p>
            </div>
          )}
        </aside>
      </div>

      <section className="border border-border rounded-xl p-5 bg-surface">
        <h2 className="font-heading font-bold mb-3">Clinical notes</h2>
        <ClinicalNotesEditor
          initialNotes={appt.provider_notes || ''}
          onSave={(notes) => updateAppt({ id: appt.id, payload: { provider_notes: notes } })}
        />
      </section>

      <section className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setModalOpen(true)}>
          Update status / reschedule
        </Button>
      </section>

      <UpdateAppointmentModal
        appointment={appt}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isSaving={isPending}
        onSave={async (payload) => updateAppt({ id: appt.id, payload })}
      />
    </div>
  );
}
