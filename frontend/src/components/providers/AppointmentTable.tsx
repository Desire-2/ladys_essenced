import { format, parseISO } from 'date-fns';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { PriorityBadge } from './PriorityBadge';
import type { ProviderAppointment } from '@/types/provider';
import { Button } from '@/components/ui/Button';

interface AppointmentTableProps {
  appointments: ProviderAppointment[];
  onView: (id: number) => void;
  onAction: (appointment: ProviderAppointment) => void;
}

export function AppointmentTable({ appointments, onView, onAction }: AppointmentTableProps) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-muted text-sm border border-dashed border-border rounded-xl">
        No appointments match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm text-left">
        <thead className="bg-cream/60 text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3">Patient</th>
            <th className="px-4 py-3">Concern</th>
            <th className="px-4 py-3">Date / time</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {appointments.map((appt) => (
            <tr key={appt.id} className="hover:bg-cream/30">
              <td className="px-4 py-3">
                <p className="font-semibold text-ink">{appt.patient_name}</p>
                {appt.patient_phone && (
                  <p className="text-[11px] text-muted">{appt.patient_phone}</p>
                )}
              </td>
              <td className="px-4 py-3 text-muted max-w-[200px] truncate" title={appt.issue}>
                {appt.issue?.slice(0, 40)}
                {(appt.issue?.length ?? 0) > 40 ? '…' : ''}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {appt.appointment_date
                  ? format(parseISO(appt.appointment_date), "MMM d, yyyy 'at' h:mm a")
                  : '—'}
              </td>
              <td className="px-4 py-3 text-xs">
                {appt.is_telemedicine ? '🖥 Remote' : '🏥 In person'}
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={appt.priority} />
              </td>
              <td className="px-4 py-3">
                <AppointmentStatusBadge status={appt.status} />
              </td>
              <td className="px-4 py-3 space-x-1">
                <Button type="button" variant="ghost" className="text-xs py-1" onClick={() => onView(appt.id)}>
                  View
                </Button>
                <Button type="button" variant="secondary" className="text-xs py-1" onClick={() => onAction(appt)}>
                  Update
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
