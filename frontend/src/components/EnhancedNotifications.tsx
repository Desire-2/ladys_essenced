'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, EnhancedNotification } from '../services/notifications';

interface EnhancedNotificationsProps {
  onNotificationCount?: (count: number) => void;
  showDropdown?: boolean;
  maxDisplay?: number;
}

export default function EnhancedNotifications({ 
  onNotificationCount, 
  showDropdown = true,
  maxDisplay = 10 
}: EnhancedNotificationsProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  useEffect(() => {
    if (onNotificationCount) {
      onNotificationCount(unreadCount);
    }
  }, [unreadCount, onNotificationCount]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'urgent') return notification.priority === 'urgent' || notification.priority === 'high';
    return true;
  }).slice(0, maxDisplay);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return 'fas fa-calendar-check';
      case 'cycle': return 'fas fa-venus';
      case 'health': return 'fas fa-heartbeat';
      case 'success': return 'fas fa-check-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'error': return 'fas fa-times-circle';
      default: return 'fas fa-info-circle';
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'text-danger';
    if (priority === 'high') return 'text-warning';
    
    switch (type) {
      case 'appointment': return 'text-primary';
      case 'cycle': return 'text-pink';
      case 'health': return 'text-success';
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-danger';
      default: return 'text-info';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: EnhancedNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  if (!showDropdown) {
    // Compact view for embedding in other components
    return (
      <div className="notifications-compact">
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`list-group-item list-group-item-action ${!notification.is_read ? 'bg-light' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <div className="d-flex align-items-start">
                      <i className={`${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type, notification.priority)} me-2 mt-1`}></i>
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{notification.title}</h6>
                        <p className="mb-1 text-muted small">{notification.message}</p>
                      </div>
                    </div>
                    <small className="text-muted">{formatTimeAgo(notification.created_at)}</small>
                  </div>
                  {!notification.is_read && (
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger rounded-circle">
                      <span className="visually-hidden">New notification</span>
                    </span>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="fas fa-bell-slash fa-2x mb-2"></i>
                <p>No notifications</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-secondary position-relative"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <i className="fas fa-bell"></i>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="dropdown-menu dropdown-menu-end show"
            style={{ 
              width: '400px', 
              maxHeight: '500px',
              position: 'absolute',
              top: '100%',
              right: 0,
              zIndex: 1050
            }}
          >
            {/* Header */}
            <div className="dropdown-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Notifications</h6>
              <div className="btn-group btn-group-sm">
                <button
                  className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  className={`btn ${filter === 'urgent' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                  onClick={() => setFilter('urgent')}
                >
                  Urgent
                </button>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            {/* Actions */}
            {unreadCount > 0 && (
              <>
                <button
                  className="dropdown-item text-primary"
                  onClick={markAllAsRead}
                >
                  <i className="fas fa-check-double me-2"></i>
                  Mark all as read
                </button>
                <div className="dropdown-divider"></div>
              </>
            )}

            {/* Notifications List */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`dropdown-item position-relative ${!notification.is_read ? 'bg-light' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    style={{ cursor: 'pointer', borderLeft: `4px solid ${getNotificationColor(notification.type, notification.priority).includes('danger') ? '#dc3545' : getNotificationColor(notification.type, notification.priority).includes('warning') ? '#ffc107' : '#0d6efd'}` }}
                  >
                    <div className="d-flex">
                      <div className="flex-shrink-0 me-3">
                        <i className={`${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type, notification.priority)}`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="mb-0 fs-6">{notification.title}</h6>
                          <small className="text-muted">{formatTimeAgo(notification.created_at)}</small>
                        </div>
                        <p className="mb-1 text-muted small">{notification.message}</p>
                        
                        {notification.metadata && (
                          <div className="mt-2">
                            {notification.metadata.provider_name && (
                              <small className="badge bg-secondary me-1">
                                {notification.metadata.provider_name}
                              </small>
                            )}
                            {notification.metadata.date && (
                              <small className="badge bg-info me-1">
                                {new Date(notification.metadata.date).toLocaleDateString()}
                              </small>
                            )}
                          </div>
                        )}

                        {notification.action_label && (
                          <div className="mt-2">
                            <small className="text-primary">
                              <i className="fas fa-arrow-right me-1"></i>
                              {notification.action_label}
                            </small>
                          </div>
                        )}
                      </div>
                      
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.6em' }}>
                            New
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="notification-actions mt-2 d-none">
                      <button
                        className="btn btn-sm btn-outline-success me-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <i className="fas fa-check"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-bell-slash fa-2x text-muted mb-2"></i>
                  <p className="text-muted mb-0">No notifications</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > maxDisplay && (
              <>
                <div className="dropdown-divider"></div>
                <a href="/notifications" className="dropdown-item text-center text-primary">
                  <i className="fas fa-eye me-2"></i>
                  View all notifications
                </a>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1040 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
