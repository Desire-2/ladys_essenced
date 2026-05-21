export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-US', options || {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Calculates current cycle phase based on the start date of last period.
 */
export function getCyclePhase(startDateStr: string, averageLength = 28): {
  day: number;
  phase: 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';
  color: string;
  nextPeriodDays: number;
} {
  const start = new Date(startDateStr);
  const now = new Date();
  
  // Diff in days
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const currentDay = (diffDays % averageLength) || 1;
  const nextPeriodDays = averageLength - currentDay;
  
  let phase: 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal' = 'Menstrual';
  let color = 'text-terracotta';
  
  if (currentDay >= 1 && currentDay <= 5) {
    phase = 'Menstrual';
    color = 'text-terracotta'; // Reddish/terracotta
  } else if (currentDay >= 6 && currentDay <= 11) {
    phase = 'Follicular';
    color = 'text-sage'; // Sage green
  } else if (currentDay >= 12 && currentDay <= 16) {
    phase = 'Ovulation';
    color = 'text-mauve'; // Mauve
  } else {
    phase = 'Luteal';
    color = 'text-muted'; // Warm muted brown/slate
  }
  
  return {
    day: currentDay,
    phase,
    color,
    nextPeriodDays,
  };
}
