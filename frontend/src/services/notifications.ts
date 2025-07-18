'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, NotificationAPI } from '../utils/apiClient';
import { isFeatureEnabled, getSSEUrl } from '../utils/apiUrl';

export interface EnhancedNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'cycle' | 'health';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
  metadata?: {
    appointment_id?: number;
    provider_name?: string;
    date?: string;
    cycle_day?: number;
  };
}

class NotificationService {
  private baseUrl: string;
  private eventSource: EventSource | null = null;
  
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.NEXT_PUBLIC_API_URL || 'https://ladys-essenced.onrender.com')
      : '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getNotifications(page = 1, limit = 20): Promise<{
    notifications: EnhancedNotification[];
    total: number;
    unread_count: number;
  }> {
    try {
      const data = await this.makeRequest(`/notifications?page=${page}&limit=${limit}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return {
        notifications: this.getMockNotifications(),
        total: this.getMockNotifications().length,
        unread_count: this.getMockNotifications().filter(n => !n.is_read).length
      };
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      await this.makeRequest(`/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.makeRequest('/notifications/mark-all-read', {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await this.makeRequest(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  async getNotificationPreferences() {
    try {
      const data = await this.makeRequest('/notifications/preferences');
      return data;
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      return this.getMockPreferences();
    }
  }

  async updateNotificationPreferences(preferences: {
    email_notifications: boolean;
    push_notifications: boolean;
    appointment_reminders: boolean;
    cycle_predictions: boolean;
    health_insights: boolean;
    emergency_alerts: boolean;
  }) {
    try {
      const data = await this.makeRequest('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });
      return data;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  // Real-time notifications using Server-Sent Events
  subscribeToRealTimeNotifications(onNotification: (notification: EnhancedNotification) => void) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (!token) return;

    try {
      this.eventSource = new EventSource(`${this.baseUrl}/api/notifications/stream?token=${token}`);
      
      this.eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          onNotification(notification);
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.subscribeToRealTimeNotifications(onNotification);
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Failed to setup real-time notifications:', error);
    }
  }

  unsubscribeFromRealTimeNotifications() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private getMockNotifications(): EnhancedNotification[] {
    return [
      {
        id: 1,
        title: 'Appointment Reminder',
        message: 'Your appointment with Dr. Sarah Johnson is tomorrow at 2:00 PM',
        type: 'appointment',
        priority: 'high',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        action_url: '/appointments',
        action_label: 'View Details',
        metadata: {
          appointment_id: 123,
          provider_name: 'Dr. Sarah Johnson',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: 2,
        title: 'Period Prediction',
        message: 'Your next period is predicted to start in 3 days',
        type: 'cycle',
        priority: 'normal',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        action_url: '/dashboard?tab=cycle',
        action_label: 'Track Cycle',
        metadata: {
          cycle_day: 25
        }
      },
      {
        id: 3,
        title: 'Health Insight',
        message: 'Your cycle has been regular for 3 months. Great progress!',
        type: 'health',
        priority: 'low',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        action_url: '/dashboard?tab=analytics',
        action_label: 'View Analytics'
      },
      {
        id: 4,
        title: 'Appointment Confirmed',
        message: 'Your appointment has been confirmed for July 16th at 10:30 AM',
        type: 'success',
        priority: 'normal',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        metadata: {
          appointment_id: 124,
          provider_name: 'Dr. Michael Chen',
          date: '2025-07-16T10:30:00'
        }
      },
      {
        id: 5,
        title: 'Medication Reminder',
        message: 'Don\'t forget to take your evening supplements',
        type: 'info',
        priority: 'normal',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString()
      }
    ];
  }

  private getMockPreferences() {
    return {
      email_notifications: true,
      push_notifications: true,
      appointment_reminders: true,
      cycle_predictions: true,
      health_insights: false,
      emergency_alerts: true
    };
  }
}

export const notificationService = new NotificationService();

// Custom hook for notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    const handleNewNotification = (notification: EnhancedNotification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.is_read) {
        setUnreadCount(prev => prev + 1);
      }
    };

    notificationService.subscribeToRealTimeNotifications(handleNewNotification);

    return () => {
      notificationService.unsubscribeFromRealTimeNotifications();
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications
  };
}
