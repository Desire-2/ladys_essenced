/**
 * Admin Overview Page
 * Dashboard with key metrics, charts, and recent activity
 */
import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { useAdminStats, usePendingContent, useSystemLogs } from '@/hooks/admin';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatDateTime } from '@/lib/utils';
import type { AdminStats } from '@/types/admin';

interface OverviewPageProps {
  onNavigate: (path: string) => void;
}

export function AdminOverviewPage({ onNavigate }: OverviewPageProps) {
  const { stats, isLoading: statsLoading } = useAdminStats();
  const { content: pendingContent } = usePendingContent();
  const { data: logsData, isLoading: logsLoading } = useSystemLogs({ page: 1, per_page: 5 });
  const recentLogs = logsData?.logs ?? logsData?.data ?? [];

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.total_users ?? 0,
      accent: 'terracotta' as const,
      onClick: () => onNavigate('/dashboard/admin/users'),
    },
    {
      label: 'Active Providers',
      value: stats?.total_providers ?? 0,
      accent: 'sage' as const,
      onClick: () => onNavigate('/dashboard/admin/providers'),
    },
    {
      label: 'Pending Content',
      value: stats?.pending_content ?? 0,
      accent: 'amber' as const,
      onClick: () => onNavigate('/dashboard/admin/content'),
    },
    {
      label: 'Appointments Today',
      value: stats?.appointments_today ?? 0,
      accent: 'mauve' as const,
      onClick: () => onNavigate('/dashboard/admin/appointments'),
    },
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-terracotta animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold font-heading text-ink">System Overview</h1>
        <p className="text-sm text-muted mt-1">
          Real-time monitoring of platform health and key metrics
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <AdminStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            accent={card.accent}
            onClick={card.onClick}
          />
        ))}
      </div>

      {/* Two-column layout for details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Actions (spans 2 cols on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-lg font-bold font-heading text-ink mb-4">
              ⚠️ Pending Actions
            </h2>
            <div className="space-y-3">
              {/* Pending Providers */}
              {(stats?.pending_verifications ?? 0) > 0 && (
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-amber-900">
                        {stats?.pending_verifications} Health Provider{' '}
                        {(stats?.pending_verifications ?? 0) === 1
                          ? 'Verification'
                          : 'Verifications'}
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Awaiting credential review and approval
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('/dashboard/admin/providers')}
                      className="px-3 py-1.5 rounded bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Content */}
              {(stats?.pending_content ?? 0) > 0 && (
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-blue-900">
                        {stats?.pending_content} Content Item{' '}
                        {(stats?.pending_content ?? 0) === 1
                          ? 'Awaiting'
                          : 'Items Awaiting'}{' '}
                        Moderation
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Review submissions from content writers
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('/dashboard/admin/content')}
                      className="px-3 py-1.5 rounded bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                    >
                      Moderate →
                    </button>
                  </div>
                </div>
              )}

              {/* All Good */}
              {(stats?.pending_verifications ?? 0) === 0 &&
                (stats?.pending_content ?? 0) === 0 && (
                  <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-center">
                    <p className="font-semibold text-green-900">✓ All Clear</p>
                    <p className="text-sm text-green-700 mt-1">
                      No pending actions at this time
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Pending Content */}
          <div>
            <h2 className="text-lg font-bold font-heading text-ink mb-4">
              📝 Content Queue
            </h2>
            {pendingContent.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingContent.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onNavigate('/dashboard/admin/content')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-ink line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          By {item.writer_name || 'Unknown'} •{' '}
                          {formatDateTime(item.created_at)}
                        </p>
                      </div>
                      <StatusBadge status="pending" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted">
                <p className="text-sm">No pending content</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-bold font-heading text-ink mb-4">
            📊 Recent Activity
          </h2>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-5 h-5 text-terracotta animate-spin" />
            </div>
          ) : recentLogs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border-l-4 border-l-gray-300 bg-gray-50"
                >
                  <p className="font-semibold text-xs text-ink uppercase">
                    {log.action}
                  </p>
                  {log.user_name && (
                    <p className="text-xs text-muted mt-1">{log.user_name}</p>
                  )}
                  <p className="text-xs text-muted mt-1">
                    {formatDateTime(log.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted">
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-muted font-semibold uppercase">New This Week</p>
          <p className="text-2xl font-bold font-heading text-ink mt-2">
            {stats?.new_users_this_week ?? 0}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-muted font-semibold uppercase">New This Month</p>
          <p className="text-2xl font-bold font-heading text-ink mt-2">
            {stats?.new_users_this_month ?? 0}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-muted font-semibold uppercase">Active Users</p>
          <p className="text-2xl font-bold font-heading text-ink mt-2">
            {stats?.active_users ?? 0}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-muted font-semibold uppercase">Total Appointments</p>
          <p className="text-2xl font-bold font-heading text-ink mt-2">
            {stats?.total_appointments ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
