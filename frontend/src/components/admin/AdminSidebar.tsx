/**
 * Admin Sidebar Component
 * Dark sidebar with navigation and stat badges
 */
import React from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  BarChart2,
  Calendar,
  ScrollText,
} from 'lucide-react';
import { useAdminStats } from '@/hooks/admin';

interface AdminSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const NAV_ITEMS = [
  { label: 'Overview', path: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Users', path: '/dashboard/admin/users', icon: Users, badge: 'total_users' },
  { label: 'Providers', path: '/dashboard/admin/providers', icon: Stethoscope, badge: 'pending_verifications' },
  { label: 'Content', path: '/dashboard/admin/content', icon: FileText, badge: 'pending_content' },
  { label: 'Analytics', path: '/dashboard/admin/analytics', icon: BarChart2 },
  { label: 'Appointments', path: '/dashboard/admin/appointments', icon: Calendar },
  { label: 'Audit Logs', path: '/dashboard/admin/logs', icon: ScrollText },
];

export function AdminSidebar({ currentPath, onNavigate }: AdminSidebarProps) {
  const { stats } = useAdminStats();

  const getBadgeValue = (badge: string | undefined): number | null => {
    if (!badge || !stats) return null;
    return (stats as any)[badge] ?? null;
  };

  return (
    <aside className="w-60 min-h-screen bg-ink text-cream border-r border-opacity-20 border-terracotta flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-opacity-20 border-terracotta">
        <h1 className="text-xl font-bold font-heading italic">LE Admin</h1>
        <p className="text-xs text-cream/60 mt-1">Control Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          const badgeValue = getBadgeValue(item.badge);

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full px-4 py-2.5 rounded-lg flex items-center gap-3 transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-terracotta/20 text-terracotta border-l-2 border-terracotta'
                  : 'text-cream/80 hover:text-cream hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {badgeValue !== null && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                    badgeValue > 0
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-sage/20 text-sage'
                  }`}
                >
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-opacity-20 border-terracotta text-xs text-cream/60">
        <p>Lady's Essence Admin</p>
        <p>v1.0.0</p>
      </div>
    </aside>
  );
}
