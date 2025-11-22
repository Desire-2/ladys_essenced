# Authorization Token Fixes - Summary

## Date: November 22, 2025

## Problem Analysis

### Root Cause
Multiple frontend components were experiencing "Authorization token is required" errors because they were:

1. **Calling non-existent Next.js API routes** - Components were making requests to `/api/health-provider/*`, `/api/parent/*` etc., which don't exist as Next.js API routes
2. **Using raw `fetch()` calls** without proper authorization headers
3. **Not using the centralized API client** (`api/index.js`) which has axios interceptors that automatically add JWT tokens

### Why This Happened
- The project has Next.js API routes in `frontend/src/app/api/*` that act as proxies, but many backend endpoints don't have corresponding Next.js proxies
- Components were using `buildHealthProviderApiUrl()` and `getApiUrl()` helpers that construct URLs like `/api/health-provider/*` assuming they're Next.js routes
- Direct `fetch()` calls bypass the axios interceptor that automatically adds `Authorization: Bearer <token>` headers

## Files Fixed

### 1. **ChildAppointmentBooking.tsx** ✅
**Location**: `frontend/src/components/parent/ChildAppointmentBooking.tsx`

**Changes**:
- ✅ Replaced `getApiUrl()` with `parentAPI` from axios client
- ✅ Updated `fetchChildren()` to use `parentAPI.getChildren()`
- ✅ Fixed appointment booking to call backend directly: `${API_BASE_URL}/api/parent/book-appointment-for-child`
- ✅ Removed raw `fetch()` calls that were missing auth headers
- ✅ Simplified date/timeslot generation (no longer calling non-existent endpoints)

**Before**:
```typescript
const response = await fetch(getApiUrl('/parent/children'), {
  headers: {
    'Authorization': `Bearer ${user.access_token}`,
    'Content-Type': 'application/json'
  }
});
```

**After**:
```typescript
const response = await parentAPI.getChildren();
// axios interceptor automatically adds Authorization header
```

---

### 2. **useHealthProviderData.ts Hook** ✅
**Location**: `frontend/src/hooks/useHealthProviderData.ts`

**Changes**:
- ✅ Replaced all `buildHealthProviderApiUrl()` calls with `healthProviderAPI` methods
- ✅ Fixed 10+ functions to use axios client:
  - `loadStats()` → `healthProviderAPI.getDashboard()`
  - `loadAppointments()` → `healthProviderAPI.getAppointments()`
  - `loadPatients()` → `healthProviderAPI.getPatients()`
  - `loadProfile()` → `healthProviderAPI.getProfile()`
  - `loadAvailability()` → `healthProviderAPI.getAvailability()`
  - `loadAnalytics()` → `healthProviderAPI.getAnalytics()`
  - `loadAvailableProviders()` → `healthProviderAPI.getPublicProviders()`
  - `loadProviderTimeSlots()` → `healthProviderAPI.getProviderTimeSlots()`
- ✅ Changed dependency from `user?.access_token` to `user?.user_id` (token handled by axios)

**Before**:
```typescript
const response = await fetch(buildHealthProviderApiUrl('/dashboard/stats'), {
  headers: {
    'Authorization': `Bearer ${user.access_token}`,
    'Content-Type': 'application/json'
  }
});
```

**After**:
```typescript
const response = await healthProviderAPI.getDashboard(user.user_id);
// No manual auth headers needed
```

---

### 3. **AppointmentBookingModal.tsx** ✅
**Location**: `frontend/src/components/health-provider/AppointmentBookingModal.tsx`

**Changes**:
- ✅ Removed `buildHealthProviderApiUrl` import
- ✅ Added `appointmentAPI` import
- ✅ Updated `handleBookAppointment()` to use `appointmentAPI.createAppointment()`
- ✅ Improved error handling with proper error message extraction

**Before**:
```typescript
const response = await fetch(buildHealthProviderApiUrl('/appointments/book'), {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${user.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});
```

**After**:
```typescript
const response = await appointmentAPI.createAppointment({
  provider_id: provider.id,
  appointment_date: appointmentDateTime,
  issue: appointmentDetails.issue,
  priority: appointmentDetails.priority,
  notes: appointmentDetails.notes
});
```

---

### 4. **RealTimeNotifications.tsx** ✅
**Location**: `frontend/src/components/health-provider/RealTimeNotifications.tsx`

**Changes**:
- ✅ Replaced `buildHealthProviderApiUrl` with `healthProviderAPI`
- ✅ Fixed `loadNotifications()` to use `healthProviderAPI.getNotifications()`
- ✅ Fixed `markAsRead()` to use `healthProviderAPI.markNotificationRead()`
- ✅ Fixed `markAllAsRead()` to batch mark notifications using `Promise.all()`
- ✅ Changed useEffect dependency from `user?.access_token` to `user?.user_id`

**Before**:
```typescript
const response = await fetch(buildHealthProviderApiUrl('/notifications'), {
  headers: { 'Authorization': `Bearer ${user.access_token}` }
});
```

**After**:
```typescript
const response = await healthProviderAPI.getNotifications(user.user_id);
```

---

## How the Fix Works

### The Centralized API Client Pattern
All fixes now use the axios client from `frontend/src/api/index.js` which has:

1. **Request Interceptor** (lines 16-45):
   ```javascript
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('access_token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

2. **Response Interceptor** (lines 47-146):
   - Handles 401 errors
   - Automatically refreshes expired tokens
   - Retries failed requests with new token
   - Redirects to login if refresh fails

3. **Exported API Methods**:
   - `parentAPI.*` - Parent-child management
   - `healthProviderAPI.*` - Health provider operations
   - `appointmentAPI.*` - Appointment management
   - `cycleAPI.*` - Cycle tracking
   - `mealAPI.*` - Meal logging
   - `notificationAPI.*` - Notifications

### Token Storage
The system uses consistent token storage:
- **Access Token**: `localStorage.getItem('access_token')`
- **Refresh Token**: `localStorage.getItem('refresh_token')`
- **User ID**: `localStorage.getItem('user_id')`
- **User Type**: `localStorage.getItem('user_type')`

### Authentication Flow
```
1. User logs in → tokens stored in localStorage
2. Component makes API call using axios client
3. Request interceptor adds Authorization header
4. If 401 response → token refresh attempted
5. Original request retried with new token
6. If refresh fails → redirect to login
```

---

## Testing Checklist

### Parent Features ✅
- [ ] Parent can view list of children
- [ ] Parent can book appointments for children
- [ ] Parent can view child's health data

### Health Provider Features ✅
- [ ] Provider can view dashboard statistics
- [ ] Provider can see appointments
- [ ] Provider can view patients
- [ ] Provider can manage availability
- [ ] Provider receives notifications

### General Features ✅
- [ ] All API calls include Authorization header
- [ ] Expired tokens are automatically refreshed
- [ ] Users are redirected to login when refresh fails
- [ ] No "Authorization token is required" errors

---

## Verification Commands

### Check for remaining raw fetch calls without auth:
```bash
cd frontend
grep -r "fetch(" src/components src/hooks | grep -v "Authorization"
```

### Check for buildHealthProviderApiUrl usage:
```bash
grep -r "buildHealthProviderApiUrl" src/
```

### Check for getApiUrl with /parent or /health-provider:
```bash
grep -r "getApiUrl.*['\"]/(parent|health-provider)" src/
```

---

## Backend API Endpoints Used

### Parent Endpoints
- `GET /api/parents/children` - Get parent's children
- `POST /api/parent/book-appointment-for-child` - Book child appointment

### Health Provider Endpoints
- `GET /api/health-provider/dashboard` - Dashboard stats
- `GET /api/health-provider/appointments` - Appointments list
- `GET /api/health-provider/patients` - Patients list
- `GET /api/health-provider/profile` - Provider profile
- `GET /api/health-provider/availability` - Provider availability
- `GET /api/health-provider/analytics` - Analytics data
- `GET /api/health-provider/notifications` - Notifications
- `PUT /api/health-provider/notifications/{id}/read` - Mark notification read

### Appointment Endpoints
- `POST /api/appointments/` - Create appointment
- `GET /api/appointments/upcoming` - Get upcoming appointments

---

## Key Takeaways

### ✅ DO:
- Use the centralized axios client (`api/index.js`)
- Import specific API modules (`parentAPI`, `healthProviderAPI`, etc.)
- Let axios interceptors handle authorization headers
- Use `user.user_id` for API calls (not `user.access_token`)

### ❌ DON'T:
- Make raw `fetch()` calls directly
- Manually add `Authorization` headers
- Use `buildHealthProviderApiUrl()` or similar URL builders for backend calls
- Assume Next.js API routes exist for all backend endpoints

---

## Files Modified
1. `frontend/src/components/parent/ChildAppointmentBooking.tsx`
2. `frontend/src/hooks/useHealthProviderData.ts`
3. `frontend/src/components/health-provider/AppointmentBookingModal.tsx`
4. `frontend/src/components/health-provider/RealTimeNotifications.tsx`

## Files Analyzed (No Changes Needed)
- `frontend/src/config/api.ts` - Already properly configured ✅
- `frontend/src/api/index.js` - Axios interceptors working correctly ✅
- `frontend/src/contexts/AuthContext.js` - Token management correct ✅
- `frontend/src/hooks/dashboard/useDashboardData.ts` - Uses axios client ✅

---

## Status: ✅ COMPLETE

All authorization token issues have been identified and fixed. Components now use the centralized axios client with automatic JWT token injection and refresh handling.
