import { asArray } from './apiHelpers';
import type { AdminStats, AdminUser, AdminProvider, AdminContentItem, AdminAppointment } from '@/types/admin';

export function normalizeAdminStats(
  dashboard: Record<string, unknown>,
  options?: { pendingContent?: number; unverifiedProviders?: number }
): AdminStats {
  const users = dashboard.users as Record<string, number> | undefined;
  const content = dashboard.content as Record<string, number> | undefined;
  const appointments = dashboard.appointments as Record<string, number> | undefined;

  return {
    total_users: users?.total ?? Number(dashboard.total_users ?? 0),
    active_users: users?.active ?? Number(dashboard.active_users ?? 0),
    total_adolescents: users?.adolescents ?? 0,
    total_parents: users?.parents ?? 0,
    total_providers: users?.health_providers ?? 0,
    total_content_writers: users?.content_writers ?? 0,
    pending_verifications:
      options?.unverifiedProviders ?? Number(dashboard.pending_verifications ?? 0),
    pending_content: options?.pendingContent ?? Number(dashboard.pending_content ?? 0),
    total_appointments: appointments?.total ?? 0,
    appointments_today:
      Number(dashboard.appointments_today ?? appointments?.pending ?? 0),
    new_users_this_week: Number(dashboard.new_users_this_week ?? users?.new_today ?? 0),
    new_users_this_month: Number(dashboard.new_users_this_month ?? 0),
  };
}

export function normalizeAdminUser(raw: Record<string, unknown>): AdminUser {
  const name = String(raw.name ?? '');
  const parts = name.trim().split(/\s+/);
  return {
    id: Number(raw.id),
    first_name: String(raw.first_name ?? parts[0] ?? name),
    last_name: String(raw.last_name ?? parts.slice(1).join(' ') ?? ''),
    name: name || undefined,
    phone_number: String(raw.phone_number ?? ''),
    email: raw.email as string | undefined,
    user_type: raw.user_type as AdminUser['user_type'],
    is_active: Boolean(raw.is_active ?? true),
    allow_parent_access: Boolean(raw.allow_parent_access ?? true),
    created_at: String(raw.created_at ?? ''),
    updated_at: raw.updated_at as string | undefined,
  };
}

export function normalizeAdminProvider(raw: Record<string, unknown>): AdminProvider {
  const name = String(raw.name ?? '');
  const parts = name.trim().split(/\s+/);
  const appts = raw.appointments as Record<string, number> | undefined;
  return {
    id: Number(raw.id),
    user_id: Number(raw.user_id),
    user: {
      id: Number(raw.user_id),
      first_name: parts[0] ?? name,
      last_name: parts.slice(1).join(' '),
      name,
      phone_number: String(raw.phone ?? ''),
      user_type: 'health_provider',
      is_active: Boolean(raw.is_active ?? true),
      allow_parent_access: true,
      created_at: String(raw.created_at ?? ''),
    },
    license_number: String(raw.license_number ?? ''),
    specialization: String(raw.specialization ?? ''),
    clinic_name: String(raw.clinic_name ?? ''),
    clinic_address: String(raw.clinic_address ?? ''),
    clinic_phone: String(raw.phone ?? raw.clinic_phone ?? ''),
    qualification: String(raw.qualification ?? ''),
    is_verified: Boolean(raw.is_verified),
    created_at: String(raw.created_at ?? ''),
    total_appointments: appts?.total,
    upcoming_appointments: appts?.pending,
  };
}

export function normalizePendingContent(raw: Record<string, unknown>): AdminContentItem {
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ''),
    description: String(raw.summary ?? raw.description ?? ''),
    content: String(raw.summary ?? raw.content ?? ''),
    status: 'pending',
    category_id: Number(raw.category_id ?? 0),
    category_name: String(raw.category ?? raw.category_name ?? ''),
    language: String(raw.language ?? 'en'),
    is_featured: Boolean(raw.is_featured ?? false),
    writer_name: String(raw.author ?? raw.writer_name ?? 'Unknown'),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? raw.created_at ?? ''),
  };
}

export function normalizeAdminAppointment(raw: Record<string, unknown>): AdminAppointment {
  const scheduled =
    raw.scheduled_datetime ??
    raw.appointment_date ??
    raw.preferred_date ??
    raw.created_at;
  return {
    id: Number(raw.id),
    user_id: Number(raw.user_id ?? 0),
    patient_name: String(raw.patient_name ?? raw.user_name ?? 'Unknown'),
    health_provider_id: raw.health_provider_id as number | undefined,
    provider_name: String(raw.provider_name ?? raw.provider ?? 'Unassigned'),
    appointment_type: String(raw.appointment_type ?? raw.issue ?? 'appointment'),
    scheduled_datetime: String(scheduled ?? ''),
    status: (raw.status as AdminAppointment['status']) ?? 'pending',
    notes: raw.notes as string | undefined,
    created_at: String(raw.created_at ?? ''),
  };
}

export function extractAdminUsers(data: unknown): AdminUser[] {
  return asArray<Record<string, unknown>>(data).map(normalizeAdminUser);
}

export function extractAdminProviders(data: unknown): AdminProvider[] {
  return asArray<Record<string, unknown>>(data).map(normalizeAdminProvider);
}

export function extractPendingContent(data: unknown): AdminContentItem[] {
  const list = asArray<Record<string, unknown>>(data);
  if (list.length === 0 && data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.content)) {
      return (record.content as Record<string, unknown>[]).map(normalizePendingContent);
    }
  }
  return list.map(normalizePendingContent);
}
