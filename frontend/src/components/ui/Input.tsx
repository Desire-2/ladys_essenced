import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  error,
  icon,
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className="w-full text-left font-sans">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'block w-full rounded-[16px] border border-border bg-surface px-4 py-3 text-sm text-ink transition-all placeholder:text-muted/70 focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:outline-none disabled:opacity-50',
            icon && 'pl-10',
            error && 'border-mauve focus:border-mauve focus:ring-mauve',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-mauve font-medium animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
