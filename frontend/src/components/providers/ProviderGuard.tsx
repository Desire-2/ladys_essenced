import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { dashboardPathForUserType } from '@/lib/authSession';

interface ProviderGuardProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

export function ProviderGuard({ children, onNavigate }: ProviderGuardProps) {
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      onNavigate('/login');
      return;
    }
    if (user && user.user_type !== 'health_provider') {
      onNavigate(dashboardPathForUserType(user.user_type));
    }
  }, [user, accessToken, onNavigate]);

  if (!user || user.user_type !== 'health_provider') return null;
  return <>{children}</>;
}
