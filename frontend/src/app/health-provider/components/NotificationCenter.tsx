import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Notification {
  id: number;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
}

interface NotificationCenterProps {
  providerId: number;
  onNotificationUpdate?: (count: number) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  providerId, 
  onNotificationUpdate 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only load notifications if we have a valid provider ID
    if (providerId > 0) {
      loadNotifications();
      
      // Set up real-time polling for notifications
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [providerId, filter]);

  const loadNotifications = async () => {
    // Don't make API call if provider ID is invalid
    if (providerId <= 0) {
      console.log('Skipping notifications load - invalid provider ID:', providerId);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      let url = `/api/health-provider/notifications?provider_id=${providerId}`;
      
      if (filter === 'unread') {
        url += '&read=false';
      } else if (filter === 'urgent') {
        url += '&priority=urgent';
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        
        const unread = data.notifications?.filter((n: Notification) => !n.is_read).length || 0;
        setUnreadCount(unread);
        onNotificationUpdate?.(unread);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/health-provider/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        onNotificationUpdate?.(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/health-provider/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        onNotificationUpdate?.(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/health-provider/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'appointment': return 'fa-calendar-check';
      case 'urgent': return 'fa-exclamation-triangle';
      case 'reminder': return 'fa-bell';
      case 'system': return 'fa-cog';
      case 'patient': return 'fa-user';
      default: return 'fa-info-circle';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-danger';
      case 'high': return 'text-warning';
      case 'medium': return 'text-info';
      default: return 'text-muted';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'urgent') return notification.priority === 'urgent';
    return true;
  });

  return (
    <div className="dropdown">
      <button 
        className="btn btn-outline-primary position-relative"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="dropdown-menu dropdown-menu-end show" style={{ width: '400px', maxHeight: '500px' }}>
          <div className="dropdown-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Notifications</h6>
            <div className="btn-group btn-group-sm">
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark All Read
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-bottom">
            <div className="btn-group btn-group-sm w-100">
              <button 
                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button 
                className={`btn ${filter === 'urgent' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('urgent')}
              >
                Urgent
              </button>
            </div>
          </div>

          <div className="notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {loading && (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {!loading && filteredNotifications.length === 0 && (
              <div className="text-center py-3">
                <i className="fas fa-inbox fa-2x text-muted mb-2"></i>
                <p className="text-muted mb-0">No notifications</p>
              </div>
            )}

            {!loading && filteredNotifications.map(notification => (
              <div 
                key={notification.id}
                className={`dropdown-item-text p-3 border-bottom ${!notification.is_read ? 'bg-light' : ''}`}
              >
                <div className="d-flex align-items-start">
                  <div className={`me-3 ${getPriorityColor(notification.priority)}`}>
                    <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className={`badge badge-sm bg-${notification.type === 'urgent' ? 'danger' : 'primary'}`}>
                        {notification.type}
                      </span>
                      <div className="dropdown">
                        <button 
                          className="btn btn-sm btn-link text-muted p-0"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          {!notification.is_read && (
                            <li>
                              <button 
                                className="dropdown-item"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <i className="fas fa-check me-2"></i>Mark as Read
                              </button>
                            </li>
                          )}
                          <li>
                            <button 
                              className="dropdown-item text-danger"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <i className="fas fa-trash me-2"></i>Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <p className="mb-1 small">{notification.message}</p>
                    <small className="text-muted">{formatTime(notification.created_at)}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && filteredNotifications.length > 0 && (
            <div className="dropdown-footer text-center py-2">
              <button 
                className="btn btn-sm btn-link"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page if available
                }}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="dropdown-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000
          }}
        />
      )}
    </div>
  );
};

export default NotificationCenter;
