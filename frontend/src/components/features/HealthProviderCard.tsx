import React from 'react';
import { Stethoscope, MapPin, BadgeCheck } from 'lucide-react';
import type { HealthProviderSummary } from '../../lib/healthProvidersApi';
import { Card } from '../ui/Card';

interface HealthProviderCardProps {
  provider: HealthProviderSummary;
  selected?: boolean;
  onSelect?: (providerId: number) => void;
  compact?: boolean;
}

export const HealthProviderCard: React.FC<HealthProviderCardProps> = ({
  provider,
  selected = false,
  onSelect,
  compact = false,
}) => {
  const clickable = Boolean(onSelect);

  return (
    <Card
      hoverable={clickable}
      onClick={clickable ? () => onSelect?.(provider.id) : undefined}
      className={`text-left transition-all ${
        selected ? 'ring-2 ring-terracotta border-transparent' : ''
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-sage/10 text-sage flex items-center justify-center shrink-0">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-extrabold text-ink">{provider.name}</p>
            {provider.is_verified && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-sage bg-sage/10 px-1.5 py-0.5 rounded border border-sage/15">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-muted font-semibold mt-0.5">{provider.specialization}</p>
          <p className="text-[11px] text-muted mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{provider.clinic}</span>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default HealthProviderCard;
