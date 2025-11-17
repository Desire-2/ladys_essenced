'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { notificationAPI } from '../../api/index';

// Helper function to format time in a user-friendly way
const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  // For older notifications, show the actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' })
  });
};

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getRecent();
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell position-relative">
      <button
        className="btn btn-outline-secondary position-relative"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ 
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.7rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div 
          className="dropdown-menu dropdown-menu-end show position-absolute mt-2"
          style={{ 
            minWidth: '320px',
            maxWidth: '400px',
            zIndex: 1050,
            right: 0,
            top: '100%'
          }}
        >
          <div className="dropdown-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Notifications</h6>
            {unreadCount > 0 && (
              <button 
                className="btn btn-sm btn-link text-decoration-none p-0"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="dropdown-divider"></div>
          
          <div 
            className="notification-list"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="fas fa-bell-slash fa-2x mb-2 opacity-50"></i>
                <p className="mb-0">No notifications</p>
                <small>You're all caught up!</small>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`dropdown-item ${!notification.is_read ? 'bg-light' : ''}`}
                  style={{ 
                    cursor: 'pointer',
                    borderLeft: !notification.is_read ? '3px solid #0d6efd' : 'none',
                    paddingLeft: !notification.is_read ? '12px' : '15px'
                  }}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="d-flex align-items-start">
                    <div 
                      className={`rounded-circle p-2 me-3 ${
                        notification.type === 'success' ? 'bg-success bg-opacity-20' :
                        notification.type === 'warning' ? 'bg-warning bg-opacity-20' :
                        notification.type === 'error' ? 'bg-danger bg-opacity-20' :
                        'bg-primary bg-opacity-20'
                      }`}
                    >
                      <i className={`fas ${
                        notification.type === 'success' ? 'fa-check' :
                        notification.type === 'warning' ? 'fa-exclamation-triangle' :
                        notification.type === 'error' ? 'fa-times' :
                        'fa-info'
                      } ${
                        notification.type === 'success' ? 'text-success' :
                        notification.type === 'warning' ? 'text-warning' :
                        notification.type === 'error' ? 'text-danger' :
                        'text-primary'
                      }`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className={`mb-1 ${!notification.is_read ? 'fw-bold' : ''}`}>
                        {notification.title}
                      </h6>
                      <p className="mb-1 small text-muted">
                        {notification.message}
                      </p>
                      <small className="text-muted d-flex align-items-center">
                        <i className="fas fa-clock me-1" style={{ fontSize: '0.75rem' }}></i>
                        <span title={new Date(notification.created_at).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}>
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </small>
                    </div>
                    {!notification.is_read && (
                      <div className="ms-2">
                        <div 
                          className="bg-primary rounded-circle"
                          style={{ width: '8px', height: '8px' }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item text-center p-0">
                <button 
                  className="btn btn-sm btn-link text-decoration-none w-100 py-2"
                  onClick={() => {
                    setShowDropdown(false);
                    router.push('/notifications');
                  }}
                  style={{
                    borderRadius: '0 0 0.375rem 0.375rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <i className="fas fa-external-link-alt me-1" style={{ fontSize: '0.8rem' }}></i>
                  View all notifications
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1040 }}
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
}