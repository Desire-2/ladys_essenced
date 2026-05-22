/**
 * Admin Broadcast Notification Modal
 * Send platform-wide notifications to specific roles
 */
import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBroadcastNotification } from '@/hooks/admin';
import type { BroadcastPayload } from '@/types/admin';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalUsers?: number;
}

const ROLES = [
  { value: null, label: 'All Users' },
  { value: 'adolescent', label: 'Adolescents' },
  { value: 'parent', label: 'Parents' },
  { value: 'health_provider', label: 'Health Providers' },
  { value: 'content_writer', label: 'Content Writers' },
];

const SEVERITIES = [
  { value: 'info', label: 'Info', icon: 'ℹ️' },
  { value: 'success', label: 'Success', icon: '✓' },
  { value: 'warning', label: 'Warning', icon: '⚠' },
  { value: 'error', label: 'Error', icon: '✕' },
];

export function BroadcastModal({
  isOpen,
  onClose,
  totalUsers = 0,
}: BroadcastModalProps) {
  const { broadcast, isLoading } = useBroadcastNotification();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [severity, setSeverity] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const getRoleLabel = () => {
    const roleObj = ROLES.find((r) => r.value === role);
    return roleObj?.label || 'All Users';
  };

  const getEstimatedRecipients = () => {
    // This is a rough estimate - in real app, backend would provide exact count
    if (role === null) return totalUsers;
    if (role === 'adolescent') return Math.round(totalUsers * 0.4);
    if (role === 'parent') return Math.round(totalUsers * 0.3);
    if (role === 'health_provider') return Math.round(totalUsers * 0.05);
    if (role === 'content_writer') return Math.round(totalUsers * 0.05);
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!message.trim()) {
      toast.error('Message is required');
      return;
    }

    try {
      const payload: BroadcastPayload = {
        title: title.trim(),
        message: message.trim(),
        role: role as any,
        severity,
      };

      await broadcast(payload);
      setTitle('');
      setMessage('');
      setRole(null);
      setSeverity('info');
      onClose();
    } catch {
      // Error is handled by hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 animate-[scaleIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Send className="w-5 h-5" />
            Broadcast Notification
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Target Audience */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Target Audience
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value ?? 'all'}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    role === r.value
                      ? 'bg-terracotta text-white'
                      : 'border border-gray-300 text-ink hover:bg-gray-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Severity Level
            </label>
            <div className="flex gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    severity === s.value
                      ? 'bg-terracotta text-white'
                      : 'border border-gray-300 text-ink hover:bg-gray-50'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief subject line"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your notification message..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-sans"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Preview
            </label>
            <div className={`p-4 rounded-lg border-l-4 ${
              severity === 'info' ? 'bg-blue-50 border-l-blue-500' :
              severity === 'success' ? 'bg-green-50 border-l-green-500' :
              severity === 'warning' ? 'bg-amber-50 border-l-amber-500' :
              'bg-red-50 border-l-red-500'
            }`}>
              <p className="font-semibold text-sm text-ink">{title || 'Title...'}</p>
              <p className="text-sm text-muted mt-1">{message || 'Message...'}</p>
            </div>
          </div>

          {/* Recipient Count */}
          <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-muted mt-0.5" />
            <p className="text-sm text-muted">
              <span className="font-semibold">
                Estimated Recipients: {getEstimatedRecipients().toLocaleString()}
              </span>
              {' '}({getRoleLabel()})
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-ink font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim() || !message.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-terracotta text-white font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to {getEstimatedRecipients().toLocaleString()}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
