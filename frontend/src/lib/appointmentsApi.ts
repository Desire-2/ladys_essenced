import { api } from './axios';
import { asArray } from './apiHelpers';
import { getApiErrorMessage } from './cycleLogsApi';
import type { Appointment } from '../types';
function mapAppointment(raw: Record<string, unknown>): Appointment {
  const issue = String(raw.issue ?? raw.description ?? '');
  const parsed = parseAppointmentIssue(issue);
  const scheduled =
    raw.scheduled_datetime ??
    raw.appointment_date ??
    raw.date ??
    '';

  return {
    id: Number(raw.id),
    user_id: Number(raw.user_id ?? raw.for_user_id ?? 0),
    user_name: raw.user_name
      ? String(raw.user_name)
      : raw.patient_name
        ? String(raw.patient_name)
        : undefined,
    health_provider_id:
      raw.health_provider_id != null
        ? Number(raw.health_provider_id)
        : raw.provider_id != null
          ? Number(raw.provider_id)
          : undefined,
    health_provider_name: raw.health_provider_name
      ? String(raw.health_provider_name)
      : undefined,
    appointment_type:
      (raw.appointment_type as Appointment['appointment_type']) ?? parsed.appointment_type,
    scheduled_datetime: String(scheduled),
    status: (raw.status as Appointment['status']) ?? 'pending',
    notes: raw.notes
      ? String(raw.notes)
      : parsed.summary || undefined,
  };
}

export { mapAppointment };

export interface AppointmentFormData {
  appointment_type: 'checkup' | 'consultation' | 'vaccination';
  scheduled_datetime: string;
  notes?: string;
  provider_id?: number;
}

export interface AppointmentCreateResponse {
  message: string;
  id: number;
}

const TYPE_LABELS: Record<AppointmentFormData['appointment_type'], string> = {
  checkup: 'Routine Checkup',
  consultation: 'Friendly Consultation',
  vaccination: 'HPV Vaccination',
};

const TYPE_PREFIX_RE = /^\[(checkup|consultation|vaccination)\]\s*/i;

/** Encode UI appointment type into Flask `issue` (DB has no appointment_type column). */
export function buildAppointmentIssue(
  appointmentType: AppointmentFormData['appointment_type'],
  notes?: string
): string {
  const header = `[${appointmentType}] ${TYPE_LABELS[appointmentType]}`;
  if (notes?.trim()) {
    return `${header} — ${notes.trim()}`;
  }
  return header;
}

export function parseAppointmentIssue(issue: string): {
  appointment_type: Appointment['appointment_type'];
  summary: string;
} {
  const match = issue.match(TYPE_PREFIX_RE);
  const appointment_type = (match?.[1]?.toLowerCase() ?? 'consultation') as Appointment['appointment_type'];
  let summary = issue.replace(TYPE_PREFIX_RE, '').trim();
  const dashIdx = summary.indexOf('—');
  if (dashIdx >= 0) {
    summary = summary.slice(dashIdx + 1).trim();
  }
  return { appointment_type, summary };
}

export function buildAppointmentPayload(
  data: AppointmentFormData,
  options?: { forUserId?: number }
) {
  const payload: Record<string, unknown> = {
    appointment_date: data.scheduled_datetime,
    issue: buildAppointmentIssue(data.appointment_type, data.notes),
    appointment_for: options?.forUserId ? 'child' : 'self',
    notes: data.notes?.trim() || undefined,
  };
  if (options?.forUserId) {
    payload.for_user_id = options.forUserId;
  }
  if (data.provider_id != null) {
    payload.provider_id = data.provider_id;
  }
  return payload;
}

export async function fetchAppointments(params?: {
  per_page?: number;
  status?: string;
}): Promise<Appointment[]> {
  const { data } = await api.get('/appointments', {
    params: { per_page: 50, ...params },
  });
  return asArray<Record<string, unknown>>(data).map((row) =>
    mapAppointment(row)
  );
}

export async function fetchUpcomingAppointments(): Promise<Appointment[]> {
  const { data } = await api.get('/appointments/upcoming');
  const rows = Array.isArray(data) ? data : asArray(data);
  return rows.map((row) => mapAppointment(row as Record<string, unknown>));
}

export async function createAppointment(
  data: AppointmentFormData,
  options?: { forUserId?: number }
): Promise<AppointmentCreateResponse> {
  const { data: res } = await api.post<AppointmentCreateResponse>(
    '/appointments',
    buildAppointmentPayload(data, options)
  );
  return res;
}

export async function deleteAppointment(appointmentId: number): Promise<void> {
  await api.delete(`/appointments/${appointmentId}`);
}

export async function fetchProviderAppointments(): Promise<Appointment[]> {
  const { data } = await api.get('/health-provider/appointments', {
    params: { per_page: 50 },
  });
  return asArray<Record<string, unknown>>(data).map((row) =>
    mapAppointment({
      ...row,
      user_name: row.patient_name ?? row.user_name,
    })
  );
}

export async function fetchUnassignedAppointments(): Promise<Appointment[]> {
  const { data } = await api.get('/health-provider/appointments/unassigned');
  return asArray<Record<string, unknown>>(data).map((row) =>
    mapAppointment({
      ...row,
      user_name: row.patient_name ?? row.user_name,
    })
  );
}

export { getApiErrorMessage };
