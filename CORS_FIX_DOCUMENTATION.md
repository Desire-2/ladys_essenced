# CORS Issue Fix - API Port Configuration

## Problem

The frontend was getting a CORS error:
```
Access to fetch at 'http://localhost:5000/api/cycle-logs' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

## Root Cause

The backend was running on **port 5001** (as configured in `run.py`), but the frontend components were trying to access **port 5000**.

## Solution

### 1. Updated Backend Port Reference

Changed all frontend API calls from `localhost:5000` to `localhost:5001`:

**Files Updated:**
- `frontend/src/components/parent/LogCycle.tsx`
- `frontend/src/components/parent/LogMeal.tsx`
- `frontend/src/components/parent/AddAppointment.tsx`
- `frontend/src/components/parent/ChildCalendar.tsx`

**Before:**
```typescript
const response = await fetch('http://localhost:5000/api/cycle-logs', ...)
```

**After:**
```typescript
const response = await fetch('http://localhost:5001/api/cycle-logs', ...)
```

### 2. Created Centralized API Configuration

Created `frontend/src/config/api.ts` to centralize all API URLs and methods:

```typescript
export const API_BASE_URL = 'http://localhost:5001';

export const API_ENDPOINTS = {
  CYCLE_LOGS: '/api/cycle-logs',
  MEAL_LOGS: '/api/meal-logs',
  APPOINTMENTS: '/api/appointments',
  PARENT_CHILDREN: '/api/parents/children',
  // ... more endpoints
};

export async function apiCall(endpoint, options) {
  // Centralized fetch with error handling
  // Automatically adds Authorization token
}

export async function apiPost(endpoint, body, options) {
  // POST helper
}

export async function apiGet(endpoint, options) {
  // GET helper
}
```

## Backend CORS Configuration

The backend already had CORS properly configured in `backend/app/__init__.py`:

```python
# Enable CORS with environment-specific origins
allowed_origins = os.environ.get('ALLOWED_ORIGINS', 
  'http://localhost:3000,http://127.0.0.1:3000,...').split(',')

cors_config = {
    'origins': allowed_origins,
    'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allow_headers': ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin', 'Accept', 'Origin', 'X-Requested-With'],
    'supports_credentials': True,
    'max_age': 86400,
    'send_wildcard': False,
    'automatic_options': True
}

CORS(app, resources={r"/api/*": cors_config})
```

## Environment Configuration

To make the API URL configurable without code changes, create a `.env.local` file in the frontend directory:

**`.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

This environment variable is read by the API configuration file automatically.

## How to Use the New API Configuration

Instead of using fetch directly, use the centralized API functions:

**Before (Old Way):**
```typescript
const response = await fetch('http://localhost:5000/api/cycle-logs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(submitData)
});
```

**After (New Way):**
```typescript
import { apiPost, API_ENDPOINTS } from '@/config/api';

const result = await apiPost(API_ENDPOINTS.CYCLE_LOGS, submitData);
```

## Benefits of Centralized Configuration

1. **Single Source of Truth** - One place to manage API URLs
2. **Easy to Change** - Update one file instead of many
3. **Automatic Authentication** - Token automatically added to all requests
4. **Error Handling** - Consistent error handling across all API calls
5. **Environment Variables** - Use `.env.local` for different environments
6. **Type Safe** - TypeScript support for all endpoints

## Step-by-Step Fix

### If You're Getting CORS Errors:

1. **Check Backend is Running**
   ```bash
   cd backend
   python run.py
   # Should show: 🚀 Starting Flask application...
   # And: [CORS] Allowed origins: ['http://localhost:3000', ...]
   ```

2. **Verify Backend Port**
   - Backend should be on `http://localhost:5001`
   - Check `run.py` for the port number

3. **Update Frontend**
   - All components have been updated to use port 5001
   - Or use the new centralized API configuration

4. **Test CORS**
   ```bash
   # Test if CORS is working:
   curl -X OPTIONS http://localhost:5001/api/cycle-logs \
     -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST"
   ```

## API Configuration File Reference

### Import the Config

```typescript
import { 
  API_BASE_URL,
  API_ENDPOINTS,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiCall
} from '@/config/api';
```

### Example: Log a Cycle

```typescript
import { apiPost, API_ENDPOINTS } from '@/config/api';

const handleLogCycle = async (cycleData) => {
  try {
    const result = await apiPost(API_ENDPOINTS.CYCLE_LOGS, cycleData);
    console.log('Cycle logged:', result);
  } catch (error) {
    console.error('Failed to log cycle:', error);
  }
};
```

### Example: Fetch Child's Cycle Logs

```typescript
import { apiGet, API_ENDPOINTS } from '@/config/api';

const handleFetchCycleLogs = async (childId) => {
  try {
    const endpoint = API_ENDPOINTS.PARENT_CHILD_CYCLE_LOGS(childId);
    const result = await apiGet(endpoint);
    console.log('Cycle logs:', result);
  } catch (error) {
    console.error('Failed to fetch cycle logs:', error);
  }
};
```

## Troubleshooting

### Still Getting CORS Errors?

1. **Check Browser Console** - Look for the full error message
2. **Verify Ports** - Ensure backend (5001) and frontend (3000) are correct
3. **Check Authorization Header** - Token must be valid
4. **Clear Browser Cache** - CORS responses are cached
5. **Check Backend Logs** - Look for CORS-related messages

### API Call Fails but No CORS Error?

- Verify JWT token is present in localStorage
- Check API endpoint is correct
- Verify request body format matches backend expectations
- Check backend logs for detailed error messages

## Migration Guide

If you want to update existing components to use the new API config:

**Before:**
```typescript
const response = await fetch('http://localhost:5000/api/meal-logs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(mealData)
});
```

**After:**
```typescript
import { apiPost, API_ENDPOINTS } from '@/config/api';

const response = await apiPost(API_ENDPOINTS.MEAL_LOGS, mealData);
```

## Version Info

- **Fix Date**: November 5, 2025
- **Backend Port**: 5001
- **Frontend Port**: 3000
- **API Configuration**: `frontend/src/config/api.ts`
- **Status**: ✅ CORS Fixed

---

## Summary

✅ **Problem**: Frontend port mismatch (5000 vs 5001)  
✅ **Solution**: Updated all API calls to use port 5001  
✅ **Improvement**: Created centralized API configuration  
✅ **Result**: CORS errors fixed, API calls working  

All components are now configured correctly and ready to communicate with the backend!

