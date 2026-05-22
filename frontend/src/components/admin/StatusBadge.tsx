/**
 * Admin Status Badge Component
 * Displays status with color coding and optional dot
 */
import React from 'react';

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  className?: string;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label?: string }> = {
  // User status
  active: { color: '#4A7A45', bg: 'rgba(143,175,138,0.15)' },
  inactive: { color: '#8A1A0A', bg: 'rgba(192,57,43,0.15)' },
  // Appointment status
  pending: { color: '#8A6010', bg: 'rgba(232,168,56,0.2)' },
  confirmed: { color: '#4A7A45', bg: 'rgba(143,175,138,0.15)' },
  completed: { color: '#5A2F4D', bg: 'rgba(122,79,109,0.15)' },
  cancelled: { color: '#8A1A0A', bg: 'rgba(192,57,43,0.15)' },
  // Content status
  approved: { color: '#4A7A45', bg: 'rgba(143,175,138,0.15)' },
  rejected: { color: '#8A1A0A', bg: 'rgba(192,57,43,0.15)' },
  draft: { color: '#666', bg: 'rgba(200,200,200,0.15)' },
  verified: { color: '#4A7A45', bg: 'rgba(143,175,138,0.15)' },
  unverified: { color: '#8A6010', bg: 'rgba(232,168,56,0.2)' },
};

export function StatusBadge({
  status,
  showDot = false,
  className = '',
}: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || {
    color: '#666',
    bg: 'rgba(200,200,200,0.15)',
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${className}`}
      style={{
        backgroundColor: style.bg,
        color: style.color,
      }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: style.color }}
        />
      )}
      {label}
    </span>
  );
}
