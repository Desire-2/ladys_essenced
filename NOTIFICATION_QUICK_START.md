# Quick Start: Integrating Notifications into Your Dashboard

## 3 Simple Steps to Get Notifications Working

### Step 1: Wrap Your App (1 minute)

**File**: `frontend/src/main.tsx` (or wherever you initialize your React app)

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

✅ **Done!** Notifications are now initialized.

---

### Step 2: Add Bell to Header (2 minutes)

Find your dashboard header component and add the notification bell:

```tsx
import { NotificationBell } from './components/NotificationBell'

export const DashboardHeader = () => {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Add this */}
      <div className="flex items-center gap-4">
        <NotificationBell />
        {/* Other header items... */}
      </div>
    </div>
  )
}
```

✅ **Done!** Bell icon now appears in header with unread count badge.

---

### Step 3: Add Panel to Layout (2 minutes)

Find your main layout component and add the notification panel:

```tsx
import { NotificationPanel } from './components/NotificationPanel'

export const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        
        {/* Add this */}
        <NotificationPanel />
      </div>
    </div>
  )
}
```

✅ **Done!** Notification panel now appears when bell is clicked.

---

## That's It! 🎉

Your notification system is now fully integrated. Test it:

### Test Flow

1. **Start both servers**:
   ```bash
   # Terminal 1: Backend
   cd backend && python run.py
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Check WebSocket connection**:
   ```javascript
   // Open browser console
   // Should see logs like:
   // ✅ WebSocket connected: {user_id: 123, ...}
   // 📬 Unread notifications: {notifications: [...], count: 5}
   ```

3. **Create test appointment**:
   ```bash
   # Terminal 3:
   TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"phone_number":"1111111111","password":"testpass"}' \
     | jq -r '.access_token')
   
   curl -X POST http://localhost:5001/api/appointments \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "issue": "Test",
       "appointment_date": "2025-12-01T10:00:00Z"
     }'
   ```

4. **Watch frontend**:
   - Should see notification appear in real-time
   - Bell icon shows unread count badge
   - Click bell to view notification panel

---

## Optional Customizations

### 1. Change Bell Icon Style
```tsx
<NotificationBell className="scale-125" />
```

### 2. Customize Toast Notification
Edit `frontend/src/hooks/useWebSocketNotifications.ts`, find `showNotificationToast()` function:

```typescript
// Change toast color
const bgColorMap: Record<string, string> = {
  success: 'bg-green-500',      // ← Customize colors
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-purple-500',        // ← Changed from blue
};
```

### 3. Add Sound Notification
```typescript
const audio = new Audio('/notification.mp3');
audio.play().catch(err => console.log('Audio denied:', err));
```

Place audio file at `frontend/public/notification.mp3`

### 4. Use Notifications in Your Component
```tsx
import { useNotificationStore } from '../stores/notificationStore'

export const MyComponent = () => {
  const { notifications, unreadCount } = useNotificationStore()
  
  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications.map(notif => (
        <div key={notif.id}>{notif.title}</div>
      ))}
    </div>
  )
}
```

---

## Troubleshooting

### Bell Not Showing?
- Check browser console for errors
- Verify NotificationProvider wraps your app
- Check import path: `../components/NotificationBell`

### Notifications Not Appearing?
- Check WebSocket connection (should see ✅ message)
- Verify backend running on port 5001
- Check JWT token in localStorage
- Look at browser Network tab for WebSocket

### WebSocket Not Connecting?
- Check backend CORS settings
- Verify auth token is valid
- Check network for `ws://localhost:5001/socket.io/`
- Try reloading page

### Styling Issues?
- Check if Tailwind CSS is working
- Verify lucide-react icons loading
- Check browser console for CSS errors

---

## What Works Now

✅ Real-time notifications via WebSocket  
✅ Fallback polling every 30 seconds  
✅ Mark as read/unread  
✅ Delete notifications  
✅ Clear all read notifications  
✅ Unread count badge  
✅ Timestamp display  
✅ Connection status indicator  
✅ Toast notifications  
✅ Color-coded by type  
✅ Responsive design  
✅ Automatic reconnection  

---

## What's Coming Soon

⏳ Background task reminders (24h, 2h before appointment)  
⏳ Email notifications  
⏳ SMS notifications  
⏳ Advanced notification preferences  
⏳ Sound notifications  
⏳ Push notifications  

---

## Files You Need

**Already Created** ✅:
- `frontend/src/stores/notificationStore.ts`
- `frontend/src/hooks/useWebSocketNotifications.ts`
- `frontend/src/hooks/useNotificationAPI.ts`
- `frontend/src/components/NotificationBell.tsx`
- `frontend/src/components/NotificationPanel.tsx`
- `frontend/src/components/NotificationProvider.tsx`

**Dependencies Added** ✅:
- socket.io-client
- date-fns

---

## Getting Help

Detailed guides available:
- `FRONTEND_NOTIFICATION_INTEGRATION_GUIDE.md` - Full setup guide
- `PHASES_3_4_NOTIFICATION_COMPLETE.md` - Architecture overview
- `NOTIFICATION_SYSTEM_COMPREHENSIVE_REPORT.md` - Technical details

---

That's it! You now have a production-ready notification system. 🚀
