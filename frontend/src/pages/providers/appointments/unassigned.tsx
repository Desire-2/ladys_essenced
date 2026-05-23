import { useState } from 'react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { ClaimAppointmentModal } from '@/components/providers/ClaimAppointmentModal';
import { PriorityBadge } from '@/components/providers/PriorityBadge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  useUnassignedAppointments,
  useClaimAppointment,
} from '@/hooks/providers/useProviderAppointments';
import type { UnassignedAppointment } from '@/types/provider';

interface ProviderUnassignedPageProps {
  onNavigate: (path: string) => void;
}

export function ProviderUnassignedPage({ onNavigate }: ProviderUnassignedPageProps) {
  const { data, isLoading, refetch } = useUnassignedAppointments();
  const { mutate: claim, isPending } = useClaimAppointment(refetch);
  const [selected, setSelected] = useState<UnassignedAppointment | null>(null);

  const list = data?.appointments ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sage/30 bg-sage/10 p-4 text-sm">
        <p className="font-semibold text-ink">📥 {list.length} appointments waiting for a provider</p>
        <p className="text-muted mt-1">
          These patients have no assigned doctor yet. Claiming notifies the patient immediately.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <p className="text-center text-muted py-12 border border-dashed border-border rounded-xl">
          No unassigned appointments right now.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((app) => (
            <article
              key={app.id}
              className="border border-border rounded-xl p-5 bg-surface flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <PriorityBadge priority={app.priority} />
                  <span className="text-[11px] text-muted">
                    Posted {formatDistanceToNow(parseISO(app.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="font-bold text-ink">{app.patient_name}</p>
                <p className="text-sm text-muted leading-relaxed">&ldquo;{app.issue}&rdquo;</p>
                {app.preferred_date && (
                  <p className="text-xs text-muted">
                    Preferred: {format(parseISO(app.preferred_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <Button type="button" onClick={() => setSelected(app)}>
                Claim this appointment →
              </Button>
            </article>
          ))}
        </div>
      )}

      <ClaimAppointmentModal
        appointment={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        isClaiming={isPending}
        onClaim={async () => {
          if (!selected) return;
          await claim(selected.id);
          onNavigate('/providers/appointments');
        }}
      />
    </div>
  );
}
