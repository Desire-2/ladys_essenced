import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { VerificationBanner } from '@/components/providers/VerificationBanner';
import { AppointmentStatusBadge } from '@/components/providers/AppointmentStatusBadge';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { providerApi } from '@/services/providerApi';
import { useProviderProfile } from '@/hooks/providers/useProviderProfile';
import type { Patient, ProviderAppointment } from '@/types/provider';

interface ProviderPatientsPageProps {
  onNavigate: (path: string) => void;
}

export function ProviderPatientsPage({ onNavigate }: ProviderPatientsPageProps) {
  const { profile } = useProviderProfile();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [history, setHistory] = useState<ProviderAppointment[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    providerApi
      .getPatients(search)
      .then((res) => {
        if (!cancelled) setPatients(res.patients);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  useEffect(() => {
    if (!selected) return;
    providerApi
      .getAppointments({ patient_search: selected.name, per_page: 50 })
      .then((res) => setHistory(res.appointments));
  }, [selected]);

  if (!profile?.is_verified) {
    return <VerificationBanner />;
  }

  const initials = (name: string) =>
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-4">
        <Input
          placeholder="Search by name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md text-sm"
        />
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : patients.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center border border-dashed border-border rounded-xl">
            No patients found.
          </p>
        ) : (
          <div className="space-y-2">
            {patients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className={`w-full text-left border rounded-xl p-4 flex gap-3 items-center transition-colors ${
                  selected?.id === p.id ? 'border-sage bg-sage/10' : 'border-border bg-surface hover:bg-cream/40'
                }`}
              >
                <span className="w-10 h-10 rounded-full bg-mauve/15 text-mauve font-bold text-sm flex items-center justify-center shrink-0">
                  {initials(p.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-muted">{p.phone_number || p.email}</p>
                </div>
                <div className="text-right text-xs text-muted">
                  <p>{p.total_appointments} appointments</p>
                  {p.last_appointment && (
                    <p>Last: {format(parseISO(p.last_appointment), 'MMM d, yyyy')}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <aside className="lg:w-80 border border-border rounded-xl p-4 bg-cream/20 h-fit sticky top-4">
          <h2 className="font-heading font-bold text-lg">{selected.name}</h2>
          <p className="text-sm text-muted mt-1">{selected.email}</p>
          <p className="text-sm text-muted">{selected.phone_number}</p>
          <h3 className="text-xs uppercase text-muted font-semibold mt-4 mb-2">Appointment history</h3>
          <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
            {history.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="w-full text-left hover:underline"
                  onClick={() => onNavigate(`/providers/appointments/${a.id}`)}
                >
                  {a.appointment_date
                    ? format(parseISO(a.appointment_date), 'MMM d, yyyy')
                    : '—'}{' '}
                  — {a.issue?.slice(0, 30)}
                </button>
                <AppointmentStatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
