import { create } from 'zustand';

export interface Notification {
  id: number;
  user_id?: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  notification_type: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  action_data?: Record<string, any>;
}

interface NotificationState {
  // Notification data
  notifications: Notification[];
  unreadCount: number;
  
  // UI state
  showPanel: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addNotification: (notification: Notification) => void;
  removeNotification: (id: number) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearAllRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  
  // UI actions
  togglePanel: () => void;
  setShowPanel: (show: boolean) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  showPanel: false,
  isConnected: false,
  isLoading: false,
  error: null,
  
  // Actions
  addNotification: (notification) =>
    set((state) => {
      // Prevent duplicates
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }
      
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: !notification.is_read ? state.unreadCount + 1 : state.unreadCount,
      };
    }),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  markAsRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.is_read) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  clearAllRead: () =>
    set((state) => ({
      notifications: state.notifications.filter((n) => !n.is_read),
    })),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  // UI actions
  togglePanel: () =>
    set((state) => ({ showPanel: !state.showPanel })),

  setShowPanel: (show) => set({ showPanel: show }),
  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
