/**
 * Parent Family Health Hub — layout, guard, and sub-route rendering.
 */
import React from 'react';
import { ParentGuard, ParentLayout } from '@/components/parent';
import { useParentDashboard } from '@/hooks/parent/useParentDashboard';
import { dashboardPathForUserType } from '@/lib/authSession';
import { useAuthStore } from '@/stores/authStore';
import { FamilyHubPage } from '@/dashboard/parent/FamilyHubPage';
import { ChildrenListPage } from '@/dashboard/parent/ChildrenListPage';
import { AddChildPage } from '@/dashboard/parent/AddChildPage';
import { ChildProfilePage } from '@/dashboard/parent/ChildProfilePage';
import { ChildCyclePage } from '@/dashboard/parent/ChildCyclePage';
import { ChildMealsPage } from '@/dashboard/parent/ChildMealsPage';
import { ChildAppointmentsPage } from '@/dashboard/parent/ChildAppointmentsPage';
import { ChildSettingsPage } from '@/dashboard/parent/ChildSettingsPage';
import { FamilyAppointmentsPage } from '@/dashboard/parent/FamilyAppointmentsPage';
import { BookAppointmentPage } from '@/dashboard/parent/BookAppointmentPage';
import { FamilyNotificationsPage } from '@/dashboard/parent/FamilyNotificationsPage';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/parent': 'Family Hub',
  '/dashboard/parent/children': 'Family Members',
  '/dashboard/parent/children/add': 'Add Family Member',
  '/dashboard/parent/appointments': 'Appointments',
  '/dashboard/parent/appointments/book': 'Book Appointment',
  '/dashboard/parent/notifications': 'Notifications',
};

function parseChildId(path: string): number | null {
  const m = path.match(/^\/dashboard\/parent\/children\/(\d+)/);
  return m ? Number(m[1]) : null;
}

function parseBookChildQuery(path: string): number | undefined {
  const q = path.split('?')[1];
  if (!q) return undefined;
  const params = new URLSearchParams(q);
  const child = params.get('child');
  return child ? Number(child) : undefined;
}

interface ParentShellProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function ParentShell({ currentPath, onNavigate }: ParentShellProps) {
  const { user } = useAuthStore();
  const { data } = useParentDashboard();

  const basePath = currentPath.split('?')[0];
  const childId = parseChildId(basePath);

  let pageTitle = PAGE_TITLES[basePath];
  if (!pageTitle && childId) {
    if (basePath.endsWith('/cycle')) pageTitle = 'Cycle & Health';
    else if (basePath.endsWith('/meals')) pageTitle = 'Meals';
    else if (basePath.endsWith('/appointments')) pageTitle = 'Appointments';
    else if (basePath.endsWith('/settings')) pageTitle = 'Profile & Privacy';
    else pageTitle = 'Family Member';
  }
  pageTitle = pageTitle ?? 'Family Hub';

  const renderPage = () => {
    if (basePath === '/dashboard/parent/children/add') {
      return <AddChildPage onNavigate={onNavigate} />;
    }
    if (basePath === '/dashboard/parent/children') {
      return <ChildrenListPage onNavigate={onNavigate} />;
    }
    if (basePath === '/dashboard/parent/appointments/book') {
      return (
        <BookAppointmentPage
          onNavigate={onNavigate}
          preselectedChildId={parseBookChildQuery(currentPath)}
        />
      );
    }
    if (basePath === '/dashboard/parent/appointments') {
      return <FamilyAppointmentsPage onNavigate={onNavigate} />;
    }
    if (basePath === '/dashboard/parent/notifications') {
      return <FamilyNotificationsPage onNavigate={onNavigate} />;
    }

    if (childId) {
      if (basePath.endsWith('/cycle')) {
        return <ChildCyclePage adolescentId={childId} onNavigate={onNavigate} />;
      }
      if (basePath.endsWith('/meals')) {
        return <ChildMealsPage adolescentId={childId} onNavigate={onNavigate} />;
      }
      if (basePath.endsWith('/appointments')) {
        return <ChildAppointmentsPage adolescentId={childId} onNavigate={onNavigate} />;
      }
      if (basePath.endsWith('/settings')) {
        return <ChildSettingsPage adolescentId={childId} onNavigate={onNavigate} />;
      }
      return <ChildProfilePage adolescentId={childId} onNavigate={onNavigate} />;
    }

    return <FamilyHubPage onNavigate={onNavigate} />;
  };

  return (
    <ParentGuard
      onUnauthorized={() => {
        if (user?.user_type) onNavigate(dashboardPathForUserType(user.user_type));
        else onNavigate('/login');
      }}
    >
      <ParentLayout
        currentPath={basePath}
        pageTitle={pageTitle}
        onNavigate={onNavigate}
        parentUnread={data?.parent_unread_notifications}
      >
        {renderPage()}
      </ParentLayout>
    </ParentGuard>
  );
}
