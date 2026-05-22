import React from 'react';
import type { ChildProfile } from '@/types/parent';
import { daysUntil } from '@/lib/parentUtils';

export function ChildHealthBadge({ child }: { child: ChildProfile }) {
  if (!child.access_granted) return null;

  const days = daysUntil(child.next_period_predicted);
  if (days == null) {
    return (
      <span className="text-xs text-muted">No cycle prediction yet</span>
    );
  }

  return (
    <span className="text-xs text-muted">
      Next period: {days <= 0 ? 'soon' : `${days} days away`} 🌸
    </span>
  );
}
