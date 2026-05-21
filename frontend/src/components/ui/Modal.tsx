import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  // Lock scroll on mount
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/75 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog container */}
      <div className={cn(
        'relative bg-surface rounded-xl border border-border max-w-lg w-full p-6 shadow-elevated z-10 overflow-hidden max-h-[90vh] flex flex-col animate-[fadeInUp_0.2s_ease-out]',
        className
      )}>
        {/* Artistic warm accent border at the top */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-terracotta via-mauve to-sage" />

        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h3 className="text-xl font-semibold font-heading text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-terracotta transition-colors p-1 rounded-md"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="pt-4 overflow-y-auto flex-1 font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};
export default Modal;
