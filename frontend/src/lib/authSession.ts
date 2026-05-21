import type { User } from '../types';

function apiOrigin(): string {
  return import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(`${apiOrigin()}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  if (!res.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function fetchUserProfile(accessToken: string): Promise<User> {
  const res = await fetch(`${apiOrigin()}/auth/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch profile');
  }

  return res.json() as Promise<User>;
}

export function dashboardPathForUserType(userType: User['user_type']): string {
  switch (userType) {
    case 'parent':
      return '/dashboard/parent';
    case 'health_provider':
      return '/dashboard/provider';
    case 'admin':
      return '/dashboard/admin';
    case 'content_writer':
      return '/dashboard/writer';
    default:
      return '/dashboard';
  }
}
