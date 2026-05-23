import type { AppointmentPriority } from '@/types/provider';
import { PRIORITY_STYLES } from '@/types/provider';

export function PriorityBadge({ priority }: { priority: AppointmentPriority }) {
  const style = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.normal;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium capitalize" style={{ color: style.color }}>
      <span aria-hidden>{style.icon}</span>
      {priority}
    </span>
  );
}
