import type { Notification } from '../types';

export function mapNotification(raw: Record<string, unknown>): Notification {
  const category = String(
    raw.notification_type ?? raw.type ?? 'system'
  ).toLowerCase();

  const normalizedType: Notification['notification_type'] =
    category === 'cycle' || category === 'cycle_prediction'
      ? 'cycle'
      : category.includes('appointment')
        ? 'appointment'
        : category === 'health'
          ? 'health'
          : 'system';

  return {
    id: Number(raw.id),
    title: String(raw.title ?? 'Notification'),
    message: String(raw.message ?? ''),
    notification_type: normalizedType,
    is_read: Boolean(raw.is_read),
    created_at: String(raw.created_at ?? ''),
  };
}
