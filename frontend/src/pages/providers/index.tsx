import { useEffect, useState } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '@/components/providers/StatCard';
import { VerificationBanner } from '@/components/providers/VerificationBanner';
import { AppointmentStatusBadge } from '@/components/providers/AppointmentStatusBadge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useProviderDashboard } from '@/hooks/providers/useProviderDashboard';
import { useProviderProfile } from '@/hooks/providers/useProviderProfile';
import { providerApi } from '@/services/providerApi';
import type { NextAvailableSlot } from '@/types/provider';

interface ProviderDashboardPageProps {
  onNavigate: (path: string) => void;
}

export function ProviderDashboardPage({ onNavigate }: ProviderDashboardPageProps) {
  const { data: stats, isLoading, isError, refetch } = useProviderDashboard();
  const { profile } = useProviderProfile();
  const [nextSlot, setNextSlot] = useState<NextAvailableSlot | null>(null);

  useEffect(() => {
    if (profile?.is_verified) {
      providerApi.getNextAvailableSlot().then(setNextSlot);
    }
  }, [profile?.is_verified]);

  if (!profile?.is_verified && !isLoading) {
    return <VerificationBanner />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-xl">
        <p className="text-muted mb-4">Unable to load dashboard. Check your connection.</p>
        <Button type="button" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  const { appointment_stats, recent_appointments, monthly_trends, provider_info } = stats;
  const todayAppts = recent_appointments.filter((a) =>
    a.appointment_date ? isToday(parseISO(a.appointment_date)) : false,
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-[fadeInUp_0.15s_ease-out]">
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-heading font-bold text-ink">
          {greeting}, {provider_info.name.split(' ')[0] ? `Dr. ${provider_info.name.split(' ').slice(-1)[0]}` : provider_info.name}{' '}
          <span aria-hidden>🩺</span>
        </h1>
        <p className="text-sm text-muted mt-1">
          {provider_info.specialization}
          {provider_info.clinic_name ? ` · ${provider_info.clinic_name}` : ''}
          {provider_info.is_verified && (
            <span className="ml-2 text-sage font-semibold">Verified ✓</span>
          )}
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's appointments" value={appointment_stats.today} />
        <StatCard label="Pending" value={appointment_stats.pending} sublabel="Awaiting action" />
        <StatCard label="This week" value={appointment_stats.this_week} sublabel="Scheduled" />
        <StatCard
          label="Urgent"
          value={appointment_stats.urgent}
          highlight={appointment_stats.urgent > 0}
          sublabel="Priority"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-3">
          <h2 className="font-heading font-bold text-lg">Today&apos;s schedule</h2>
          {todayAppts.length === 0 ? (
            <p className="text-sm text-muted p-6 border border-dashed border-border rounded-xl">
              No appointments scheduled for today.
            </p>
          ) : (
            todayAppts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 border border-border rounded-xl p-4 bg-surface"
              >
                <span className="text-sm font-mono text-muted w-14 shrink-0">
                  {a.appointment_date
                    ? format(parseISO(a.appointment_date), 'HH:mm')
                    : '—'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink">{a.patient_name}</p>
                  <p className="text-xs text-muted truncate">{a.issue}</p>
                </div>
                <AppointmentStatusBadge status={a.status} />
              </div>
            ))
          )}
        </section>

        <aside className="space-y-4">
          <div className="border border-border rounded-xl p-4 bg-cream/30 space-y-2">
            <h3 className="font-semibold text-sm">Quick actions</h3>
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start text-sm"
              onClick={() => onNavigate('/providers/appointments/unassigned')}
            >
              📥 Unassigned queue
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => onNavigate('/providers/schedule')}
            >
              📅 Full schedule
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => onNavigate('/providers/patients')}
            >
              👤 Patient list
            </Button>
          </div>
          {nextSlot && (
            <div className="border border-border rounded-xl p-4 bg-surface text-sm">
              <p className="text-xs text-muted uppercase tracking-wide">Next available slot</p>
              <p className="font-semibold mt-1 text-ink">
                {nextSlot.day} {format(parseISO(nextSlot.date), 'MMM d')} at {nextSlot.time}
              </p>
            </div>
          )}
        </aside>
      </div>

      {monthly_trends.length > 0 && (
        <section>
          <h2 className="font-heading font-bold text-lg mb-3">Monthly trends</h2>
          <div className="h-64 border border-border rounded-xl p-4 bg-surface">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_appointments" name="Total" fill="var(--color-terracotta)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed_appointments" name="Completed" fill="var(--color-sage)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
