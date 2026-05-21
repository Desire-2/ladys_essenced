import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-[24px] p-6 shadow-card transition-all duration-300 relative overflow-hidden',
        hoverable && 'hover:shadow-elevated hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {/* Decorative Warm Accent Blob embedded inside cards for a crafted artisanal feel */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-terracotta/5 rounded-bl-full pointer-events-none" />
      
      {children}
    </div>
  );
};
export default Card;
