import React, { useEffect } from 'react';
import { Spinner } from '../ui/Spinner';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';

interface RoleRequiredProps {
  children: React.ReactNode;
  allowed: string[];
  navigate: (path: string) => void;
  isAuthHydrating?: boolean;
}

/**
 * Gate component that enforces authentication + role-based access.
 * Redirects to /login if not authenticated, and shows an unauthorized
 * message with a link to the correct dashboard if the role is wrong.
 */
export function RoleRequired({ children, allowed, navigate, isAuthHydrating = false }: RoleRequiredProps) {
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

  if (!allowed.includes(user.user_type)) {
    return (
      <div className="p-8 bg-surface border border-border rounded-xl max-w-md mx-auto my-12 text-center font-sans space-y-4">
        <AlertTriangle className="w-12 h-12 text-mauve mx-auto" />
        <h2 className="text-lg font-bold font-heading text-ink text-center">Unauthorized Role Segment</h2>
        <p className="text-xs text-muted">
          Your account role is <strong>{user?.user_type.toUpperCase()}</strong>. This system view is protected.
        </p>
        <Button
          onClick={() => {
            if (user?.user_type === 'parent') navigate('/dashboard/parent');
            else if (user?.user_type === 'health_provider') navigate('/providers');
            else if (user?.user_type === 'admin') navigate('/dashboard/admin');
            else if (user?.user_type === 'content_writer') navigate('/dashboard/writer');
            else navigate('/dashboard');
          }}
          className="w-full"
        >
          Return to Authorized Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
