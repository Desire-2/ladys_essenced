/**
 * Admin Role Badge Component
 * Displays a styled badge for user roles with consistent colors
 */
import React from 'react';

interface UserRoleBadgeProps {
  role: 'adolescent' | 'parent' | 'health_provider' | 'content_writer' | 'admin';
  className?: string;
}

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  adolescent: {
    bg: 'rgba(143,175,138,0.15)',
    text: '#4A7A45',
    label: 'Adolescent',
  },
  parent: {
    bg: 'rgba(196,120,90,0.15)',
    text: '#8A4A2A',
    label: 'Parent',
  },
  health_provider: {
    bg: 'rgba(122,79,109,0.15)',
    text: '#5A2F4D',
    label: 'Provider',
  },
  content_writer: {
    bg: 'rgba(232,168,56,0.2)',
    text: '#8A6010',
    label: 'Writer',
  },
  admin: {
    bg: 'rgba(192,57,43,0.15)',
    text: '#8A1A0A',
    label: 'Admin',
  },
};

export function UserRoleBadge({ role, className = '' }: UserRoleBadgeProps) {
  const style = ROLE_STYLES[role];
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${className}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {style.label}
    </span>
  );
}
