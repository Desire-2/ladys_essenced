import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { AppointmentStatus, ProviderAppointment } from '@/types/provider';

const STATUS_ACTIONS: Partial<Record<AppointmentStatus, { label: string; status: AppointmentStatus }[]>> = {
  pending: [
    { label: 'Confirm', status: 'confirmed' },
    { label: 'Reschedule', status: 'rescheduled' },
    { label: 'Cancel', status: 'cancelled' },
  ],
  confirmed: [
    { label: 'Complete', status: 'completed' },
    { label: 'No show', status: 'no_show' },
    { label: 'Reschedule', status: 'rescheduled' },
  ],
  rescheduled: [
    { label: 'Confirm', status: 'confirmed' },
    { label: 'Cancel', status: 'cancelled' },
  ],
};

interface UpdateAppointmentModalProps {
  appointment: ProviderAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    status?: AppointmentStatus;
    appointment_date?: string;
    provider_notes?: string;
  }) => Promise<void>;
  isSaving?: boolean;
}

export function UpdateAppointmentModal({
  appointment,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: UpdateAppointmentModalProps) {
  const [notes, setNotes] = useState('');
  const [rescheduleAt, setRescheduleAt] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);

  if (!appointment) return null;

  const when = appointment.appointment_date
    ? format(parseISO(appointment.appointment_date), "MMM d, yyyy 'at' h:mm a")
    : '—';

  const actions = STATUS_ACTIONS[appointment.status] ?? [];

  const handleStatus = async (status: AppointmentStatus) => {
    if (status === 'rescheduled') {
      setShowReschedule(true);
      return;
    }
    await onSave({
      status,
      provider_notes: notes || appointment.provider_notes,
    });
    onClose();
  };

  const handleRescheduleSave = async () => {
    if (!rescheduleAt) return;
    await onSave({
      status: 'rescheduled',
      appointment_date: new Date(rescheduleAt).toISOString(),
      provider_notes: notes || appointment.provider_notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update: ${appointment.patient_name}'s appointment`}
    >
      <p className="text-sm text-muted mb-4">{when}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {actions.map((a) => (
          <Button key={a.status} type="button" variant="secondary" onClick={() => handleStatus(a.status)}>
            {a.label}
          </Button>
        ))}
      </div>
      {(showReschedule || appointment.status === 'rescheduled') && (
        <div className="mb-4">
          <label className="text-xs font-semibold text-muted block mb-1">Reschedule to</label>
          <input
            type="datetime-local"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            value={rescheduleAt}
            onChange={(e) => setRescheduleAt(e.target.value)}
          />
        </div>
      )}
      <label className="text-xs font-semibold text-muted block mb-1">Clinical notes</label>
      <textarea
        className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[100px] mb-1"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={appointment.provider_notes || 'Observations, diagnosis, follow-up…'}
      />
      <p className="text-[10px] text-muted mb-4">
        Markdown supported. Patient will not see these notes.
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        {showReschedule ? (
          <Button type="button" onClick={handleRescheduleSave} disabled={isSaving || !rescheduleAt}>
            Save changes
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() =>
              onSave({ provider_notes: notes }).then(onClose)
            }
            disabled={isSaving}
          >
            Save notes
          </Button>
        )}
      </div>
    </Modal>
  );
}
