import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CycleLogForm } from '@/components/forms/CycleLogForm';
import { WellnessTrends } from '@/components/features/WellnessTrends';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { useChildCycleLogs, useCreateChildCycleLog } from '@/hooks/parent/useChildHealth';
import { PrivacyLockedPanel } from '@/components/parent/PrivacyLockedPanel';
import { getAccessState } from '@/lib/parentUtils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { ParentCyclePhaseInsights } from '@/components/features/ParentCyclePhaseInsights';
import type { CycleLogFormData } from '@/lib/cycleLogsApi';
import type { CycleLogWellness } from '@/components/features/WellnessTrends';

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

  // Transform child cycle logs into WellnessTrends-compatible format
  const wellnessLogs: CycleLogWellness[] = useMemo(() => {
    if (!data?.items?.length) return [];
    return (data.items as Record<string, unknown>[]).map((log) => ({
      id: Number(log.id),
      start_date: String(log.start_date ?? ''),
      end_date: log.end_date ? String(log.end_date) : null,
      end_date_estimated: log.end_date_estimated ? String(log.end_date_estimated) : null,
      end_date_is_inferred: Boolean(log.end_date_is_inferred),
      mood: log.mood ? String(log.mood) : null,
      energy_level: log.energy_level ? String(log.energy_level) : null,
      sleep_quality: log.sleep_quality ? String(log.sleep_quality) : null,
      stress_level: log.stress_level ? String(log.stress_level) : null,
      exercise_activities: log.exercise_activities ? String(log.exercise_activities) : null,
      symptoms: log.symptoms ? String(log.symptoms) : null,
      flow_intensity: log.flow_intensity ? String(log.flow_intensity) : null,
    }));
  }, [data]);

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
        <h2 className="text-xl font-heading font-bold">{name}&apos;s cycle &amp; health</h2>
        <Button onClick={() => setLogOpen(true)}>+ Log new period</Button>
      </div>

      {/* ── Cycle Phase Insights ── */}
      <div className="p-5 border border-border rounded-xl bg-surface">
        <ParentCyclePhaseInsights adolescentId={adolescentId} childName={name} childUserId={profile?.user_id} />
      </div>

      {/* ── Wellness Trends Widget ── */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-muted mb-3">
          Wellness Trends
        </h3>
        <WellnessTrends logs={wellnessLogs} isLoading={isLoading} />
      </div>

      {/* ── Cycle Log History ── */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-muted mb-3">
          Cycle History
        </h3>

        {isLoading ? (
          <Spinner />
        ) : data?.items.length ? (
          <div className="space-y-2">
            {(data.items as Record<string, unknown>[]).map((log) => (
              <Card key={String(log.id)} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink">
                      {formatDate(String(log.start_date))}
                      {log.end_date
                        ? ` – ${formatDate(String(log.end_date))}`
                        : log.end_date_estimated
                          ? ` – ${formatDate(String(log.end_date_estimated))}`
                          : ''}
                      {log.end_date_is_inferred && (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1a6 6 0 1 0 0 12A6 6 0 0 0 8 1zM7.5 3.5a.5.5 0 0 1 1 0v4a.5.5 0 0 1-1 0v-4zm0 6a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0z"/>
                          </svg>
                          Inferred
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {log.flow_intensity && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-terracotta/5 text-terracotta capitalize">
                          {String(log.flow_intensity)}
                        </span>
                      )}
                      {log.mood && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#7A4F6D]/5 text-[#7A4F6D] capitalize">
                          Mood: {String(log.mood).replace('_', ' ')}
                        </span>
                      )}
                      {log.sleep_quality && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8FAF8A]/10 text-[#5D7A5D] capitalize">
                          Sleep: {String(log.sleep_quality)}
                        </span>
                      )}
                      {log.stress_level && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#A87C6A]/10 text-[#7A5A4A] capitalize">
                          Stress: {String(log.stress_level).replace('_', ' ')}
                        </span>
                      )}
                      {log.energy_level && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C4785A]/10 text-[#A0583A] capitalize">
                          Energy: {String(log.energy_level)}
                        </span>
                      )}
                    </div>
                    {log.symptoms && (
                      <p className="text-xs text-muted mt-1.5">{String(log.symptoms)}</p>
                    )}
                  </div>
                  {log.created_at && (
                    <span className="text-[9px] text-muted font-medium shrink-0">
                      {new Date(String(log.created_at)).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted text-center py-8 bg-white border border-border rounded-xl">
            No cycle logs yet. Log {name}&apos;s first period to start tracking wellness trends.
          </p>
        )}
      </div>

      <Modal isOpen={logOpen} onClose={() => setLogOpen(false)} title={`Log period for ${name}`}>
        <CycleLogForm onSubmit={handleLog} isLoading={isPending} submitLabel="Save for family member" />
      </Modal>
    </div>
  );
}
