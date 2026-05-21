/** Normalize Flask paginated or wrapped API responses to a plain array. */
export function asArray<T = unknown>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  for (const key of ['items', 'logs', 'providers', 'notifications', 'appointments', 'data']) {
    const val = record[key];
    if (Array.isArray(val)) return val as T[];
  }
  return [];
}
