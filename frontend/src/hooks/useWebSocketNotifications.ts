import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore, Notification } from '../stores/notificationStore';

interface SocketIO {
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
  emit: (event: string, data?: any) => void;
  connect: () => void;
  disconnect: () => void;
  connected: boolean;
}

let socket: SocketIO | null = null;

// Initialize Socket.IO connection
const initSocket = (token: string): SocketIO => {
  if (socket && socket.connected) {
    return socket;
  }

  // Dynamically import Socket.IO only if available
  try {
    const io = require('socket.io-client').io || (window as any).io;
    const apiUrl = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    socket = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      auth: {
        token,
      },
    });

    return socket;
  } catch (error) {
    console.warn('Socket.IO not available, notifications will be polled instead');
    return null as any;
  }
};

export const useWebSocketNotifications = () => {
  const { accessToken } = useAuthStore();
  const {
    addNotification,
    markAsRead,
    setNotifications,
    setConnected,
    setError,
    setLoading,
  } = useNotificationStore();

  const socketRef = useRef<SocketIO | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!accessToken) {
      setConnected(false);
      return;
    }

    try {
      // Initialize socket connection
      socketRef.current = initSocket(accessToken);

      if (!socketRef.current) {
        console.info('Socket.IO not available, will use polling');
        return;
      }

      // Connection established
      socketRef.current.on('connection_confirmed', (data) => {
        console.log('✅ WebSocket connected:', data);
        setConnected(true);
        setError(null);
      });

      // Receive unread notifications on connection
      socketRef.current.on('unread_notifications', (data) => {
        console.log('📬 Unread notifications:', data);
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      });

      // Receive new notification in real-time
      socketRef.current.on('new_notification', (notification: Notification) => {
        console.log('🔔 New notification:', notification);
        addNotification(notification);

        // Show toast notification
        showNotificationToast(notification);
      });

      // Notification read confirmation
      socketRef.current.on('notification_read_confirmed', (data) => {
        console.log('✓ Notification marked as read:', data);
        if (data.notification_id) {
          markAsRead(data.notification_id);
        }
      });

      // Handle disconnection
      socketRef.current.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
        setConnected(false);

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (accessToken) {
            socketRef.current = initSocket(accessToken);
          }
        }, 3000);
      });

      // Handle connection error
      socketRef.current.on('connect_error', (error) => {
        console.error('⚠️ WebSocket connection error:', error);
        setError('Connection error. Notifications may be delayed.');
      });

      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      setError('Failed to initialize notifications');
    }
  }, [accessToken, addNotification, markAsRead, setNotifications, setConnected, setError]);

  // Emit event to mark notification as read
  const emitMarkAsRead = (notificationId: number) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('mark_notification_read', {
        notification_id: notificationId,
      });
    }
  };

  // Emit event to request notifications
  const emitRequestNotifications = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('request_notifications');
    }
  };

  return {
    isConnected: socketRef.current?.connected || false,
    emitMarkAsRead,
    emitRequestNotifications,
  };
};

// Helper function to show toast notification
const showNotificationToast = (notification: Notification) => {
  try {
    // Try to use react-hot-toast if available
    const toast = require('react-hot-toast').default;
    
    const bgColorMap: Record<string, string> = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
    };

    const bgColor = bgColorMap[notification.type] || 'bg-blue-500';

    toast.custom(
      (t) => (
        <div
          className={`${bgColor} text-white px-4 py-3 rounded shadow-lg max-w-md animate-pulse`}
          style={{
            opacity: t.visible ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          <div className="font-semibold">{notification.title}</div>
          <div className="text-sm mt-1">{notification.message}</div>
        </div>
      ),
      {
        duration: 5000,
        position: 'top-right',
      }
    );
  } catch (error) {
    // Fallback: just log to console
    console.log('Toast notification:', notification.title);
  }
};
