import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'terracotta' | 'sage' | 'mauve' | 'muted' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'terracotta',
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide font-sans border transition-colors',
        variant === 'terracotta' && 'bg-terracotta/10 text-terracotta border-terracotta/20',
        variant === 'sage' && 'bg-sage/10 text-sage border-sage/20',
        variant === 'mauve' && 'bg-mauve/10 text-mauve border-mauve/20',
        variant === 'muted' && 'bg-muted/10 text-muted border-muted/20',
        variant === 'outline' && 'text-ink border-border bg-transparent',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
export default Badge;
