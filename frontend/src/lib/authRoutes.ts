/** Paths that do not require a signed-in session */
export const PUBLIC_PATHS = ['/login', '/register'] as const;

export type PublicPath = (typeof PUBLIC_PATHS)[number];

export function isPublicPath(path: string): boolean {
  return (PUBLIC_PATHS as readonly string[]).includes(path);
}

export function normalizeHashPath(hash: string): string {
  const path = hash.replace(/^#/, '').trim();
  if (!path || path === '/') return '/login';
  return path.startsWith('/') ? path : `/${path}`;
}
