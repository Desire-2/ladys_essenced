import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CycleLogForm } from '@/components/forms/CycleLogForm';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { useChildCycleLogs, useCreateChildCycleLog } from '@/hooks/parent/useChildHealth';
import { PrivacyLockedPanel } from '@/components/parent/PrivacyLockedPanel';
import { getAccessState } from '@/lib/parentUtils';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import type { CycleLogFormData } from '@/lib/cycleLogsApi';

interface ChildCyclePageProps {
  adolescentId: number;
  onNavigate: (path: string) => void;
}

export function ChildCyclePage({ adolescentId, onNavigate }: ChildCyclePageProps) {
  const { data: dashboard } = useParentDashboard();
  const profile = dashboard?.children.find((c) => c.adolescent_id === adolescentId);
  const name = profile?.name ?? 'Family member';
  const access = profile ? getAccessState(profile) : 'full_access';
  const { data, isLoading, refetch } = useChildCycleLogs(adolescentId);
  const { mutateAsync, isPending } = useCreateChildCycleLog(adolescentId);
  const [logOpen, setLogOpen] = useState(false);

  if (access === 'privacy_locked') {
    return (
      <PrivacyLockedPanel
        childName={name}
        onBookAppointment={() =>
          onNavigate(`/dashboard/parent/appointments/book?child=${adolescentId}`)
        }
      />
    );
  }

  const handleLog = async (form: CycleLogFormData) => {
    await mutateAsync({
      start_date: form.start_date,
      end_date: form.end_date,
      flow_intensity: form.flow_level,
      symptoms: form.symptoms,
      notes: form.notes,
    });
    setLogOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="text-sm text-muted hover:text-ink"
        onClick={() => onNavigate(`/dashboard/parent/children/${adolescentId}`)}
      >
        ← {name}&apos;s profile
      </button>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading font-bold">{name}&apos;s cycle history</h2>
        <Button onClick={() => setLogOpen(true)}>+ Log new period</Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : data?.items.length ? (
        <ul className="space-y-3">
          {(data.items as Record<string, unknown>[]).map((log) => (
            <li
              key={String(log.id)}
              className="p-4 border border-border rounded-xl bg-surface"
            >
              <p className="font-semibold text-ink">
                {formatDate(String(log.start_date))}
                {log.end_date ? ` – ${formatDate(String(log.end_date))}` : ''}
              </p>
              {log.symptoms && (
                <p className="text-xs text-muted mt-1">{String(log.symptoms)}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted text-center py-8">No cycle logs yet. Log her first period.</p>
      )}

      <Modal isOpen={logOpen} onClose={() => setLogOpen(false)} title={`Log period for ${name}`}>
        <CycleLogForm onSubmit={handleLog} isLoading={isPending} submitLabel="Save for family member" />
      </Modal>
    </div>
  );
}
