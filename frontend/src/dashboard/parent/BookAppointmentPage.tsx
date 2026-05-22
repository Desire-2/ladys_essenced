import React, { useEffect, useState } from 'react';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { useBookAppointment } from '@/hooks/parent/useParentAppointments';
import { fetchHealthProviders, type HealthProviderSummary } from '@/lib/healthProvidersApi';
import { HealthProviderCard } from '@/components/features/HealthProviderCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getChildColor } from '@/lib/parentUtils';

interface BookAppointmentPageProps {
  onNavigate: (path: string) => void;
  preselectedChildId?: number;
}

export function BookAppointmentPage({ onNavigate, preselectedChildId }: BookAppointmentPageProps) {
  const { data } = useParentDashboard();
  const { mutateAsync: book, isPending } = useBookAppointment();

  const [step, setStep] = useState(0);
  const [childId, setChildId] = useState<number | null>(preselectedChildId ?? null);
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [telemedicine, setTelemedicine] = useState(false);
  const [providers, setProviders] = useState<HealthProviderSummary[]>([]);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    fetchHealthProviders().then(setProviders).catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    if (preselectedChildId) setChildId(preselectedChildId);
  }, [preselectedChildId]);

  const selectedChild = data?.children.find((c) => c.adolescent_id === childId);

  const submit = async () => {
    if (!childId || !providerId || !issue || !date || !consent) return;
    const appointment_date = new Date(`${date}T${time}:00`).toISOString();
    await book({
      provider_id: providerId,
      child_id: childId,
      appointment_date,
      issue,
      priority,
      notes: notes || undefined,
      is_telemedicine: telemedicine,
      appointment_type_id: 1,
    });
    onNavigate('/dashboard/parent/appointments');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        type="button"
        className="text-sm text-muted hover:text-ink"
        onClick={() => onNavigate('/dashboard/parent/appointments')}
      >
        ← Appointments
      </button>
      <h2 className="text-2xl font-heading font-bold">Book appointment</h2>
      <p className="text-xs text-muted">Step {step + 1} of 4</p>

      {step === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data?.children.map((child) => {
            const color = getChildColor(child.adolescent_id);
            const selected = childId === child.adolescent_id;
            return (
              <button
                key={child.adolescent_id}
                type="button"
                onClick={() => setChildId(child.adolescent_id)}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  selected ? 'border-terracotta bg-terracotta/5' : 'border-border'
                }`}
              >
                <span
                  className="inline-flex w-8 h-8 rounded-full items-center justify-center font-bold text-sm"
                  style={{ background: color.bg, color: color.text }}
                >
                  {child.name.charAt(0)}
                </span>
                <p className="font-semibold mt-2">{child.name}</p>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Health concern *
            <textarea
              className="mt-1 w-full border border-border rounded-lg p-3 min-h-[100px] bg-surface"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Priority
            <select
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 bg-surface"
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={telemedicine}
              onChange={(e) => setTelemedicine(e.target.checked)}
            />
            Telemedicine (remote) appointment
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {providers.map((p) => (
            <div
              key={p.id}
              className={providerId === p.id ? 'ring-2 ring-terracotta rounded-xl' : ''}
            >
              <HealthProviderCard
                provider={p}
                onSelect={() => setProviderId(p.id)}
              />
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Input label="Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Time *" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <label className="block text-sm font-medium">
            Notes for doctor (optional)
            <textarea
              className="mt-1 w-full border border-border rounded-lg p-3 bg-surface"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          {selectedChild && (
            <div className="text-sm bg-cream/80 p-4 rounded-xl border border-border">
              <p>For: {selectedChild.name}</p>
              <p className="text-muted mt-1">Concern: {issue}</p>
            </div>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            I consent to this appointment being booked on behalf of {selectedChild?.name}
          </label>
        </div>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button
            className="ml-auto"
            disabled={step === 0 && !childId}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            className="ml-auto"
            disabled={isPending || !consent || !providerId}
            onClick={submit}
          >
            {isPending ? 'Booking…' : 'Book appointment'}
          </Button>
        )}
      </div>
    </div>
  );
}
