import React from 'react';
import { addDays, format } from 'date-fns';
import type { ScheduleDay, ScheduleAppointment } from '@/types/provider';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { STATUS_STYLES } from '@/types/provider';

const SLOT_HEIGHT = 28;
const DAY_START = 8;

function timeToPixels(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const minutesFromStart = (h - DAY_START) * 60 + m;
  return (minutesFromStart / 30) * SLOT_HEIGHT;
}

interface WeekViewProps {
  weekStart: Date;
  schedule: ScheduleDay;
  onSelectAppointment: (id: number) => void;
}

export function WeekView({ weekStart, schedule, onSelectAppointment }: WeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="hidden md:grid grid-cols-8 gap-2">
      <div />
      {days.map((d) => (
        <div key={d.toISOString()} className="text-center pb-2 border-b border-border">
          <p className="text-[10px] uppercase text-muted">{format(d, 'EEE')}</p>
          <p className="font-semibold">{format(d, 'd')}</p>
        </div>
      ))}
      <div className="text-[10px] text-muted space-y-[52px] pt-2">
        {['08:00', '10:00', '12:00', '14:00', '16:00'].map((t) => (
          <div key={t}>{t}</div>
        ))}
      </div>
      {days.map((d) => {
        const key = format(d, 'yyyy-MM-dd');
        const appts = (schedule[key] || []) as ScheduleAppointment[];
        return (
          <div
            key={key}
            className="relative min-h-[320px] border border-border rounded-lg bg-cream/20"
          >
            {appts.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-[10px] text-muted p-2 text-center">
                —
              </p>
            )}
            {appts.map((a) => {
              const style = STATUS_STYLES[a.status];
              const top = timeToPixels(a.time);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectAppointment(a.id)}
                  className="absolute left-1 right-1 rounded px-1.5 py-1 text-[10px] font-medium text-left border"
                  style={{
                    top: `${Math.max(0, top)}px`,
                    minHeight: '44px',
                    backgroundColor: style.bg,
                    color: style.text,
                  }}
                >
                  <span className="block font-semibold truncate">{a.patient_name}</span>
                  <span>{a.time}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export function WeekViewMobileList({
  weekStart,
  schedule,
  onSelectAppointment,
}: WeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="md:hidden space-y-4">
      {days.map((d) => {
        const key = format(d, 'yyyy-MM-dd');
        const appts = schedule[key] || [];
        return (
          <div key={key} className="border border-border rounded-xl p-3 bg-surface">
            <p className="font-semibold text-sm mb-2">{format(d, 'EEEE, MMM d')}</p>
            {appts.length === 0 ? (
              <p className="text-xs text-muted">No appointments scheduled</p>
            ) : (
              appts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="w-full text-left py-2 border-b border-border last:border-0 flex flex-wrap items-center gap-2"
                  onClick={() => onSelectAppointment(a.id)}
                >
                  <span className="text-sm font-medium">{a.patient_name}</span>
                  <span className="text-xs text-muted">{a.time}</span>
                  <AppointmentStatusBadge status={a.status} />
                </button>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
