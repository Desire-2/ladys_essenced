import { api } from './axios';
import type { User } from '../types';

export interface NotificationPreferences {
  cycle_reminders: boolean;
  appointment_reminders: boolean;
  health_tips: boolean;
  new_features: boolean;
  email: boolean;
  sms: boolean;
}

export interface LinkedParent {
  id: number;
  name: string;
  relationship?: string;
}

export interface PrivacySettings {
  allow_parent_access: boolean;
  data_sharing_consent: boolean;
  notification_preferences: NotificationPreferences;
  linked_parents?: LinkedParent[];
}

export interface SettingsBundle {
  account: User;
  privacy: PrivacySettings;
  umwari: {
    server_key_configured: boolean;
    source: string;
  };
}

export interface AccountUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  enable_pin_auth?: boolean;
  current_password?: string;
  new_password?: string;
  new_pin?: string;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  cycle_reminders: true,
  appointment_reminders: true,
  health_tips: true,
  new_features: false,
  email: true,
  sms: false,
};

export function mapAccountToUser(account: Record<string, unknown>): User {
  return {
    id: Number(account.id),
    first_name: String(account.first_name ?? ''),
    last_name: String(account.last_name ?? ''),
    phone_number: String(account.phone_number ?? ''),
    email: account.email ? String(account.email) : undefined,
    user_type: account.user_type as User['user_type'],
    allow_parent_access: Boolean(account.allow_parent_access),
    enable_pin_auth: Boolean(account.enable_pin_auth),
    is_active: Boolean(account.is_active ?? true),
    created_at: String(account.created_at ?? ''),
  };
}

function normalizeSettingsBundle(data: SettingsBundle): SettingsBundle {
  return {
    ...data,
    account: mapAccountToUser(data.account as unknown as Record<string, unknown>),
    privacy: {
      ...data.privacy,
      notification_preferences: {
        ...DEFAULT_NOTIFICATION_PREFS,
        ...data.privacy.notification_preferences,
      },
    },
  };
}

/** Load full settings; falls back to separate endpoints if bundle route is unavailable. */
export async function fetchSettings(): Promise<SettingsBundle> {
  try {
    const { data } = await api.get<SettingsBundle>('/settings/bundle');
    return normalizeSettingsBundle(data);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== 404) throw err;
  }

  const [accountRes, privacyRes, umwariRes] = await Promise.all([
    api.get<Record<string, unknown>>('/settings/account'),
    api.get<PrivacySettings>('/settings/privacy'),
    api.get<{ server_key_configured: boolean; source: string }>('/settings/umwari/status'),
  ]);

  return normalizeSettingsBundle({
    account: mapAccountToUser(accountRes.data),
    privacy: privacyRes.data,
    umwari: {
      server_key_configured: umwariRes.data.server_key_configured,
      source: umwariRes.data.source,
    },
  });
}

export async function updateAccount(payload: AccountUpdatePayload): Promise<User> {
  const { data } = await api.put<{ user: Record<string, unknown>; message: string }>(
    '/settings/account',
    payload
  );
  return mapAccountToUser(data.user);
}

export async function updateParentAccess(allow: boolean): Promise<User> {
  const { data } = await api.put<{ user: Record<string, unknown>; allow_parent_access: boolean }>(
    '/settings/privacy/parent-access',
    { allow_parent_access: allow }
  );
  return mapAccountToUser(data.user);
}

export async function updatePrivacyPreferences(
  prefs: Partial<NotificationPreferences>,
  dataSharingConsent?: boolean
): Promise<PrivacySettings> {
  const body: Record<string, unknown> = { notification_preferences: prefs };
  if (dataSharingConsent !== undefined) {
    body.data_sharing_consent = dataSharingConsent;
  }
  const { data } = await api.put<{ privacy: PrivacySettings }>('/settings/privacy', body);
  return {
    ...data.privacy,
    notification_preferences: {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...data.privacy.notification_preferences,
    },
  };
}

export async function fetchUmwariServerStatus(): Promise<{
  server_key_configured: boolean;
  source: string;
}> {
  const { data } = await api.get('/settings/umwari/status');
  return data;
}
