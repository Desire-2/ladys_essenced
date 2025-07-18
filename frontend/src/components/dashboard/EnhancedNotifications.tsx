'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'appointment' | 'cycle' | 'meal';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: {
    appointment_id?: number;
    cycle_day?: number;
    meal_reminder?: boolean;
    provider_name?: string;
  };
}

interface EnhancedNotificationsProps {
  onNotificationCount?: (count: number) => void;
  showDropdown?: boolean;
  maxDisplay?: number;
}

export default function EnhancedNotifications({ 
  onNotificationCount, 
  showDropdown = true,
  maxDisplay = 5 
}: EnhancedNotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.access_token) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter((n: NotificationItem) => !n.is_read).length;
        setUnreadCount(unread);
        onNotificationCount?.(unread);
      } else {
        // Generate mock notifications for demonstration
        const mockNotifications = generateMockNotifications();
        setNotifications(mockNotifications);
        const unread = mockNotifications.filter(n => !n.is_read).length;
        setUnreadCount(unread);
        onNotificationCount?.(unread);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Generate mock notifications for demonstration
      const mockNotifications = generateMockNotifications();
      setNotifications(mockNotifications);
      const unread = mockNotifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      onNotificationCount?.(unread);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock notifications
  const generateMockNotifications = (): NotificationItem[] => {
    const now = new Date();
    return [
      {
        id: 1,
        title: 'Appointment Reminder',
        message: 'You have an appointment with Dr. Smith tomorrow at 2:00 PM',
        type: 'appointment',
        priority: 'high',
        is_read: false,
        created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        metadata: { appointment_id: 123, provider_name: 'Dr. Smith' }
      },
      {
        id: 2,
        title: 'Period Prediction',
        message: 'Your next period is expected to start in 3 days',
        type: 'cycle',
        priority: 'normal',
        is_read: false,
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: { cycle_day: 25 }
      },
      {
        id: 3,
        title: 'Meal Reminder',
        message: 'Don\'t forget to log your lunch today!',
        type: 'meal',
        priority: 'low',
        is_read: true,
        created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        metadata: { meal_reminder: true }
      },
      {
        id: 4,
        title: 'Health Tip',
        message: 'Stay hydrated! Aim for 8 glasses of water today.',
        type: 'info',
        priority: 'low',
        is_read: true,
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 5,
        title: 'Appointment Confirmed',
        message: 'Your appointment with Dr. Johnson has been confirmed for Friday',
        type: 'success',
        priority: 'normal',
        is_read: false,
        created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        metadata: { appointment_id: 124, provider_name: 'Dr. Johnson' }
      }
    ];
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        onNotificationCount?.(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Update locally anyway for demo
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      onNotificationCount?.(Math.max(0, unreadCount - 1));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        onNotificationCount?.(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Update locally anyway for demo
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      onNotificationCount?.(0);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
          onNotificationCount?.(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Update locally anyway for demo
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        onNotificationCount?.(Math.max(0, unreadCount - 1));
      }
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return 'fa-calendar-check';
      case 'cycle': return 'fa-calendar-alt';
      case 'meal': return 'fa-utensils';
      case 'success': return 'fa-check-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'error': return 'fa-times-circle';
      case 'reminder': return 'fa-bell';
      default: return 'fa-info-circle';
    }
  };

  // Get color for notification type
  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'text-danger';
    switch (type) {
      case 'appointment': return 'text-primary';
      case 'cycle': return 'text-info';
      case 'meal': return 'text-warning';
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-danger';
      default: return 'text-secondary';
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.is_read;
      case 'urgent': return notification.priority === 'urgent' || notification.priority === 'high';
      default: return true;
    }
  });

  // Setup real-time updates
  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    intervalRef.current = setInterval(loadNotifications, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!showDropdown) {
    // Simple notification list without dropdown
    return (
      <div className="notifications-list">
        {filteredNotifications.slice(0, maxDisplay).map(notification => (
          <div
            key={notification.id}
            className={`notification-item d-flex align-items-start p-3 border-bottom ${!notification.is_read ? 'bg-light' : ''}`}
          >
            <div className={`me-3 ${getNotificationColor(notification.type, notification.priority)}`}>
              <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
            </div>
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1">{notification.title}</h6>
                  <p className="mb-1 text-muted small">{notification.message}</p>
                  <small className="text-muted">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </small>
                </div>
                <div className="dropdown">
                  <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                  <ul className="dropdown-menu">
                    {!notification.is_read && (
                      <li>
                        <button className="dropdown-item" onClick={() => markAsRead(notification.id)}>
                          <i className="fas fa-check me-2"></i>Mark as Read
                        </button>
                      </li>
                    )}
                    <li>
                      <button className="dropdown-item text-danger" onClick={() => deleteNotification(notification.id)}>
                        <i className="fas fa-trash me-2"></i>Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        className="btn btn-outline-secondary position-relative"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 99 ? '99+' : unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="dropdown-menu dropdown-menu-end show position-absolute" style={{ width: '400px', maxHeight: '500px' }}>
          {/* Header */}
          <div className="dropdown-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Notifications</h6>
            <div className="d-flex gap-2">
              {unreadCount > 0 && (
                <button className="btn btn-sm btn-outline-primary" onClick={markAllAsRead}>
                  Mark All Read
                </button>
              )}
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setIsOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-bottom">
            <div className="btn-group btn-group-sm w-100" role="group">
              <button
                type="button"
                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                className={`btn ${filter === 'urgent' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter('urgent')}
              >
                Urgent
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="notifications-scroll" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`dropdown-item-text p-3 border-bottom ${!notification.is_read ? 'bg-light' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="d-flex align-items-start">
                    <div className={`me-3 ${getNotificationColor(notification.type, notification.priority)}`}>
                      <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h6 className="mb-1 text-truncate">{notification.title}</h6>
                          <p className="mb-1 small text-muted">{notification.message}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </small>
                            {notification.priority === 'urgent' && (
                              <span className="badge bg-danger">Urgent</span>
                            )}
                            {notification.priority === 'high' && (
                              <span className="badge bg-warning">High</span>
                            )}
                          </div>
                        </div>
                        <div className="dropdown ms-2">
                          <button 
                            className="btn btn-sm btn-outline-secondary" 
                            data-bs-toggle="dropdown"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            {!notification.is_read && (
                              <li>
                                <button 
                                  className="dropdown-item" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <i className="fas fa-check me-2"></i>Mark as Read
                                </button>
                              </li>
                            )}
                            <li>
                              <button 
                                className="dropdown-item text-danger" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <i className="fas fa-trash me-2"></i>Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="fas fa-bell-slash fa-2x mb-2"></i>
                <p className="mb-0">No notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="dropdown-header">
            <a href="/notifications" className="btn btn-sm btn-outline-primary w-100">
              View All Notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
