/**
 * Admin System Logs Page
 * Audit trail of all admin actions and system events
 */
import React, { useState, useEffect } from 'react';
import { Loader, Search, Filter } from 'lucide-react';
import { useSystemLogs } from '@/hooks/admin';
import { formatDateTime } from '@/lib/utils';
import type { SystemLog } from '@/types/admin';

interface LogsPageProps {
  onNavigate: (path: string) => void;
}

const ACTION_COLORS: Record<string, string> = {
  delete: 'border-l-rose-500',
  verify: 'border-l-sage',
  create: 'border-l-terracotta',
  view: 'border-l-gray-400',
  update: 'border-l-mauve',
  change: 'border-l-mauve',
  approve: 'border-l-sage',
  reject: 'border-l-amber-500',
};

export function LogsPage({ onNavigate }: LogsPageProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(30);
  const [showFilters, setShowFilters] = useState(false);

  const { data: logsData, isLoading, fetchLogs } = useSystemLogs({ page, per_page: perPage, action: search });
  const logEntries = logsData?.logs ?? logsData?.data ?? [];

  useEffect(() => {
    fetchLogs({ page, per_page: perPage, action: search });
  }, [page, search]);

  const getActionColor = (action: string) => {
    for (const [key, color] of Object.entries(ACTION_COLORS)) {
      if (action.toLowerCase().includes(key)) {
        return color;
      }
    }
    return 'border-l-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold font-heading text-ink">System Activity Logs</h1>
        <p className="text-sm text-muted mt-1">
          Comprehensive audit trail of all platform actions
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by action..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden md:inline text-sm font-semibold">Filters</span>
          </button>
        </div>

        {/* Advanced Filters (hidden by default) */}
        {showFilters && (
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
            <p className="text-sm text-muted font-semibold">Advanced filters would appear here</p>
          </div>
        )}
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-terracotta animate-spin" />
          </div>
        ) : logEntries.length > 0 ? (
          <>
            {logEntries.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-lg border-l-4 ${getActionColor(log.action)} bg-white border border-gray-200 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-ink uppercase text-xs">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {log.user_name && (
                        <>
                          <span className="text-sm font-medium text-ink">
                            {log.user_name}
                          </span>
                          {log.user_type && (
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                              {log.user_type}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {log.details && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-muted font-mono max-h-16 overflow-y-auto">
                        {typeof log.details === 'object'
                          ? JSON.stringify(log.details, null, 2)
                          : log.details}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-muted">
                      {formatDateTime(log.created_at)}
                    </p>
                    {log.ip_address && (
                      <p className="text-xs text-muted mt-1">{log.ip_address}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between py-4">
              <p className="text-xs text-muted">
                Showing {(page - 1) * perPage + 1} to{' '}
                {Math.min(page * perPage, logsData?.total ?? 0)} of {logsData?.total ?? 0}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors font-semibold text-sm"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= (logsData?.pages ?? 1)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors font-semibold text-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg font-semibold text-ink mb-2">No logs found</p>
            <p className="text-sm text-muted">Try adjusting your search filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
