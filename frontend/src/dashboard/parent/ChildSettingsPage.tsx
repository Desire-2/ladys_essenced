import React, { useState } from 'react';
import { useChild, useUpdateChild, useDeleteChild, useGrantIndependence, useUpdateChildPhone } from '@/hooks/parent/useChildren';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { GrantIndependenceModal } from '@/components/parent/GrantIndependenceModal';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface ChildSettingsPageProps {
  adolescentId: number;
  onNavigate: (path: string) => void;
}

export function ChildSettingsPage({ adolescentId, onNavigate }: ChildSettingsPageProps) {
  const { child, refetch } = useChild(adolescentId);
  const { refetch: refetchDashboard } = useParentDashboard();
  const { mutateAsync: update, isPending } = useUpdateChild(adolescentId);
  const { mutateAsync: remove, isPending: removing } = useDeleteChild();
  const { mutateAsync: grant, isPending: granting } = useGrantIndependence(adolescentId);
  const { mutateAsync: patchPhone, isPending: patchingPhone } = useUpdateChildPhone(adolescentId);

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [independenceOpen, setIndependenceOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  React.useEffect(() => {
    if (child) {
      setName(child.name ?? '');
      setDob(child.date_of_birth?.split('T')[0] ?? '');
      setPhone(child.phone_number ?? '');
    }
  }, [child]);

  const handleSave = async () => {
    await update({ name, date_of_birth: dob || undefined });
    refetch();
    refetchDashboard();
  };

  const handlePhone = async () => {
    if (!phone.trim()) return;
    await patchPhone(phone.trim());
    refetch();
    refetchDashboard();
  };

  return (
    <div className="space-y-6 max-w-lg">
      <button
        type="button"
        className="text-sm text-muted hover:text-ink"
        onClick={() => onNavigate(`/dashboard/parent/children/${adolescentId}`)}
      >
        ← Back to profile
      </button>

      <Card className="p-5 space-y-4">
        <h3 className="font-heading font-bold text-ink">Profile</h3>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        <Button onClick={handleSave} disabled={isPending}>
          Save profile
        </Button>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-heading font-bold text-ink">Phone & account</h3>
        <p className="text-xs text-muted">
          Account type:{' '}
          <strong>{child?.account_type === 'family_managed' ? 'Managed family account' : 'Own account'}</strong>
        </p>
        <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handlePhone} disabled={patchingPhone}>
            {child?.phone_number ? 'Update phone' : 'Add phone number'}
          </Button>
          <Button variant="secondary" onClick={() => setIndependenceOpen(true)}>
            Give her own account
          </Button>
        </div>
      </Card>

      <Card className="p-5 border-mauve/20">
        <h3 className="font-heading font-bold text-mauve text-sm">Remove from family</h3>
        <p className="text-xs text-muted mt-2">
          Removes {child?.name} from your dashboard. Health data is not deleted.
        </p>
        <Button
          variant="secondary"
          className="mt-4 text-mauve border-mauve/30"
          onClick={() => setRemoveOpen(true)}
        >
          Remove from family
        </Button>
      </Card>

      <GrantIndependenceModal
        isOpen={independenceOpen}
        onClose={() => setIndependenceOpen(false)}
        childName={child?.name ?? 'Family member'}
        isLoading={granting}
        onSubmit={async (payload) => {
          await grant(payload);
          refetch();
          refetchDashboard();
        }}
      />

      <ConfirmModal
        isOpen={removeOpen}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={async () => {
          await remove(adolescentId);
          setRemoveOpen(false);
          onNavigate('/dashboard/parent/children');
        }}
        title={`Remove ${child?.name}?`}
        description="This only removes the family link from your dashboard. Her health data is not deleted."
        dangerLabel="Remove from family"
        isLoading={removing}
      />
    </div>
  );
}
