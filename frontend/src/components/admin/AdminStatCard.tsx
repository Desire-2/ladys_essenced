/**
 * Admin Stat Card Component
 * Displays a metric with title, value, and trend
 */
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AdminStatCardProps {
  label: string;
  value: number;
  unit?: string;
  trend?: { value: number; isUp: boolean };
  accent?: 'terracotta' | 'sage' | 'mauve' | 'amber' | 'rose';
  onClick?: () => void;
}

const ACCENT_STYLES = {
  terracotta: 'border-l-terracotta bg-gradient-to-br from-orange-50 to-transparent',
  sage: 'border-l-sage bg-gradient-to-br from-green-50 to-transparent',
  mauve: 'border-l-mauve bg-gradient-to-br from-purple-50 to-transparent',
  amber: 'border-l-amber-500 bg-gradient-to-br from-amber-50 to-transparent',
  rose: 'border-l-rose-500 bg-gradient-to-br from-rose-50 to-transparent',
};

export function AdminStatCard({
  label,
  value,
  unit = '',
  trend,
  accent = 'terracotta',
  onClick,
}: AdminStatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-lg border-l-4 ${ACCENT_STYLES[accent]} hover:shadow-md transition-shadow text-left w-full ${onClick ? 'cursor-pointer' : ''}`}
    >
      <p className="text-xs font-bold text-muted uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-end justify-between mt-2">
        <p className="text-3xl font-extrabold font-heading text-ink">
          {value.toLocaleString()}
          <span className="text-sm ml-1">{unit}</span>
        </p>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              trend.isUp ? 'text-sage' : 'text-rose-600'
            }`}
          >
            {trend.isUp ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
    </button>
  );
}
