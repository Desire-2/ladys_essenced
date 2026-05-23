import type { AppointmentStatus } from '@/types/provider';
import { STATUS_STYLES } from '@/types/provider';

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}
