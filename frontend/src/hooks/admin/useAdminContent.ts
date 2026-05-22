import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import { extractPendingContent } from '@/lib/adminNormalize';
import type { AdminContentItem, PaginatedResponse } from '@/types/admin';

interface ContentFilters {
  page?: number;
  status?: string;
}

export function usePendingContent() {
  const [content, setContent] = useState<AdminContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/content/pending');
      setContent(extractPendingContent(data));
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch pending content';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    content,
    isLoading,
    error,
    refetch: fetchContent,
  };
}

export function useApproveContent(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const approve = async (contentId: number) => {
    setIsLoading(true);
    try {
      await api.patch(`/admin/content/${contentId}/approve`);
      toast.success('Content approved and published');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to approve content';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { approve, isLoading };
}

export function useRejectContent(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const reject = async (contentId: number, reason: string) => {
    setIsLoading(true);
    try {
      await api.patch(`/admin/content/${contentId}/reject`, { reason });
      toast.success('Content rejected — writer notified');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reject content';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { reject, isLoading };
}

export function useCourseStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/courses/stats');
      setStats(data.data ?? data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch course stats';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { stats, isLoading, error, refetch: fetchStats };
}

export function useAdminCourses(initialFilters: ContentFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchCourses = useCallback(async (filterOverrides?: Partial<ContentFilters>) => {
    setIsLoading(true);
    setError(null);
    const mergedFilters = { ...filters, ...filterOverrides };
    try {
      const params = new URLSearchParams();
      if (mergedFilters.page) params.set('page', String(mergedFilters.page));
      if (mergedFilters.status) params.set('status', mergedFilters.status);

      const { data: res } = await api.get(`/admin/courses?${params.toString()}`);
      setData(res);
      setFilters(mergedFilters);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch courses';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return {
    data,
    isLoading,
    error,
    filters,
    setFilters: (newFilters: ContentFilters) => setFilters(newFilters),
    fetchCourses,
  };
}

export function useUpdateCourseStatus(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async (courseId: number, status: string) => {
    setIsLoading(true);
    try {
      await api.patch(`/admin/courses/${courseId}/status`, { status });
      toast.success('Course status updated');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update course status';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateStatus, isLoading };
}

export function useDeleteCourse(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const deleteCourse = async (courseId: number) => {
    setIsLoading(true);
    try {
      await api.delete(`/admin/courses/${courseId}`);
      toast.success('Course deleted');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete course';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteCourse, isLoading };
}
