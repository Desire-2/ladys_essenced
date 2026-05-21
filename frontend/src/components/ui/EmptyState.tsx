import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl text-center bg-surface/50 max-w-md mx-auto my-6 animate-pulse">
      {/* Handcrafted Botanical/Flower Icon outline */}
      <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center text-terracotta mb-4">
        {icon || (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        )}
      </div>
      
      <h3 className="text-lg font-semibold font-heading text-ink mb-1.5">{title}</h3>
      <p className="text-sm text-muted mb-4 font-sans">{description}</p>
      
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary" className="text-xs">
          {actionText}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
