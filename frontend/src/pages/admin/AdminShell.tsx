/**
 * Admin dashboard shell — layout, guard, and sub-route rendering.
 */
import React from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { dashboardPathForUserType } from '@/lib/authSession';
import { useAuthStore } from '@/stores/authStore';
import { AdminOverviewPage } from './OverviewPage';
import { UsersPage } from './UsersPage';
import { ProvidersPage } from './ProvidersPage';
import { ContentPage } from './ContentPage';
import { AnalyticsPage } from './AnalyticsPage';
import { AppointmentsPage } from './AppointmentsPage';
import { LogsPage } from './LogsPage';

const ADMIN_PAGE_TITLES: Record<string, string> = {
  '/dashboard/admin': 'System Overview',
  '/dashboard/admin/users': 'User Management',
  '/dashboard/admin/providers': 'Health Providers',
  '/dashboard/admin/content': 'Content Moderation',
  '/dashboard/admin/analytics': 'Analytics & Reports',
  '/dashboard/admin/appointments': 'Appointments',
  '/dashboard/admin/logs': 'Audit Logs',
};

const ADMIN_PATHS = new Set(Object.keys(ADMIN_PAGE_TITLES));

interface AdminShellProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function AdminShell({ currentPath, onNavigate }: AdminShellProps) {
  const { user } = useAuthStore();

  const resolvedPath = ADMIN_PATHS.has(currentPath) ? currentPath : '/dashboard/admin';
  const pageTitle = ADMIN_PAGE_TITLES[resolvedPath] ?? 'Admin Dashboard';

  const renderPage = () => {
    switch (resolvedPath) {
      case '/dashboard/admin/users':
        return <UsersPage onNavigate={onNavigate} />;
      case '/dashboard/admin/providers':
        return <ProvidersPage onNavigate={onNavigate} />;
      case '/dashboard/admin/content':
        return <ContentPage onNavigate={onNavigate} />;
      case '/dashboard/admin/analytics':
        return <AnalyticsPage onNavigate={onNavigate} />;
      case '/dashboard/admin/appointments':
        return <AppointmentsPage onNavigate={onNavigate} />;
      case '/dashboard/admin/logs':
        return <LogsPage onNavigate={onNavigate} />;
      case '/dashboard/admin':
      default:
        return <AdminOverviewPage onNavigate={onNavigate} />;
    }
  };

  return (
    <AdminGuard
      onUnauthorized={() => {
        if (user?.user_type) {
          onNavigate(dashboardPathForUserType(user.user_type));
        } else {
          onNavigate('/login');
        }
      }}
    >
      <AdminLayout
        currentPath={resolvedPath}
        pageTitle={pageTitle}
        onNavigate={onNavigate}
      >
        {renderPage()}
      </AdminLayout>
    </AdminGuard>
  );
}
