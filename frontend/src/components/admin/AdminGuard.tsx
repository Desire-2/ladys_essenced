/**
 * Admin Route Guard Component
 * Protects admin routes from unauthorized access
 */
import React from 'react';
import { AlertTriangle, Loader } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface AdminGuardProps {
  children: React.ReactNode;
  onUnauthorized?: () => void;
}

export function AdminGuard({ children, onUnauthorized }: AdminGuardProps) {
  const { user, accessToken } = useAuthStore();

  // Still loading auth
  if (!accessToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <Loader className="w-8 h-8 text-terracotta animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Restoring your session…</p>
        </div>
      </div>
    );
  }

  // Not an admin user
  if (!user || user.user_type !== 'admin') {
    onUnauthorized?.();
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream p-4">
        <div className="text-center max-w-md space-y-4">
          <AlertTriangle className="w-12 h-12 text-mauve mx-auto" />
          <h2 className="text-lg font-bold font-heading text-ink">
            Unauthorized Access
          </h2>
          <p className="text-sm text-muted">
            Your account role is <strong>{user?.user_type.toUpperCase()}</strong>.
            The admin panel is restricted to administrators only.
          </p>
          <button
            type="button"
            onClick={() => onUnauthorized?.()}
            className="inline-block px-6 py-2.5 rounded-lg bg-terracotta text-white font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
