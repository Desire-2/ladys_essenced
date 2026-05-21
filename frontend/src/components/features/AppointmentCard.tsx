import React, { useState } from 'react';
import { Calendar, User, FileText, CheckCircle2, ShieldAlert, Ban, Clock, CheckCheck } from 'lucide-react';
import { Appointment } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDateTime } from '../../lib/utils';

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: (id: number) => void;
  showUser?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
  showUser = false,
}) => {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // Status mapping to badge color schemes
  const statusMap: Record<string, 'muted' | 'sage' | 'terracotta' | 'mauve'> = {
    pending: 'muted',
    confirmed: 'sage',
    completed: 'terracotta',
    cancelled: 'mauve',
  };

  // Border-l accent lines matching status
  const borderMap: Record<string, string> = {
    pending: 'border-l-amber-500/85',
    confirmed: 'border-l-[#4D7C0F]', // Sage/olive
    completed: 'border-l-emerald-600',
    cancelled: 'border-l-mauve',
  };

  // Full-body subtle background tints for structural distinction
  const bgTintMap: Record<string, string> = {
    pending: 'bg-amber-500/[0.035] border-amber-500/10 hover:bg-amber-500/[0.055]',
    confirmed: 'bg-[#4D7C0F]/[0.03] border-[#4D7C0F]/10 hover:bg-[#4D7C0F]/[0.05]',
    completed: 'bg-emerald-500/[0.025] border-emerald-500/10 hover:bg-emerald-500/[0.045]',
    cancelled: 'bg-mauve/[0.025] border-mauve/10 hover:bg-mauve/[0.045]',
  };

  // Distinct status icons for each possible phase
  const StatusIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    pending: Clock,
    confirmed: CheckCircle2,
    completed: CheckCheck,
    cancelled: Ban,
  };

  const statusKinya: Record<string, string> = {
    pending: 'Irageregereza',
    confirmed: 'Byamejejwe',
    completed: 'Byarangiye',
    cancelled: 'Byasheshwe',
  };

  const typeLabel = {
    checkup: 'Routine Checkup • Gupimisha isanzwe',
    consultation: 'Friendly Consultation • Kugira inama',
    vaccination: 'Immunization / Vaccine • Gukingirwa',
  };

  const StatusIcon = StatusIconMap[appointment.status] || Clock;

  return (
    <Card hoverable className={`font-sans border-l-4 ${borderMap[appointment.status] || 'border-l-muted'} ${bgTintMap[appointment.status] || ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Core details */}
        <div className="space-y-2 text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-heading font-extrabold text-base text-ink truncate">
              {typeLabel[appointment.appointment_type] || appointment.appointment_type}
            </h4>
            <Badge 
              variant={statusMap[appointment.status] || 'muted'}
              className="flex items-center gap-1 py-1 px-2.5 text-[10px] uppercase font-bold"
            >
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{appointment.status} • {statusKinya[appointment.status] || ''}</span>
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted font-medium">
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="w-4 h-4 text-terracotta flex-shrink-0" />
              <span className="truncate">{formatDateTime(appointment.scheduled_datetime)}</span>
            </div>
            
            {(appointment.health_provider_name || showUser) && (
              <div className="flex items-center gap-1.5 min-w-0">
                <User className="w-4 h-4 text-sage flex-shrink-0" />
                <span className="truncate">
                  {showUser && appointment.user_name ? `Patient: ${appointment.user_name}` : `Provider: ${appointment.health_provider_name}`}
                </span>
              </div>
            )}
          </div>

          {appointment.notes && (
            <div className="p-2.5 bg-cream/40 rounded-lg border border-border flex items-start gap-2 mt-1">
              <FileText className="w-3.5 h-3.5 text-muted hover:text-terracotta flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted/90 leading-relaxed font-sans">{appointment.notes}</p>
            </div>
          )}
        </div>

        {/* Action button slots */}
        {onCancel && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
          <div className="flex-shrink-0 w-full md:w-auto text-right md:-mt-1">
            {!showConfirmCancel ? (
              <Button
                variant="ghost"
                onClick={() => setShowConfirmCancel(true)}
                className="text-xs text-mauve hover:bg-mauve/10 cursor-pointer py-1.5 px-3 border border-mauve/20"
              >
                <Ban className="w-3.5 h-3.5 mr-1" /> Request Cancel
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-mauve font-bold">Confirm cancel?</span>
                <Button
                  variant="danger"
                  onClick={() => {
                    onCancel(appointment.id);
                    setShowConfirmCancel(false);
                  }}
                  className="text-[10px] py-1 px-2 cursor-pointer shrink-0"
                >
                  Yes
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmCancel(false)}
                  className="text-[10px] py-1 px-2 cursor-pointer border border-border bg-surface text-ink shrink-0"
                >
                  No
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
export default AppointmentCard;
