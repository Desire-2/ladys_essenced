import { useEffect, useState } from 'react';
import { ProviderGuard } from '@/components/providers/ProviderGuard';
import { ProviderLayout } from '@/components/providers/ProviderLayout';
import { providerApi } from '@/services/providerApi';
import { ProviderDashboardPage } from './index';
import { ProviderAppointmentsPage } from './appointments/index';
import { ProviderUnassignedPage } from './appointments/unassigned';
import { ProviderAppointmentDetailPage } from './appointments/detail';
import { ProviderSchedulePage } from './schedule/index';
import { ProviderPatientsPage } from './patients/index';
import { ProviderAvailabilityPage } from './availability/index';
import { ProviderNotificationsPage } from './notifications/index';
import { ProviderProfilePage } from './profile/index';

const PAGE_TITLES: Record<string, string> = {
  '/providers': 'Clinical dashboard',
  '/providers/appointments': 'Appointments',
  '/providers/appointments/unassigned': 'Claim queue',
  '/providers/schedule': 'Schedule',
  '/providers/patients': 'Patients',
  '/providers/availability': 'Availability',
  '/providers/notifications': 'Notifications',
  '/providers/profile': 'Profile',
};

interface ProviderShellProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function ProviderShell({ currentPath, onNavigate }: ProviderShellProps) {
  const [badges, setBadges] = useState({ pending: 0, unassigned: 0, unread: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [stats, unassigned, notifs] = await Promise.all([
          providerApi.getDashboardStats(),
          providerApi.getUnassignedAppointments(),
          providerApi.getNotifications(1, 50),
        ]);
        if (cancelled) return;
        setBadges({
          pending: stats.appointment_stats.pending,
          unassigned: unassigned.appointments.length,
          unread: notifs.notifications.filter((n) => !n.is_read).length,
        });
      } catch {
        /* sidebar badges are non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentPath]);

  const renderPage = () => {
    if (currentPath.startsWith('/providers/appointments/') && currentPath !== '/providers/appointments/unassigned') {
      const match = currentPath.match(/^\/providers\/appointments\/(\d+)$/);
      if (match) {
        return (
          <ProviderAppointmentDetailPage
            appointmentId={Number(match[1])}
            onNavigate={onNavigate}
          />
        );
      }
    }
    switch (currentPath) {
      case '/providers/appointments':
        return <ProviderAppointmentsPage onNavigate={onNavigate} />;
      case '/providers/appointments/unassigned':
        return <ProviderUnassignedPage onNavigate={onNavigate} />;
      case '/providers/schedule':
        return <ProviderSchedulePage onNavigate={onNavigate} />;
      case '/providers/patients':
        return <ProviderPatientsPage onNavigate={onNavigate} />;
      case '/providers/availability':
        return <ProviderAvailabilityPage />;
      case '/providers/notifications':
        return <ProviderNotificationsPage />;
      case '/providers/profile':
        return <ProviderProfilePage />;
      case '/providers':
      default:
        return <ProviderDashboardPage onNavigate={onNavigate} />;
    }
  };

  const pageTitle = PAGE_TITLES[currentPath] ?? PAGE_TITLES['/providers'];

  return (
    <ProviderGuard onNavigate={onNavigate}>
      <ProviderLayout
        currentPath={currentPath}
        pageTitle={pageTitle}
        onNavigate={onNavigate}
        badges={badges}
      >
        {renderPage()}
      </ProviderLayout>
    </ProviderGuard>
  );
}
