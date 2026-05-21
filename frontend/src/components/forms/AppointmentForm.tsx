import React, { useState, useEffect } from 'react';
import { Calendar, Heart, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { AppointmentFormData } from '../../lib/appointmentsApi';
import type { HealthProviderSummary } from '../../lib/healthProvidersApi';
import { HealthProviderCard } from '../features/HealthProviderCard';

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormData) => void;
  isLoading?: boolean;
  initialType?: 'checkup' | 'consultation' | 'vaccination';
  initialDate?: string;
  providers?: HealthProviderSummary[];
  initialProviderId?: number;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onSubmit,
  isLoading,
  initialType,
  initialDate,
  providers = [],
  initialProviderId,
}) => {
  const [type, setType] = useState<'checkup' | 'consultation' | 'vaccination'>(initialType || 'consultation');
  const [selectedProviderId, setSelectedProviderId] = useState<number | undefined>(initialProviderId);
  
  // Set default separate date and time values (e.g., 2 days in the future, 10:00 AM)
  const getInitialDate = () => {
    if (initialDate) return initialDate;
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const getInitialTime = () => {
    return '10:00';
  };

  const [date, setDate] = useState(getInitialDate());
  const [time, setTime] = useState(getInitialTime());
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  useEffect(() => {
    if (providers.length === 0) {
      setSelectedProviderId(undefined);
      return;
    }
    if (initialProviderId && providers.some((p) => p.id === initialProviderId)) {
      setSelectedProviderId(initialProviderId);
      return;
    }
    if (!selectedProviderId || !providers.some((p) => p.id === selectedProviderId)) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, initialProviderId]);

  const appointmentTypes = [
    { value: 'checkup' as const, label: 'Routine Checkup', sub: 'General physical & cycle checks' },
    {
      value: 'consultation' as const,
      label: 'Friendly Consultation',
      sub: selectedProvider
        ? `Confidential visit with ${selectedProvider.name}`
        : 'Speak with a verified clinician in confidence',
    },
    { value: 'vaccination' as const, label: 'HPV Vaccination', sub: 'Immunization dose administration' },
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!date) {
      setErrorMsg('Please select a booking date.');
      return;
    }

    if (!time) {
      setErrorMsg('Please select a booking time.');
      return;
    }

    if (providers.length > 0 && !selectedProviderId) {
      setErrorMsg('Please select a health provider.');
      return;
    }

    const scheduledDatetime = new Date(`${date}T${time}`).toISOString();

    if (new Date(scheduledDatetime) < new Date()) {
      setErrorMsg('Appointment date and time cannot be in the past.');
      return;
    }

    onSubmit({
      appointment_type: type,
      scheduled_datetime: scheduledDatetime,
      notes: notes || undefined,
      provider_id: selectedProviderId,
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5 text-left font-sans select-none">
      
      {/* Prominent Selected Service Banner */}
      <div className="p-4 bg-[#7A4F6D]/5 border border-[#7A4F6D]/15 rounded-[16px] text-left select-none space-y-1">
        <span className="text-[10px] uppercase font-bold text-[#7A4F6D] tracking-wider block">Service Chosen • Serivisi Ihisemo</span>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#C4785A]/10 text-[#C4785A]">
            <Heart className="w-5 h-5 fill-[#C4785A]/20" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-ink leading-tight">
              {type === 'checkup' && 'Routine Checkup • Gupimwa busanzwe'}
              {type === 'consultation' && 'Friendly Consultation • Inama y’ubuzima'}
              {type === 'vaccination' && 'HPV Vaccination • Gukingirwa mu Rwanda'}
            </h4>
            <p className="text-[11px] text-muted font-semibold mt-0.5">
              {type === 'checkup' && 'General physical & cycle health tracking checks'}
              {type === 'consultation' && (
                selectedProvider
                  ? `Confidential session with ${selectedProvider.name}`
                  : 'Speak with a verified clinician in professional confidence'
              )}
              {type === 'vaccination' && 'Immunization dose administration & Rwanda HPV guidelines'}
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-mauve/10 text-mauve rounded-xl text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {providers.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Choose clinician (Umuganga) *
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {providers.map((provider) => (
              <HealthProviderCard
                key={provider.id}
                provider={provider}
                compact
                selected={selectedProviderId === provider.id}
                onSelect={setSelectedProviderId}
              />
            ))}
          </div>
        </div>
      )}

      {providers.length === 0 && (
        <div className="p-3 rounded-xl border border-border bg-cream/30 text-xs text-muted">
          No verified clinicians are listed yet. You can still submit a request — a provider will be assigned when available.
        </div>
      )}

      {/* Appointment Type Selectors & Fields */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Appointment Type * (Ubwoko bwa Serivisi)
        </label>
        
        {/* Native select drop-down for clear representation */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'checkup' | 'consultation' | 'vaccination')}
          className="block w-full h-[48px] rounded-[16px] border border-border bg-surface px-4 text-sm font-semibold text-ink focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:outline-none mb-3"
        >
          <option value="consultation">Friendly Consultation • Inama y’ubuzima</option>
          <option value="checkup">Routine Checkup • Gupimwa busanzwe</option>
          <option value="vaccination">HPV Vaccination • Gukingirwa mu Rwanda</option>
        </select>

        {/* Dynamic button blocks for detailed card options */}
        <div className="space-y-2">
          {appointmentTypes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setType(item.value)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                type === item.value
                  ? 'border-terracotta bg-terracotta/5 text-ink'
                  : 'border-border bg-surface text-muted hover:border-muted'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-ink">{item.label}</p>
                <p className="text-[10px] text-muted font-medium mt-0.5">{item.sub}</p>
              </div>
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                type === item.value ? 'border-terracotta bg-terracotta' : 'border-border'
              }`}>
                {type === item.value && <span className="w-1.5 h-1.5 rounded-full bg-surface" />}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid for separate Date and Time fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Input
            type="date"
            label="Appointment Date * (Umunsi)"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            icon={<Calendar className="w-4 h-4" />}
            required
          />
        </div>
        <div className="space-y-1">
          <Input
            type="time"
            label="Appointment Time * (Igihe)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="text-[10px] text-muted -mt-3 select-none">
        Kigali Standard Time (Central Africa Time Zone)
      </div>

      {/* Additional note info */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Optional Message for Healthcare Staff
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Experiencing mild cramps for 3 days. Need advice on home care remedies. (Kuvuga ibyo wifuza kuganira)"
          className="block w-full rounded-md border border-border bg-surface p-3 text-sm text-ink transition-all focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:outline-none"
        />
      </div>

      {/* Confirm button */}
      <div className="pt-2">
        <Button type="submit" isLoading={isLoading} className="w-full h-11">
          Complete Appointment Booking • Komeza
        </Button>
      </div>

    </form>
  );
};
export default AppointmentForm;
