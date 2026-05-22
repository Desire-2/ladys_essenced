/**
 * Admin Analytics & Reports Page
 * Generate and view various platform analytics reports
 */
import React, { useState } from 'react';
import { Loader, BarChart2 } from 'lucide-react';
import { useGenerateReport } from '@/hooks/admin';
import { subDays } from 'date-fns';
import type { ReportType, AnalyticsReport } from '@/types/admin';

interface AnalyticsPageProps {
  onNavigate: (path: string) => void;
}

const REPORT_TYPES: { type: ReportType; label: string; icon: string; description: string }[] = [
  { type: 'overview', label: 'Overview', icon: '📊', description: 'System-wide metrics and KPIs' },
  { type: 'user_activity', label: 'User Activity', icon: '👥', description: 'Daily active users trend' },
  { type: 'user_registrations', label: 'Registrations', icon: '📈', description: 'New user signup trends' },
  { type: 'content_performance', label: 'Content', icon: '📖', description: 'Content views and engagement' },
  { type: 'appointments', label: 'Appointments', icon: '📅', description: 'Appointment statistics' },
  { type: 'health_tracking', label: 'Health Tracking', icon: '🩺', description: 'Tracking data analytics' },
  { type: 'engagement', label: 'Engagement', icon: '💫', description: 'User engagement metrics' },
];

export function AnalyticsPage({ onNavigate }: AnalyticsPageProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('overview');
  const [dateRange, setDateRange] = useState('30'); // days
  const { report, isLoading, generate } = useGenerateReport();

  const handleGenerateReport = async () => {
    const days = parseInt(dateRange);
    const startDate = subDays(new Date(), days).toISOString();
    const endDate = new Date().toISOString();
    await generate(selectedReport, startDate, endDate);
  };

  const reportConfig = REPORT_TYPES.find((r) => r.type === selectedReport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold font-heading text-ink">Analytics & Reports</h1>
        <p className="text-sm text-muted mt-1">
          Generate and view detailed platform analytics
        </p>
      </div>

      {/* Report Selection */}
      <div>
        <label className="block text-sm font-semibold text-ink mb-3">
          Select Report Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
          {REPORT_TYPES.map((r) => (
            <button
              key={r.type}
              onClick={() => setSelectedReport(r.type)}
              className={`p-3 rounded-lg text-center transition-all ${
                selectedReport === r.type
                  ? 'ring-2 ring-terracotta bg-terracotta/5'
                  : 'border border-gray-200 hover:border-terracotta'
              }`}
              title={r.description}
            >
              <div className="text-2xl mb-1">{r.icon}</div>
              <p className="text-xs font-semibold text-ink">{r.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Report Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-ink mb-2">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta bg-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-terracotta text-white font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <BarChart2 className="w-4 h-4" />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Report Display */}
      {report ? (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="p-6 rounded-lg bg-gradient-to-r from-terracotta/5 to-sage/5 border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold font-heading text-ink">
                  {reportConfig?.icon} {reportConfig?.label} Report
                </h2>
                <p className="text-sm text-muted mt-1">
                  {report.period.start} to {report.period.end}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Metrics */}
          {report.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(report.summary).map(([key, value]) => (
                <div key={key} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="text-xs font-semibold text-muted uppercase">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-2xl font-bold font-heading text-ink mt-2">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Report Details */}
          <div className="p-6 rounded-lg border border-gray-200 bg-white">
            <h3 className="text-lg font-bold font-heading text-ink mb-4">
              Report Details
            </h3>
            <div className="space-y-3">
              {Object.entries(report).map(([key, value]) => {
                if (key === 'report_type' || key === 'period' || key === 'summary' || typeof value === 'function') {
                  return null;
                }
                if (typeof value === 'object') {
                  return (
                    <div key={key} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-ink mb-2">
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <pre className="text-xs text-muted overflow-x-auto bg-gray-100 p-2 rounded">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  );
                }
                return (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-ink">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-muted">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <BarChart2 className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold text-ink mb-2">No report generated</p>
          <p className="text-sm text-muted">
            Click "Generate Report" to view {reportConfig?.description?.toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
}
