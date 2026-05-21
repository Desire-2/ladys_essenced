import React from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../stores/notificationStore';
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications';

interface NotificationBellProps {
  onClick?: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, className = '' }) => {
  const { unreadCount, showPanel, setShowPanel } = useNotificationStore();
  const { isConnected } = useWebSocketNotifications();

  const handleClick = () => {
    setShowPanel(!showPanel);
    onClick?.();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        {!isConnected && (
          <div
            className="absolute bottom-0 right-0 w-2 h-2 bg-gray-400 rounded-full animate-pulse"
            title="Using polling mode"
          />
        )}
      </button>
    </div>
  );
};
