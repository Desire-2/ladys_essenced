/**
 * Admin Confirm Modal Component
 * Used for dangerous actions like deletions
 */
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  dangerLabel?: string;
  consequences?: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDangerous?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  dangerLabel = 'Delete',
  consequences = [],
  onConfirm,
  onCancel,
  isLoading = false,
  isDangerous = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-[scaleIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-start gap-4">
            {isDangerous && (
              <div className="mt-0.5">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-ink">{title}</h2>
              <p className="text-sm text-muted mt-1">{description}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Consequences */}
        {consequences.length > 0 && (
          <div className="px-6 py-4 bg-rose-50">
            <p className="text-xs font-semibold text-rose-900 mb-2 uppercase">
              This action will:
            </p>
            <ul className="space-y-1.5">
              {consequences.map((item, i) => (
                <li key={i} className="text-xs text-rose-800 flex items-start gap-2">
                  <span className="text-rose-600 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 p-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-ink font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-terracotta hover:bg-orange-600'
            }`}
          >
            {isLoading ? 'Processing...' : dangerLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
