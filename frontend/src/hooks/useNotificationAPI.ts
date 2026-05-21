import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore, Notification } from '../stores/notificationStore';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface FetchNotificationsParams {
  page?: number;
  per_page?: number;
  type?: string;
  read?: boolean;
}

export const useNotificationAPI = () => {
  const { accessToken } = useAuthStore();
  const {
    setNotifications,
    setUnreadCount,
    addNotification,
    markAsRead,
    removeNotification,
    setError,
    setLoading,
  } = useNotificationStore();

  // Fetch all notifications
  const fetchNotifications = async (params: FetchNotificationsParams = {}) => {
    if (!accessToken) {
      console.warn('No access token available');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.type) queryParams.append('type', params.type);
      if (params.read !== undefined) queryParams.append('read', params.read.toString());

      const response = await axios.get(`${API_BASE_URL}/api/notifications?${queryParams}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data?.items) {
        setNotifications(response.data.items);
        if (response.data.unread_count !== undefined) {
          setUnreadCount(response.data.unread_count);
        }
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : String(error);
      setError(`Failed to fetch notifications: ${message}`);
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent notifications
  const fetchRecentNotifications = async (limit: number = 5) => {
    if (!accessToken) {
      console.warn('No access token available');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications/recent?limit=${limit}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data?.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
    }
  };

  // Get unread count
  const fetchUnreadCount = async () => {
    if (!accessToken) {
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data?.unread_count !== undefined) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    if (!accessToken) {
      console.warn('No access token available');
      return false;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.status === 200) {
        markAsRead(notificationId);
        return true;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    return false;
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!accessToken) {
      console.warn('No access token available');
      return false;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.status === 200) {
        // Refresh notifications after marking all as read
        await fetchNotifications();
        return true;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
    return false;
  };

  // Delete notification
  const deleteNotification = async (notificationId: number) => {
    if (!accessToken) {
      console.warn('No access token available');
      return false;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 200) {
        removeNotification(notificationId);
        return true;
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
    return false;
  };

  // Clear all read notifications
  const clearAllRead = async () => {
    if (!accessToken) {
      console.warn('No access token available');
      return false;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/notifications/clear-all`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 200) {
        await fetchNotifications();
        return true;
      }
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    }
    return false;
  };

  // Auto-fetch notifications on mount and set up polling
  useEffect(() => {
    if (!accessToken) {
      return;
    }

    // Initial fetch
    fetchNotifications({ per_page: 20 });
    fetchUnreadCount();

    // Set up polling (fetch every 30 seconds if WebSocket not available)
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [accessToken]);

  return {
    fetchNotifications,
    fetchRecentNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllRead,
  };
};
