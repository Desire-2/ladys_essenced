import React from 'react';
import { 
  Home, Heart, Utensils, CalendarDays, 
  Bell, Settings, Users, LogOut, BookOpen, ShieldAlert, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import { UserType } from '../../types';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: UserType[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { user, logout } = useAuthStore();
  const userType = user?.user_type || 'adolescent';
  
  // Dynamic navigation items based on system specifications
  const navItems: NavItem[] = [
    { label: 'Home', path: '/dashboard', icon: Home, roles: ['adolescent'] },
    { label: 'Cycle Tracker', path: '/dashboard/cycle', icon: Heart, roles: ['adolescent'] },
    { label: 'Meal Log', path: '/dashboard/meals', icon: Utensils, roles: ['adolescent'] },
    { label: 'Appointments', path: '/dashboard/appointments', icon: CalendarDays, roles: ['adolescent'] },
    { label: 'Umwari AI Sister', path: '/dashboard/umwari', icon: Sparkles, roles: ['adolescent', 'parent'] },
    
    // Parent paths
    { label: 'Children', path: '/dashboard/parent', icon: Users, roles: ['parent'] },
    
    // Medical staff
    { label: 'Clinic Desk', path: '/dashboard/provider', icon: CalendarDays, roles: ['health_provider'] },
    
    // Administrative
    { label: 'Control Panel', path: '/dashboard/admin', icon: ShieldAlert, roles: ['admin'] },
    
    // Creative/Author
    { label: 'Curation', path: '/dashboard/writer', icon: BookOpen, roles: ['content_writer'] },
    
    // Shared
    { label: 'Notifications', path: '/dashboard/notifications', icon: Bell, roles: ['adolescent', 'parent', 'health_provider', 'admin', 'content_writer'] },
    { label: 'Settings', path: '/settings', icon: Settings, roles: ['adolescent', 'parent', 'health_provider', 'admin', 'content_writer'] },
  ];

  // Filter paths matching user type
  const allowedItems = navItems.filter(item => item.roles.includes(userType));

  return (
    <>
      {/* DESKTOP SIDEBAR - Hidden on Mobile */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border h-screen sticky top-0 font-sans shadow-card select-none">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-border text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-terracotta/10 border border-terracotta/20 flex items-center justify-center text-terracotta mb-2 text-xl font-heading font-semibold">
            LE
          </div>
          <span className="font-heading text-lg font-semibold tracking-wide text-ink">Lady's Essence</span>
          <span className="text-xs text-muted/80 tracking-widest uppercase font-semibold mt-0.5">Rwanda</span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  'flex items-center gap-3.5 w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer border border-transparent',
                  isActive 
                    ? 'bg-terracotta text-surface shadow-card border-terracotta/10 font-semibold' 
                    : 'text-muted hover:text-ink hover:bg-border/30'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105', isActive ? 'text-surface' : 'text-muted group-hover:text-terracotta')} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout session block */}
        <div className="p-4 border-t border-border bg-cream/30">
          <button
            onClick={logout}
            className="flex items-center gap-3.5 w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-mauve hover:bg-mauve/10 cursor-pointer transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM TAB BAR - Collapsed layout for small screens */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border p-1.5 pb-safe-bottom z-40 flex items-center justify-around h-16 shadow-elevated">
        {allowedItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-colors cursor-pointer text-center relative py-1 text-xs font-semibold',
                isActive ? 'text-terracotta font-bold' : 'text-muted'
              )}
              style={{ minHeight: '44px' }}
            >
              <Icon className={cn('w-5.5 h-5.5 mb-0.5 transition-transform', isActive ? 'text-terracotta scale-110' : 'text-muted')} />
              <span className="scale-90">{item.label}</span>
              
              {isActive && (
                <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-terracotta" />
              )}
            </button>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center flex-1 h-full text-mauve rounded-lg text-xs font-semibold"
          style={{ minHeight: '44px' }}
        >
          <LogOut className="w-5.5 h-5.5 mb-0.5 text-mauve" />
          <span className="scale-90">Exit</span>
        </button>
      </nav>
    </>
  );
};
export default Sidebar;
