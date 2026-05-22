import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { ChildAccessState } from '@/types/parent';

const LABELS: Record<ChildAccessState, { text: string; variant: 'sage' | 'mauve' | 'default' }> = {
  full_access: { text: 'Managed by you', variant: 'sage' },
  full_access_own: { text: 'Own account · Access granted', variant: 'sage' },
  privacy_locked: { text: 'Privacy mode on', variant: 'mauve' },
};

export function PrivacyStatusBadge({ state }: { state: ChildAccessState }) {
  const cfg = LABELS[state];
  return (
    <Badge variant={cfg.variant} className="text-[10px]">
      {cfg.text}
    </Badge>
  );
}
