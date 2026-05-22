import type { ChildAccessState, ChildProfile } from '@/types/parent';

export const CHILD_COLORS = [
  { bg: 'rgba(196,120,90,0.2)', text: '#C4785A' },
  { bg: 'rgba(122,79,109,0.2)', text: '#7A4F6D' },
  { bg: 'rgba(143,175,138,0.2)', text: '#5A8F56' },
  { bg: 'rgba(232,168,56,0.2)', text: '#B8860B' },
];

export function getChildColor(adolescentId: number) {
  return CHILD_COLORS[adolescentId % CHILD_COLORS.length];
}

export function getAccessState(child: ChildProfile): ChildAccessState {
  if (!child.access_granted) return 'privacy_locked';
  if (child.has_own_phone) return 'full_access_own';
  return 'full_access';
}

export function childAgeFromDob(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return Math.max(0, age);
}

export const PARENT_ERROR_MESSAGES: Record<number, string> = {
  403: 'This family member has enabled privacy mode.',
  404: 'This family member was not found.',
  409: 'That time slot is no longer available.',
  410: 'This appointment cannot be changed (either passed or within 24 hours).',
};

export function getParentErrorMessage(error: unknown): string {
  const err = error as { response?: { status?: number; data?: { message?: string } } };
  const status = err?.response?.status;
  const msg = err?.response?.data?.message || '';

  if (msg.includes('disabled parent access') || msg.toLowerCase().includes('privacy')) {
    return 'This family member has enabled privacy mode.';
  }
  if (msg.includes('24 hours')) {
    return 'Appointments must be cancelled at least 24 hours in advance.';
  }
  if (msg.includes('not associated')) {
    return 'This family member is not linked to your account.';
  }
  if (msg.includes('Phone number already registered')) {
    return 'This phone number is already registered in the system.';
  }
  return PARENT_ERROR_MESSAGES[status ?? 0] || msg || 'Something went wrong. Please try again.';
}

export function daysUntil(dateIso?: string): number | null {
  if (!dateIso) return null;
  const target = new Date(dateIso);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function canCancelAppointment(appointmentDateIso: string): boolean {
  const appt = new Date(appointmentDateIso);
  if (Number.isNaN(appt.getTime())) return false;
  const hours = (appt.getTime() - Date.now()) / (1000 * 60 * 60);
  return hours >= 24;
}
