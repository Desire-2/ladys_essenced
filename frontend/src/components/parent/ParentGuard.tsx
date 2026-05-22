import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';

interface ParentGuardProps {
  children: React.ReactNode;
  onUnauthorized: () => void;
}

export function ParentGuard({ children, onUnauthorized }: ParentGuardProps) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.user_type !== 'parent') {
      onUnauthorized();
    }
  }, [user, onUnauthorized]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Spinner />
      </div>
    );
  }

  if (user.user_type !== 'parent') {
    return null;
  }

  return <>{children}</>;
}
