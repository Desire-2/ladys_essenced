# Frontend Notification System Integration Guide

## Overview

The Lady's Essence notification system is now integrated with the frontend using:
- **Real-time delivery**: WebSocket (Socket.IO) for instant notifications
- **Fallback polling**: REST API polling every 30 seconds if WebSocket unavailable
- **State management**: Zustand store for notification state
- **UI Components**: Notification bell and side panel

## Architecture

```
App (wrapped with NotificationProvider)
  ├── NotificationProvider
  │   ├── useWebSocketNotifications (WebSocket connection)
  │   └── useNotificationAPI (REST API + polling)
  │
  ├── NotificationBell (header component)
  │   └── Shows unread count & connection status
  │
  ├── NotificationPanel (side panel)
  │   └── Displays all notifications with actions
  │
  └── Your App Routes
```

## Installation Steps

### 1. Install Required Dependencies

```bash
cd frontend
npm install socket.io-client date-fns
# or
yarn add socket.io-client date-fns
```

Check `package.json` - these should be available:
- `socket.io-client` - WebSocket client
- `react-hot-toast` - Toast notifications (optional)
- `date-fns` - Date formatting
- `axios` - Already installed
- `zustand` - Already installed

### 2. Update Environment Variables

Add to `frontend/.env` or `.env.local`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5001
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### 3. Integrate into App

**File**: `frontend/src/main.tsx` or `frontend/src/index.tsx`

Wrap your app with `NotificationProvider`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { NotificationProvider } from './components/NotificationProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>,
)
```

### 4. Add to Dashboard Layout

**File**: `frontend/src/components/layout/DashboardLayout.tsx`

Add NotificationBell to header and NotificationPanel to layout:

```tsx
import { NotificationBell } from '../NotificationBell';
import { NotificationPanel } from '../NotificationPanel';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1>Dashboard</h1>
          
          {/* Right side of header */}
          <div className="flex items-center gap-4">
            {/* Add Notification Bell */}
            <NotificationBell />
            
            {/* Other header items */}
            <UserMenu />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>

        {/* Notification Panel */}
        <NotificationPanel />
      </div>
    </div>
  );
};
```

## Components

### NotificationBell

Displays bell icon with unread count badge.

**Props:**
```tsx
interface NotificationBellProps {
  onClick?: () => void;
  className?: string;
}
```

**Usage:**
```tsx
<NotificationBell onClick={() => console.log('Bell clicked')} />
```

**Features:**
- Unread count badge (shows "99+" for 100+)
- Connection status indicator (pulsing dot = polling mode)
- Click toggles notification panel

### NotificationPanel

Side panel showing all notifications with actions.

**Features:**
- Infinite scroll list of notifications
- Mark individual notifications as read
- Mark all as read
- Clear all read notifications
- Delete individual notifications
- Color-coded by notification type
- Timestamp display (relative time: "2 hours ago")

**Usage:**
```tsx
<NotificationPanel />
```

## Hooks

### useWebSocketNotifications

Manages WebSocket connection and real-time notification delivery.

```tsx
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications';

export const MyComponent = () => {
  const { isConnected, emitMarkAsRead, emitRequestNotifications } = 
    useWebSocketNotifications();

  const handleMarkRead = (id: number) => {
    emitMarkAsRead(id);
  };

  return (
    <div>
      <p>WebSocket {isConnected ? 'connected' : 'disconnected'}</p>
      <button onClick={() => emitRequestNotifications()}>
        Refresh Notifications
      </button>
    </div>
  );
};
```

**Methods:**
- `emitMarkAsRead(id)` - Mark notification as read via WebSocket
- `emitRequestNotifications()` - Request fresh notifications
- `isConnected` - Boolean indicating WebSocket connection status

### useNotificationAPI

REST API for notifications with fallback polling.

```tsx
import { useNotificationAPI } from '../hooks/useNotificationAPI';

export const MyComponent = () => {
  const {
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllRead,
  } = useNotificationAPI();

  return (
    <button onClick={() => markNotificationAsRead(123)}>
      Mark as read
    </button>
  );
};
```

**Methods:**
- `fetchNotifications(params)` - Fetch paginated notifications
- `fetchRecentNotifications(limit)` - Fetch recent N notifications
- `fetchUnreadCount()` - Get unread count
- `markNotificationAsRead(id)` - Mark single notification as read
- `markAllNotificationsAsRead()` - Mark all as read
- `deleteNotification(id)` - Delete notification
- `clearAllRead()` - Delete all read notifications

## Store

### useNotificationStore

Zustand store for notification state management.

```tsx
import { useNotificationStore } from '../stores/notificationStore';

export const MyComponent = () => {
  const {
    notifications,
    unreadCount,
    showPanel,
    isConnected,
    isLoading,
    error,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAllRead,
    togglePanel,
    setShowPanel,
    setConnected,
    setLoading,
    setError,
  } = useNotificationStore();

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      <p>Total: {notifications.length}</p>
      <button onClick={() => togglePanel()}>
        {showPanel ? 'Hide' : 'Show'} Notifications
      </button>
    </div>
  );
};
```

## Notification Types

```tsx
interface Notification {
  id: number;
  user_id?: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  notification_type: string;  // e.g., 'appointment', 'cycle', etc.
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  action_data?: Record<string, any>;
}
```

## Real-Time Events

### WebSocket Events (Server → Client)

**connection_confirmed**
```javascript
socket.on('connection_confirmed', (data) => {
  // { user_id: 123, user_type: 'parent', timestamp: '2025-11-21...' }
});
```

**unread_notifications**
```javascript
socket.on('unread_notifications', (data) => {
  // { notifications: [...], count: 5, timestamp: '...' }
});
```

**new_notification**
```javascript
socket.on('new_notification', (notification) => {
  // { id: 42, title: '...', message: '...', ... }
});
```

**notification_read_confirmed**
```javascript
socket.on('notification_read_confirmed', (data) => {
  // { notification_id: 42, read_at: '...' }
});
```

### WebSocket Events (Client → Server)

**connect** (automatic with auth token)

**mark_notification_read**
```javascript
socket.emit('mark_notification_read', { notification_id: 42 });
```

**request_notifications**
```javascript
socket.emit('request_notifications');
```

## Testing

### 1. Start Backend
```bash
cd backend
source venv/bin/activate
python run.py  # Runs on port 5001
```

### 2. Start Frontend
```bash
cd frontend
npm run dev  # Usually runs on port 5173 or 3000
```

### 3. Test WebSocket Connection
Open browser console and check:
```javascript
// Should see in console:
// ✅ WebSocket connected: {user_id: 123, ...}
// 📬 Unread notifications: {notifications: [...], count: N}
```

### 4. Test Appointment Notification
```bash
# In another terminal, create test appointment
curl -X POST http://localhost:5001/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "issue": "Checkup",
    "appointment_date": "2025-12-01T10:00:00Z"
  }'
```

Should see notification appear in real-time on frontend.

### 5. Test Polling (No WebSocket)
If WebSocket is unavailable:
- Notifications fetch every 30 seconds
- Manual refresh available
- Look for pulsing indicator on bell icon

## Troubleshooting

### WebSocket Connection Failing

**Issue**: "Socket.IO not available"
```
Solution: npm install socket.io-client
```

**Issue**: CORS error on WebSocket
```
Backend should have CORS configured for localhost:3000/5173
Check app/__init__.py for CORS_ORIGINS
```

### Notifications Not Appearing

1. **Check authentication:**
   ```javascript
   console.log(localStorage.getItem('access_token')); // Should exist
   ```

2. **Check WebSocket connection:**
   ```javascript
   // In browser console:
   console.log(socket.connected); // Should be true
   ```

3. **Check backend logs:**
   ```bash
   # Look for connection messages
   tail -f backend.log | grep "connected"
   ```

4. **Check browser network tab:**
   - Should see WebSocket connection to `ws://localhost:5001/socket.io/`
   - Status: 101 Switching Protocols

### API Polling Not Working

1. Check `NEXT_PUBLIC_API_URL` is set correctly
2. Verify backend is running on port 5001
3. Check JWT token validity
4. Test API manually:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:5001/api/notifications/unread-count
   ```

## Advanced Usage

### Custom Toast Notification

The system automatically shows toast notifications via `react-hot-toast` when new notifications arrive.

To customize:

**File**: `frontend/src/hooks/useWebSocketNotifications.ts`

Find `showNotificationToast()` function and modify styling.

### Notification Filtering

Get only unread notifications:
```tsx
const { notifications } = useNotificationStore();
const unread = notifications.filter(n => !n.is_read);
```

Get notifications by type:
```tsx
const { notifications } = useNotificationStore();
const appointments = notifications.filter(n => 
  n.notification_type === 'appointment'
);
```

### Sound Notification

Add to `showNotificationToast()`:
```tsx
const audio = new Audio('/notification-sound.mp3');
audio.play().catch(err => console.log('Audio play denied:', err));
```

Place audio file in `frontend/public/notification-sound.mp3`

## Migration from Old System

If transitioning from previous notification system:

1. **Old API calls remain functional** - both systems can coexist
2. **New components are opt-in** - add to dashboards gradually
3. **State management** - Zustand store handles both

Gradual migration:
```tsx
// Old system still works
const notifications = await fetchNotifications(); // API call

// New system
const { notifications } = useNotificationStore(); // Zustand store
```

## Performance Considerations

### Memory Usage
- Notifications stored in Zustand store (client-side)
- Recommended limit: Keep only 100 most recent
- Older notifications persist in database (backend)

### Network
- WebSocket: ~50ms latency (real-time)
- Polling: 30 second interval (battery-friendly)
- Automatic: Uses both when available

### Best Practices
1. Clear old read notifications periodically
2. Use `clearAllRead()` to reduce store size
3. Prefer WebSocket (real-time) over polling
4. Handle connection drops gracefully

## Files Created/Modified

**New Files:**
- `frontend/src/stores/notificationStore.ts` - Zustand store
- `frontend/src/hooks/useWebSocketNotifications.ts` - WebSocket hook
- `frontend/src/hooks/useNotificationAPI.ts` - REST API hook
- `frontend/src/components/NotificationBell.tsx` - Bell icon component
- `frontend/src/components/NotificationPanel.tsx` - Side panel component
- `frontend/src/components/NotificationProvider.tsx` - Provider wrapper

**Integration Points:**
- `frontend/src/main.tsx` - Wrap app with provider
- `frontend/src/components/layout/DashboardLayout.tsx` - Add bell + panel

## Next Steps

1. ✅ Frontend store and hooks created
2. ✅ UI components created
3. ⏳ Integrate into your dashboards
4. ⏳ Test with backend running
5. ⏳ Add sound/toast customizations
6. ⏳ Deploy to production

## Support

For issues or questions:
1. Check console for errors
2. Verify backend is running (port 5001)
3. Check browser network tab for WebSocket
4. Review this guide's troubleshooting section
