'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { notificationAPI } from '../api';

// Create notifications context
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Fetch notifications
  const fetchNotifications = async (page = 1, perPage = 10, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getNotifications(page, perPage, filters);
      setNotifications(response.data.items);
      setUnreadCount(response.data.unread_count);
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.pages,
        totalItems: response.data.total
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
      return response.data.unread_count;
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      return 0;
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await notificationAPI.markAsRead(id);
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
      
      // Update unread count
      await fetchUnreadCount();
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark notification as read');
      return { success: false, error: err.response?.data?.message || 'Failed to mark notification as read' };
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      setError(null);
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark all notifications as read');
      return { success: false, error: err.response?.data?.message || 'Failed to mark all notifications as read' };
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await notificationAPI.deleteNotification(id);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(notifications.filter(notification => notification.id !== id));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete notification');
      return { success: false, error: err.response?.data?.message || 'Failed to delete notification' };
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification settings
  const fetchNotificationSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getSettings();
      setNotificationSettings(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notification settings');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update notification settings
  const updateNotificationSettings = async (settingsData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.updateSettings(settingsData);
      setNotificationSettings(response.data.settings);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update notification settings');
      return { success: false, error: err.response?.data?.message || 'Failed to update notification settings' };
    } finally {
      setLoading(false);
    }
  };

  // Poll for new notifications periodically
  useEffect(() => {
    const pollInterval = 60000; // 1 minute
    
    const pollForNotifications = () => {
      fetchUnreadCount();
    };
    
    const intervalId = setInterval(pollForNotifications, pollInterval);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount,
        notificationSettings,
        loading, 
        error, 
        pagination,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchNotificationSettings,
        updateNotificationSettings
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
