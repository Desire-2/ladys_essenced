import { format, parseISO } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { UnassignedAppointment } from '@/types/provider';

interface ClaimAppointmentModalProps {
  appointment: UnassignedAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => Promise<void>;
  isClaiming?: boolean;
}

export function ClaimAppointmentModal({
  appointment,
  isOpen,
  onClose,
  onClaim,
  isClaiming,
}: ClaimAppointmentModalProps) {
  if (!appointment) return null;

  const preferred = appointment.preferred_date
    ? format(parseISO(appointment.preferred_date), 'MMM d, yyyy')
    : 'Flexible';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Claim appointment">
      <div className="space-y-3 text-sm">
        <p>
          <span className="text-muted">Patient:</span>{' '}
          <strong className="text-ink">{appointment.patient_name}</strong>
        </p>
        <p>
          <span className="text-muted">Concern:</span> {appointment.issue}
        </p>
        <p>
          <span className="text-muted">Preferred date:</span> {preferred}
        </p>
        <ul className="text-xs text-muted space-y-1 border-t border-border pt-3 mt-3">
          <li>✓ You become the assigned provider</li>
          <li>✓ The patient is notified immediately</li>
          <li>✓ The appointment moves to your appointments list</li>
        </ul>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={() => onClaim().then(onClose)} disabled={isClaiming}>
          Claim appointment →
        </Button>
      </div>
    </Modal>
  );
}
