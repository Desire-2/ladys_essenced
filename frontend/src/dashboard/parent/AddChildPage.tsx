import React from 'react';
import { AddChildWizard } from '@/components/parent/AddChildWizard';
import { useAddChild } from '@/hooks/parent/useChildren';

interface AddChildPageProps {
  onNavigate: (path: string) => void;
}

export function AddChildPage({ onNavigate }: AddChildPageProps) {
  const { mutateAsync, isPending } = useAddChild();

  return (
    <div>
      <button
        type="button"
        className="text-sm text-muted hover:text-ink mb-4"
        onClick={() => onNavigate('/dashboard/parent/children')}
      >
        ← Back to family members
      </button>
      <h2 className="text-2xl font-heading font-bold text-ink mb-6">Add a family member</h2>
      <AddChildWizard
        isLoading={isPending}
        onSubmit={async (payload) => {
          const res = await mutateAsync(payload);
          const id = res?.child?.id ?? res?.child?.adolescent_id;
          if (id) onNavigate(`/dashboard/parent/children/${id}`);
          else onNavigate('/dashboard/parent');
        }}
      />
    </div>
  );
}
