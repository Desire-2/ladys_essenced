import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import { extractAdminUsers } from '@/lib/adminNormalize';
import type { AdminUser, PaginatedResponse } from '@/types/admin';

interface UserFilters {
  page?: number;
  per_page?: number;
  user_type?: string;
  search?: string;
  is_active?: boolean;
}

export function useAdminUsers(initialFilters: UserFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  // Sync initialFilters to filters state
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters.page, initialFilters.per_page, initialFilters.user_type, initialFilters.search, initialFilters.is_active]);

  const fetchUsers = useCallback(async (filterOverrides?: Partial<UserFilters>) => {
    setIsLoading(true);
    setError(null);
    const mergedFilters = { ...filters, ...filterOverrides };
    try {
      const params = new URLSearchParams();
      if (mergedFilters.page) params.set('page', String(mergedFilters.page));
      if (mergedFilters.per_page) params.set('per_page', String(mergedFilters.per_page));
      if (mergedFilters.user_type) params.set('user_type', mergedFilters.user_type);
      if (mergedFilters.search) params.set('search', mergedFilters.search);
      if (mergedFilters.is_active !== undefined) params.set('is_active', String(mergedFilters.is_active));

      const { data: res } = await api.get(`/admin/users?${params.toString()}`);
      const users = extractAdminUsers(res);
      setData({
        ...(typeof res === 'object' && res !== null ? res : {}),
        users,
        data: users,
        total: (res as PaginatedResponse<AdminUser>)?.total ?? users.length,
        pages: (res as PaginatedResponse<AdminUser>)?.pages ?? 1,
        current_page: (res as PaginatedResponse<AdminUser>)?.current_page ?? 1,
        per_page: (res as PaginatedResponse<AdminUser>)?.per_page ?? 20,
        has_next: (res as PaginatedResponse<AdminUser>)?.has_next ?? false,
        has_prev: (res as PaginatedResponse<AdminUser>)?.has_prev ?? false,
      } as PaginatedResponse<AdminUser>);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch users';
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
    setFilters: (newFilters: UserFilters) => setFilters(newFilters),
    fetchUsers,
  };
}

export function useAdminUser(userId: number) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/admin/users/${userId}`);
      setUser(data.data ?? data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch user';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { user, isLoading, error, refetch: fetchUser };
}

export function useToggleUserStatus(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const toggle = async (userId: number) => {
    setIsLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      toast.success('User status updated');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update user status';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { toggle, isLoading };
}

export function useChangeUserRole(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const changeRole = async (userId: number, newRole: string) => {
    setIsLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/change-role`, { user_type: newRole });
      toast.success('User role updated');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to change user role';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { changeRole, isLoading };
}

export function useResetUserPassword(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const resetPassword = async (userId: number) => {
    setIsLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/reset-password`);
      toast.success('Password reset to default (password). PIN login disabled.');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reset password';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { resetPassword, isLoading };
}

export function useDeleteUser(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const deleteUser = async (userId: number) => {
    setIsLoading(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      onSuccess?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete user';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteUser, isLoading };
}

export function useCreateUser(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const create = async (userData: Partial<AdminUser> & { password: string }) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/admin/users/create', userData);
      toast.success('User created successfully');
      onSuccess?.();
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create user';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { create, isLoading };
}

export function useBulkUserAction(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const perform = async (
    action: 'activate' | 'deactivate' | 'delete' | 'change_role',
    userIds: number[],
    value?: string
  ) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/admin/users/bulk-action', {
        action,
        user_ids: userIds,
        value,
      });
      toast.success(`Bulk action completed on ${data.affected ?? userIds.length} users`);
      onSuccess?.();
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Bulk action failed';
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { perform, isLoading };
}
