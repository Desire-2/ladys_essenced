import {
  Bell,
  Calendar,
  CalendarDays,
  Clock,
  Inbox,
  LayoutDashboard,
  UserCircle,
  Users,
} from 'lucide-react';

const PROVIDER_NAV = [
  { label: 'Dashboard', href: '/providers', icon: LayoutDashboard, badgeKey: null as string | null },
  { label: 'Appointments', href: '/providers/appointments', icon: Calendar, badgeKey: 'pending' },
  { label: 'Claim Queue', href: '/providers/appointments/unassigned', icon: Inbox, badgeKey: 'unassigned' },
  { label: 'Schedule', href: '/providers/schedule', icon: CalendarDays, badgeKey: null },
  { label: 'Patients', href: '/providers/patients', icon: Users, badgeKey: null },
  { label: 'Availability', href: '/providers/availability', icon: Clock, badgeKey: null },
  { label: 'Notifications', href: '/providers/notifications', icon: Bell, badgeKey: 'unread' },
  { label: 'Profile', href: '/providers/profile', icon: UserCircle, badgeKey: null },
];

interface ProviderSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  badges?: { pending?: number; unassigned?: number; unread?: number };
}

export function ProviderSidebar({ currentPath, onNavigate, badges = {} }: ProviderSidebarProps) {
  const badgeValue = (key: string | null) => {
    if (!key) return 0;
    return badges[key as keyof typeof badges] ?? 0;
  };

  return (
    <aside className="provider-sidebar w-56 shrink-0 border-r border-border bg-surface hidden md:flex flex-col">
      <div className="p-5 border-b border-border">
        <p className="text-xs uppercase tracking-wider text-muted font-semibold">Clinic desk</p>
        <p className="font-heading font-bold text-ink text-lg mt-0.5">Lady&apos;s Essence</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {PROVIDER_NAV.map((item) => {
          const active =
            currentPath === item.href ||
            (item.href !== '/providers' && currentPath.startsWith(item.href));
          const count = badgeValue(item.badgeKey);
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => onNavigate(item.href)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-sage/20 text-ink border border-sage/30'
                  : 'text-muted hover:bg-cream hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-terracotta text-surface text-[10px] font-bold flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
