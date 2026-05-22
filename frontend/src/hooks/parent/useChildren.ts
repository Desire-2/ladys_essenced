import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/axios';
import { getParentErrorMessage } from '@/lib/parentUtils';
import type { AddChildPayload, ChildDetail } from '@/types/parent';

export function useChildren() {
  const [children, setChildren] = useState<ChildDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ChildDetail[]>('/parents/children');
      setChildren(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      setError(getParentErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { children, isLoading, error, refetch };
}

export function useChild(adolescentId: number) {
  const [child, setChild] = useState<ChildDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!adolescentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/parents/children/${adolescentId}/details`);
      const detailBody = data?.child ?? data;
      const summary = data?.health_summary;
      setChild({
        ...detailBody,
        id: detailBody.id ?? adolescentId,
        access_granted: data?.access_granted ?? detailBody.access_granted ?? true,
        health_summary: summary
          ? {
              total_appointments: summary.total_appointments ?? 0,
              completed_appointments: summary.completed_appointments ?? 0,
              upcoming_appointments: summary.upcoming_appointments ?? 0,
              last_appointment: summary.last_appointment,
            }
          : undefined,
      });
    } catch (err: unknown) {
      setError(getParentErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [adolescentId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { child, isLoading, error, refetch };
}

export function useAddChild() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (data: AddChildPayload) => {
    setIsPending(true);
    try {
      const res = await api.post('/parents/children/add', data);
      toast.success(`${res.data?.child?.name || 'Family member'} added to your family`);
      return res.data;
    } catch (err: unknown) {
      toast.error(getParentErrorMessage(err));
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useUpdateChild(adolescentId: number) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (data: Partial<AddChildPayload & { name?: string }>) => {
    setIsPending(true);
    try {
      const res = await api.put(`/parents/children/${adolescentId}`, data);
      toast.success('Profile updated');
      return res.data;
    } catch (err: unknown) {
      toast.error(getParentErrorMessage(err));
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useDeleteChild() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (adolescentId: number) => {
    setIsPending(true);
    try {
      const res = await api.delete(`/parents/children/${adolescentId}`);
      toast.success('Profile removed from family');
      return res.data;
    } catch (err: unknown) {
      toast.error(getParentErrorMessage(err));
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useGrantIndependence(adolescentId: number) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (payload: { phone_number: string; send_invite: boolean }) => {
    setIsPending(true);
    try {
      const res = await api.post(
        `/parents/children/${adolescentId}/grant-independence`,
        payload
      );
      toast.success(
        payload.send_invite
          ? 'Independence granted and invite sent to their phone'
          : 'Independence granted — they can now log in with their phone number'
      );
      return res.data;
    } catch (err: unknown) {
      toast.error(getParentErrorMessage(err));
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useUpdateChildPhone(adolescentId: number) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (phone_number: string) => {
    setIsPending(true);
    try {
      const res = await api.patch(`/parents/children/${adolescentId}/phone`, { phone_number });
      toast.success('Phone number updated');
      return res.data;
    } catch (err: unknown) {
      toast.error(getParentErrorMessage(err));
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
