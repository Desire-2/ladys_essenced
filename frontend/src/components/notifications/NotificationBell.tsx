'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/notifications/recent', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

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
      const token = localStorage.getItem('access_token');
      if (!token) return;

      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

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
                      <small className="text-muted">
                        <i className="fas fa-clock me-1"></i>
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
              <div className="dropdown-item text-center">
                <button className="btn btn-sm btn-link text-decoration-none">
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