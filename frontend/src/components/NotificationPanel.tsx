import React, { useEffect } from 'react';
import { X, Trash2, Check, CheckCheck } from 'lucide-react';
import { useNotificationStore } from '../stores/notificationStore';
import { useNotificationAPI } from '../hooks/useNotificationAPI';
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications';
import { formatDistanceToNow } from 'date-fns';

export const NotificationPanel: React.FC = () => {
  const {
    notifications,
    showPanel,
    setShowPanel,
    unreadCount,
    isLoading,
    error,
  } = useNotificationStore();
  
  const {
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllRead,
  } = useNotificationAPI();
  
  const { emitMarkAsRead, isConnected } = useWebSocketNotifications();

  // Handle marking as read - use WebSocket if available, otherwise API
  const handleMarkAsRead = async (id: number) => {
    if (isConnected) {
      emitMarkAsRead(id);
    } else {
      await markNotificationAsRead(id);
    }
  };

  // Determine notification color based on type
  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'info':
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const getNotificationIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'success':
        return <CheckCheck className="w-5 h-5 text-green-600" />;
      case 'error':
        return <X className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <CheckCheck className="w-5 h-5 text-yellow-600" />;
      case 'info':
      default:
        return <Check className="w-5 h-5 text-blue-600" />;
    }
  };

  if (!showPanel) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={() => setShowPanel(false)}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Notifications</h2>
              <p className="text-blue-100 text-sm mt-1">
                {unreadCount} unread • {notifications.length} total
              </p>
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="p-2 hover:bg-blue-600 rounded-lg transition"
              aria-label="Close notifications"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 px-6 py-3 border-b border-gray-200 bg-gray-50">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Mark all as read"
            >
              Mark all as read
            </button>
          )}
          {notifications.some((n) => n.is_read) && (
            <button
              onClick={() => clearAllRead()}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
              title="Clear read notifications"
            >
              Clear read
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="m-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="overflow-y-auto h-[calc(100vh-200px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Check className="w-12 h-12 mb-2 opacity-30" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No notifications at the moment</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition ${
                    notification.is_read ? 'opacity-75' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1.5 hover:bg-gray-200 rounded transition"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 hover:bg-red-100 rounded transition"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
