'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { buildHealthProviderApiUrl } from '../../utils/apiConfig';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface RealTimeNotificationsProps {
  onNotificationCount: (count: number) => void;
}

export default function RealTimeNotifications({ onNotificationCount }: RealTimeNotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.user_id) return;
    
    setLoading(true);
    try {
      const response = await healthProviderAPI.getNotifications(user.user_id);
      setNotifications(response.data.notifications || []);
      const unread = (response.data.notifications || []).filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unread);
      onNotificationCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    if (!user?.user_id) return;
    
    try {
      await healthProviderAPI.markNotificationRead(notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      onNotificationCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.user_id) return;
    
    try {
      // Mark all notifications as read individually since there's no bulk endpoint
      await Promise.all(
        notifications
          .filter(n => !n.is_read)
          .map(n => healthProviderAPI.markNotificationRead(n.id))
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      onNotificationCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Auto-refresh notifications
  useEffect(() => {
    loadNotifications();
    
    // Set up polling for new notifications
    const interval = setInterval(loadNotifications, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.user_id]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'fas fa-check-circle text-success';
      case 'warning': return 'fas fa-exclamation-triangle text-warning';
      case 'error': return 'fas fa-times-circle text-danger';
      default: return 'fas fa-info-circle text-info';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-danger';
      case 'high': return 'border-warning';
      case 'normal': return 'border-info';
      default: return 'border-secondary';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const date = new Date(dateString).getTime();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="position-relative">
      {/* Notification Bell */}
      <button
        className="btn btn-outline-primary position-relative"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <div className="notifications-dropdown shadow">
          <div className="dropdown-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="fas fa-bell me-2"></i>
                Notifications
              </h6>
              <div className="d-flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    className="btn btn-sm btn-link text-primary"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-link text-secondary"
                  onClick={() => setShowDropdown(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="notifications-list">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4">
                <i className="fas fa-bell-slash fa-2x text-muted mb-2"></i>
                <p className="text-muted mb-0">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''} ${getPriorityColor(notification.priority)}`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="d-flex align-items-start">
                    <div className="notification-icon me-3">
                      <i className={getNotificationIcon(notification.type)}></i>
                    </div>
                    <div className="notification-content flex-grow-1">
                      <h6 className="notification-title">{notification.title}</h6>
                      <p className="notification-message">{notification.message}</p>
                      <small className="notification-time text-muted">
                        {formatTimeAgo(notification.created_at)}
                      </small>
                    </div>
                    {!notification.is_read && (
                      <div className="unread-indicator"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="dropdown-footer">
              <button className="btn btn-link text-primary w-100">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {showDropdown && (
        <div 
          className="notifications-overlay"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}

      <style jsx>{`
        .notification-badge {
          font-size: 0.6rem;
          min-width: 18px;
          height: 18px;
          line-height: 18px;
          padding: 0;
        }

        .notifications-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 1050;
          width: 350px;
          max-height: 500px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 8px;
        }

        .dropdown-header {
          padding: 16px 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }

        .notifications-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f3f4;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-left: 3px solid transparent;
        }

        .notification-item:hover {
          background-color: #f8f9fa;
        }

        .notification-item.unread {
          background-color: #f0f8ff;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-icon {
          width: 24px;
          text-align: center;
        }

        .notification-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .notification-message {
          font-size: 0.85rem;
          color: #6c757d;
          margin-bottom: 4px;
          line-height: 1.4;
        }

        .notification-time {
          font-size: 0.75rem;
        }

        .unread-indicator {
          width: 8px;
          height: 8px;
          background-color: #007bff;
          border-radius: 50%;
          margin-top: 4px;
        }

        .dropdown-footer {
          padding: 12px 20px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
        }

        .notifications-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1040;
          background: transparent;
        }

        /* Priority border colors */
        .border-danger {
          border-left-color: #dc3545 !important;
        }

        .border-warning {
          border-left-color: #ffc107 !important;
        }

        .border-info {
          border-left-color: #0dcaf0 !important;
        }

        .border-secondary {
          border-left-color: #6c757d !important;
        }

        /* Scrollbar styling */
        .notifications-list::-webkit-scrollbar {
          width: 6px;
        }

        .notifications-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .notifications-list::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .notifications-list::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
}
