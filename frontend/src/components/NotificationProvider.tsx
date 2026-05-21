import React, { ReactNode, useEffect } from 'react';
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications';
import { useNotificationAPI } from '../hooks/useNotificationAPI';

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * NotificationProvider
 * 
 * Wraps the application to enable real-time notifications.
 * Initialize WebSocket and polling for notifications on mount.
 * 
 * Usage:
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // Initialize WebSocket connection
  useWebSocketNotifications();
  
  // Initialize API hooks (for fallback and polling)
  useNotificationAPI();

  return <>{children}</>;
};
