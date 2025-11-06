# ChildAccessContext API Import Fix

## Issue
Console Error:
```
Error: Cannot read properties of undefined (reading 'getChildren')
src/contexts/ChildAccessContext.js:46:42 @ fetchParentChildren
```

## Root Cause
The `ChildAccessContext.js` was importing from the **wrong API file**:
- ❌ **Was using:** `../lib/api/client.ts` (TypeScript APIClient class - doesn't have `parents` property)
- ✅ **Should use:** `../api/index.js` (JavaScript with `parentAPI` already defined)

The `APIClient` class in the TypeScript file doesn't have a `parents` property, so calling `api.parents.getChildren()` returned `undefined`.

## Solution
Changed the import from the TypeScript client to the JavaScript API index file:

### Before ❌
```javascript
import api from '../lib/api/client';

// Usage:
await api.parents.getChildren();  // ← api.parents is undefined!
```

### After ✅
```javascript
import { parentAPI } from '../api/index';

// Usage:
await parentAPI.getChildren();  // ← Works!
```

## Files Changed
**File:** `/frontend/src/contexts/ChildAccessContext.js`

**Changes made:**
1. Line 5: Changed import from `../lib/api/client` to `{ parentAPI }` from `../api/index`
2. Updated all API calls to use `parentAPI` instead of `api.parents`:
   - `api.parents.getChildren()` → `parentAPI.getChildren()`
   - `api.parents.addChild()` → `parentAPI.addChild()`
   - `api.parents.updateChild()` → `parentAPI.updateChild()`
   - `api.parents.deleteChild()` → `parentAPI.deleteChild()`
   - `api.parents.getChildCycleLogs()` → `parentAPI.getChildCycleLogs()`
   - `api.parents.getChildMealLogs()` → `parentAPI.getChildMealLogs()`
   - `api.parents.getChildAppointments()` → `parentAPI.getChildAppointments()`

3. Updated response handling to account for axios response structure:
   - Added `.data` accessor where needed (e.g., `response.data` instead of `response`)

## API Methods Available
The `parentAPI` from `/frontend/src/api/index.js` provides:

```javascript
export const parentAPI = {
  getChildren: () => api.get('/api/parents/children'),
  getChild: (id) => api.get(`/api/parents/children/${id}`),
  addChild: (childData) => api.post('/api/parents/children', childData),
  updateChild: (id, childData) => api.put(`/api/parents/children/${id}`, childData),
  deleteChild: (id) => api.delete(`/api/parents/children/${id}`),
  getChildCycleLogs: (id, page = 1, perPage = 10) => 
    api.get(`/api/parents/children/${id}/cycle-logs?page=${page}&per_page=${perPage}`),
  getChildMealLogs: (id, page = 1, perPage = 10) => 
    api.get(`/api/parents/children/${id}/meal-logs?page=${page}&per_page=${perPage}`),
  getChildAppointments: (id, page = 1, perPage = 10) => 
    api.get(`/api/parents/children/${id}/appointments?page=${page}&per_page=${perPage}`),
};
```

## Testing
After changes, the error should be resolved:

1. **Parent Dashboard loads** ✅
2. **Children list fetches** ✅
3. **No "Cannot read properties of undefined" error** ✅
4. **All parent API calls work** ✅

## Why This Works
- The `parentAPI` from `/frontend/src/api/index.js` uses the axios instance with proper headers and token management
- It's already exported and tested for parent operations
- The TypeScript `APIClient` class is designed for newer endpoints but wasn't updated with parent methods

## API Layers Explained
```
┌─────────────────────────────────────────────┐
│ ChildAccessContext.js                       │
│ (Parent access and child management)        │
└────────────────┬────────────────────────────┘
                 │ imports
                 ↓
┌─────────────────────────────────────────────┐
│ /api/index.js                               │
│ ├─ parentAPI ← ✅ NOW USED                 │
│ ├─ cycleAPI                                 │
│ ├─ mealAPI                                  │
│ ├─ appointmentAPI                           │
│ └─ ... other APIs                           │
└────────────────┬────────────────────────────┘
                 │ uses
                 ↓
┌─────────────────────────────────────────────┐
│ axios instance (with auth interceptors)     │
└────────────────┬────────────────────────────┘
                 │ calls
                 ↓
┌─────────────────────────────────────────────┐
│ Backend API (http://localhost:5001)         │
│ POST /api/parents/children                  │
│ GET /api/parents/children                   │
│ etc.                                        │
└─────────────────────────────────────────────┘
```

## Summary
✅ **Before:** Imported from TypeScript file → `api.parents` undefined → Error  
✅ **After:** Import from JavaScript API file → `parentAPI` defined → Works!

