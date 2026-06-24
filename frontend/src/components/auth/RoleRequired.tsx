import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuthStore } from '../../stores/authStore';

interface RoleRequiredProps {
  children: React.ReactNode;
  allowed: string[];
  navigate: (path: string) => void;
}

/**
 * Gate component that enforces role-based access to sections.
 * Extracted as a standalone component to prevent React unmount/remount loops
 * caused by inline component definitions inside App.tsx.
 */
export function RoleRequired({ children, allowed, navigate }: RoleRequiredProps) {
  const { user, accessToken } = useAuthStore();
  const isAuthenticated = Boolean(user && accessToken);

  if (!isAuthenticated || !user) {
    return null;
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
