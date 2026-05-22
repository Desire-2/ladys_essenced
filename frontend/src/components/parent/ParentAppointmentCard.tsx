import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ParentAppointment } from '@/types/parent';
import { formatDateTime } from '@/lib/utils';
import { canCancelAppointment } from '@/lib/parentUtils';

const STATUS_VARIANT: Record<string, 'default' | 'sage' | 'mauve'> = {
  pending: 'default',
  confirmed: 'sage',
  completed: 'mauve',
  cancelled: 'default',
};

interface ParentAppointmentCardProps {
  appointment: ParentAppointment;
  childName?: string;
  onCancel?: (id: number) => void;
  isCancelling?: boolean;
}

export function ParentAppointmentCard({
  appointment,
  childName,
  onCancel,
  isCancelling,
}: ParentAppointmentCardProps) {
  const cancellable = canCancelAppointment(appointment.appointment_date);

  return (
    <Card
      className={`p-4 ${appointment.status === 'cancelled' ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {childName && (
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">
              For: {childName}
            </p>
          )}
          <p className="font-heading font-bold text-ink mt-1">
            {formatDateTime(appointment.appointment_date)}
          </p>
          {appointment.provider_name && (
            <p className="text-sm text-muted mt-0.5">
              {appointment.provider_name}
              {appointment.provider_specialization
                ? ` · ${appointment.provider_specialization}`
                : ''}
            </p>
          )}
          <p className="text-sm text-ink mt-2">{appointment.issue}</p>
        </div>
        <Badge variant={STATUS_VARIANT[appointment.status] ?? 'default'}>
          {appointment.status}
        </Badge>
      </div>
      {onCancel && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            className="text-xs"
            disabled={!cancellable || isCancelling}
            onClick={() => onCancel(appointment.id)}
            title={
              !cancellable
                ? 'Appointments must be cancelled at least 24 hours in advance'
                : undefined
            }
          >
            {isCancelling ? 'Cancelling…' : 'Cancel'}
          </Button>
        </div>
      )}
    </Card>
  );
}
