/**
 * Content Reject Modal Component
 * Modal for rejecting content with reason
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ContentRejectModalProps {
  isOpen: boolean;
  contentTitle?: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ContentRejectModal({
  isOpen,
  contentTitle = 'This content',
  onConfirm,
  onCancel,
  isLoading = false,
}: ContentRejectModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      return;
    }
    await onConfirm(reason);
    setReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-[scaleIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-ink">Reject Content</h2>
          <button
            onClick={onCancel}
            className="text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <p className="text-sm text-muted mb-4">
              You are rejecting: <span className="font-semibold text-ink">{contentTitle}</span>
            </p>
            <label className="block text-sm font-semibold text-ink mb-2">
              Reason for Rejection *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Be specific and constructive. Explain what needs to be improved..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans text-sm"
              autoFocus
            />
            <p className="text-xs text-muted mt-1">
              The writer will be notified with your feedback ({reason.length}/200)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-ink font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Keep It
            </button>
            <button
              type="submit"
              disabled={isLoading || reason.trim().length < 10}
              className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Rejecting...' : 'Send Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
