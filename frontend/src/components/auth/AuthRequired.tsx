import React from 'react';
import { Spinner } from '../ui/Spinner';
import { useAuthStore } from '../../stores/authStore';

interface AuthRequiredProps {
  children: React.ReactNode;
  isAuthHydrating: boolean;
}

/**
 * Gate component that shows a loading/redirect screen when the user isn't
 * authenticated. Extracted as a standalone component to prevent React
 * unmount/remount loops caused by inline component definitions.
 */
export function AuthRequired({ children, isAuthHydrating }: AuthRequiredProps) {
  const { user, accessToken } = useAuthStore();
  const isAuthenticated = Boolean(user && accessToken);

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
