import React, { useEffect } from 'react';
import { Spinner } from '../ui/Spinner';
import { useAuthStore } from '../../stores/authStore';

interface AuthRequiredProps {
  children: React.ReactNode;
  isAuthHydrating: boolean;
  navigate: (path: string) => void;
}

/**
 * Gate component that shows a loading screen while hydrating and redirects
 * unauthenticated users to /login via the provided navigate callback.
 */
export function AuthRequired({ children, isAuthHydrating, navigate }: AuthRequiredProps) {
  const { user, accessToken } = useAuthStore();
  const isAuthenticated = Boolean(user && accessToken);

  useEffect(() => {
    // Once hydration is complete and user is still not authenticated, redirect
    if (!isAuthHydrating && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthHydrating, isAuthenticated, navigate]);

  if (isAuthHydrating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-cream text-center font-sans">
        <Spinner className="mb-4" size="lg" />
        <p className="text-sm text-muted">Restoring your session…</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-cream text-center font-sans">
        <Spinner className="mb-4" size="lg" />
        <p className="text-sm text-muted">Redirecting to sign in…</p>
      </div>
    );
  }

  return <>{children}</>;
}
