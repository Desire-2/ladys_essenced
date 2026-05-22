import React from 'react';
import { Home, Users, Calendar, Bell, Settings } from 'lucide-react';
import { FamilySwitcher } from './FamilySwitcher';

const PARENT_NAV = [
  { label: 'Family Hub', href: '/dashboard/parent', icon: Home },
  { label: 'Family Members', href: '/dashboard/parent/children', icon: Users },
  { label: 'Appointments', href: '/dashboard/parent/appointments', icon: Calendar },
  { label: 'Notifications', href: '/dashboard/parent/notifications', icon: Bell, badge: true },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface ParentSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadCount?: number;
}

export function ParentSidebar({ currentPath, onNavigate, unreadCount = 0 }: ParentSidebarProps) {
  return (
    <aside className="parent-sidebar w-64 shrink-0 bg-mauve text-cream min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="font-heading text-xl font-bold text-cream">Lady&apos;s Essence</h1>
        <p className="text-xs text-cream/60 mt-1">Family Health Hub</p>
      </div>

      <FamilySwitcher onNavigate={onNavigate} />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {PARENT_NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/dashboard/parent'
              ? currentPath === '/dashboard/parent'
              : currentPath.startsWith(item.href);
          const badge =
            item.badge && unreadCount > 0 ? (
              <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null;

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => onNavigate(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white/15 text-cream font-semibold'
                  : 'text-cream/75 hover:bg-white/10 hover:text-cream'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {badge}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
