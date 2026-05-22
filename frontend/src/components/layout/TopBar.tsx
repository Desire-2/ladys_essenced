import React, { useState, useEffect } from 'react';
import { Bell, Heart, LogOut, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/axios';
import { asArray } from '../../lib/apiHelpers';
import { Notification } from '../../types';
import { mapNotification } from '../../lib/notificationsApi';

interface TopBarProps {
  onNavigate: (path: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const notificationsPath =
    user?.user_type === 'parent' ? '/dashboard/parent/notifications' : '/dashboard/notifications';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/notifications/recent', { params: { limit: 10 } })
        .then((res) => {
          const rows = asArray<Record<string, unknown>>(res.data);
          setNotifications(rows.map(mapNotification));
        })
        .catch(() => setNotifications([]));
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleNotificationClick = async (notifId: number) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setIsDropdownOpen(false);
      onNavigate(notificationsPath);
    } catch {}
  };

  // Nurturing cultural greeting based on local timestamp
  const getGreeting = () => {
    const hours = new Date().getHours();
    let label = 'Muraho'; // Traditional "Hello/Good day" in Kinyarwanda
    if (hours < 12) label = 'Mwaramutse'; // Good morning
    else if (hours >= 17) label = 'Mwiriwe'; // Good evening
    
    return `${label}, ${user?.first_name || 'Friend'}`;
  };

  return (
    <header className="flex items-center justify-between h-16 bg-surface border-b border-border px-6 sticky top-0 z-30 font-sans shadow-sm select-none">
      
      {/* Organic greeting segment */}
      <div className="flex flex-col text-left">
        <h2 className="text-lg md:text-xl font-heading font-semibold text-ink leading-tight flex items-center gap-1.5">
          {getGreeting()} <span className="text-terracotta text-sm">❤️</span>
        </h2>
        <span className="text-xs text-muted/90 font-medium">Have safe, dignified, and empowered control over your health.</span>
      </div>

      {/* Side tools */}
      <div className="flex items-center gap-4">
        
        {/* Clickable Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 text-muted hover:text-terracotta relative rounded-full transition-colors cursor-pointer focus:ring-1 focus:ring-terracotta/40 text-center"
            aria-label="Notification alerts"
          >
            <Bell className="w-5.5 h-5.5" />
            
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-mauve text-surface flex items-center justify-center text-[9px] font-bold animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Quick-alert Notifications Dropdown Panel */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3.5 w-80 bg-surface border border-border rounded-xl p-4 shadow-elevated z-50 text-left animate-[fadeInUp_0.15s_ease-out]">
              <div className="flex items-center justify-between pb-2 border-b border-border mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Recent Notices</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] text-terracotta font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted">No recent notifications.</div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {notifications.slice(0, 3).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className="w-full text-left p-2 rounded-lg hover:bg-cream/40 transition-colors cursor-pointer border-l-2 border-transparent hover:border-terracotta block"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-ink">{notif.title}</span>
                        {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-mauve" />}
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2">{notif.message}</p>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onNavigate(notificationsPath);
                }}
                className="w-full mt-3 pt-2 text-center text-xs font-semibold text-terracotta border-t border-border hover:underline hover:text-terracotta/85 cursor-pointer block"
              >
                View all notifications ({notifications.length})
              </button>
            </div>
          )}
        </div>

        {/* User initials fallback Avatar */}
        {user && (
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('/settings')}>
            <Avatar firstName={user.first_name} lastName={user.last_name} size="md" />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-ink">{user.first_name} {user.last_name}</span>
              <span className="text-[10px] font-semibold tracking-wider text-muted uppercase">{user.user_type.replace('_', ' ')}</span>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
export default TopBar;
