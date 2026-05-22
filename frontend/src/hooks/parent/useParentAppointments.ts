import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/axios';
import { asArray } from '@/lib/apiHelpers';
import { getParentErrorMessage } from '@/lib/parentUtils';
import type { BookAppointmentPayload, ParentAppointment } from '@/types/parent';

function mapAppointment(row: Record<string, unknown>): ParentAppointment {
  return {
    id: Number(row.id),
    for_user_id: row.for_user_id != null ? Number(row.for_user_id) : undefined,
    child_name: String(row.child_name ?? row.appointment_for ?? ''),
    provider_id: row.provider_id != null ? Number(row.provider_id) : undefined,
    provider_name: String(row.provider_name ?? ''),
    provider_specialization: String(row.provider_specialization ?? ''),
    appointment_date: String(row.appointment_date ?? row.scheduled_datetime ?? ''),
    issue: String(row.issue ?? ''),
    status: (row.status as ParentAppointment['status']) || 'pending',
    priority: (row.priority as ParentAppointment['priority']) || 'normal',
    notes: row.notes != null ? String(row.notes) : undefined,
    provider_notes: row.provider_notes != null ? String(row.provider_notes) : undefined,
    booked_for_child: Boolean(row.booked_for_child),
    is_telemedicine: Boolean(row.is_telemedicine),
    created_at: row.created_at != null ? String(row.created_at) : undefined,
  };
}

export function useChildAppointments(
  childId: number,
  filters?: { status?: string; date_from?: string; date_to?: string }
) {
  const [appointments, setAppointments] = useState<ParentAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!childId) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.date_from) params.set('date_from', filters.date_from);
      if (filters?.date_to) params.set('date_to', filters.date_to);
      const res = await api.get(
        `/parents/children/${childId}/appointments?${params.toString()}`
      );
      const raw = asArray<Record<string, unknown>>(res.data?.appointments ?? res.data?.items ?? res.data);
      setAppointments(raw.map(mapAppointment));
    } catch (err: unknown) {
      setError(getParentErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [childId, filters?.status, filters?.date_from, filters?.date_to]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { appointments, isLoading, error, refetch };
}

export function useBookAppointment() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (data: BookAppointmentPayload) => {
    setIsPending(true);
    try {
      const res = await api.post('/parent/book-appointment-for-child', data);
      const name = res.data?.appointment?.child_name || 'your family member';
      toast.success(`Appointment booked for ${name}`);
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

export function useCancelAppointment() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (appointmentId: number) => {
    setIsPending(true);
    try {
      const res = await api.post(`/parent/appointments/${appointmentId}/cancel`);
      toast.success('Appointment cancelled');
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

export function useRescheduleAppointment() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (appointmentId: number, newDate: string) => {
    setIsPending(true);
    try {
      const res = await api.post(`/parent/appointments/${appointmentId}/reschedule`, {
        new_appointment_date: newDate,
      });
      toast.success('Appointment rescheduled');
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
