import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  isLoading,
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'relative inline-flex items-center justify-center font-sans font-bold rounded-[16px] px-6 py-3 text-sm transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98]',
        variant === 'primary' && 'bg-terracotta text-surface hover:bg-[#b06a4f] shadow-[0_4px_12px_rgba(196,120,90,0.3)] focus:ring-1 focus:ring-terracotta',
        variant === 'secondary' && 'bg-sage text-surface hover:bg-[#7ea079] shadow-md focus:ring-1 focus:ring-sage',
        variant === 'ghost' && 'text-ink hover:bg-border/60 focus:ring-1 focus:ring-border',
        variant === 'danger' && 'bg-mauve text-surface hover:bg-[#6b425f] shadow-md focus:ring-1 focus:ring-mauve',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-1.5">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
export default Button;
