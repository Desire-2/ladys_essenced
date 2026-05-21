import { api } from './axios';
import { asArray } from './apiHelpers';
import { getApiErrorMessage } from './cycleLogsApi';

export interface HealthProviderSummary {
  id: number;
  user_id?: number;
  name: string;
  first_name?: string;
  last_name?: string;
  specialization: string;
  clinic: string;
  clinic_name?: string;
  clinic_address?: string;
  phone?: string;
  email?: string;
  is_verified: boolean;
}

export function mapHealthProvider(raw: Record<string, unknown>): HealthProviderSummary {
  const name =
    String(raw.name ?? '').trim() ||
    [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim() ||
    'Clinical Specialist';

  return {
    id: Number(raw.id),
    user_id: raw.user_id != null ? Number(raw.user_id) : undefined,
    name,
    first_name: raw.first_name ? String(raw.first_name) : undefined,
    last_name: raw.last_name ? String(raw.last_name) : undefined,
    specialization: String(raw.specialization ?? 'General Practice'),
    clinic: String(raw.workplace_clinic ?? raw.clinic_name ?? 'Community Health Center'),
    clinic_name: raw.clinic_name ? String(raw.clinic_name) : undefined,
    clinic_address: raw.clinic_address ? String(raw.clinic_address) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    email: raw.email ? String(raw.email) : undefined,
    is_verified: Boolean(raw.is_verified ?? true),
  };
}

export async function fetchHealthProviders(options?: {
  includeUnverified?: boolean;
}): Promise<HealthProviderSummary[]> {
  const { data } = await api.get('/health-provider/providers', {
    params: options?.includeUnverified ? { include_unverified: true } : undefined,
  });
  return asArray<Record<string, unknown>>(data).map(mapHealthProvider);
}

export { getApiErrorMessage };
