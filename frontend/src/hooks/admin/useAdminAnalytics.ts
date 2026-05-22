import { useState } from 'react';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import type { AnalyticsReport, ReportType } from '@/types/admin';

export function useGenerateReport() {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    reportType: ReportType,
    startDate?: string,
    endDate?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/admin/analytics/generate', {
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
      });
      setReport(data.data ?? data);
      return data.data ?? data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to generate report';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    report,
    isLoading,
    error,
    generate,
  };
}
