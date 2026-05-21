import React from 'react';
import { getCyclePhase } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface CycleRingProps {
  startDate: string;
  averageCycleLength?: number;
}

export const CycleRing: React.FC<CycleRingProps> = ({
  startDate,
  averageCycleLength = 28,
}) => {
  const { day, phase, color, nextPeriodDays } = getCyclePhase(startDate, averageCycleLength);

  // SVG parameters
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressPercent = Math.min(100, Math.max(0, (day / averageCycleLength) * 100));
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Set phase custom labels/badges
  const variantMap: Record<string, 'terracotta' | 'sage' | 'mauve' | 'muted'> = {
    Menstrual: 'terracotta',
    Follicular: 'sage',
    Ovulation: 'mauve',
    Luteal: 'muted',
  };

  const phaseKinya: Record<string, string> = {
    Menstrual: 'Igihe cy’mihango',
    Follicular: 'Imbura-mihango',
    Ovulation: 'Igihe cy’ubusama',
    Luteal: 'Inyuma-mubusama',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="relative" style={{ width: size, height: size }}>
        
        {/* Background Track Circle */}
        <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-border"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Active Animated Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={color === 'text-terracotta' ? 'stroke-terracotta' : color === 'text-sage' ? 'stroke-sage' : color === 'text-mauve' ? 'stroke-mauve' : 'stroke-muted'}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>

        {/* Central numbers overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-muted">Cycle Day</span>
          <span className="text-4xl font-extrabold font-heading text-ink my-0.5">{day}</span>
          <span className="text-[11px] text-muted font-medium">/{averageCycleLength} days</span>
        </div>
      </div>

      <div className="mt-5 space-y-1.5 flex flex-col items-center">
        <Badge variant={variantMap[phase] || 'terracotta'}>
          {phase} • {phaseKinya[phase] || ''}
        </Badge>
        
        <p className="text-sm text-ink font-medium">
          Next period in <span className="font-extrabold text-terracotta">{nextPeriodDays}</span> days
        </p>
      </div>
    </div>
  );
};
export default CycleRing;
