# AuthContext Enhancement Summary

## Overview
Enhanced the frontend AuthContext (`frontend/src/contexts/AuthContext.js`) to return user information based on user type, providing role-based authentication and profile management.

## Key Enhancements

### 1. **User Type-Based Profile Fetching**
- **Admin Users**: Fetch profile from `/api/auth/profile` (no separate admin profile endpoint)
- **Content Writers**: Fetch profile from `/api/content-writer/profile`
- **Health Providers**: Fetch profile from `/api/health-provider/profile`
- **Regular Users** (parent/adolescent): Fetch profile from `/api/auth/profile`

### 2. **Enhanced Login Function**
- Automatically determines user type from login response
- Fetches appropriate profile data based on user type
- Stores `user_type`, `user_id`, `access_token`, and `refresh_token` in localStorage
- Returns unified user object with role-specific information

### 3. **Type-Specific Profile Updates**
- Content writers: Use `api.contentWriter.updateProfile()`
- Health providers: Use `api.healthProvider.updateProfile()`
- Regular users/admin: Use basic auth profile update endpoint

### 4. **Helper Functions Added**
- `hasPermission(permission)`: Check if user has specific permission based on role
- `hasRole(role)`: Check if user has specific role
- `getUserDisplayName()`: Get user's display name
- `getDashboardRoute()`: Get appropriate dashboard route based on user type
- `makeAuthenticatedRequest()`: Make authenticated API calls (exposed to context)

### 5. **Permission System**
```javascript
const permissions = {
  admin: ['view_analytics', 'manage_users', 'manage_content', 'manage_appointments', 'view_logs'],
  content_writer: ['create_content', 'edit_content', 'submit_content'],
  health_provider: ['view_appointments', 'manage_appointments', 'view_patients'],
  parent: ['view_profile', 'manage_children', 'book_appointments'],
  adolescent: ['view_profile', 'log_cycles', 'log_meals', 'view_content']
};
```

### 6. **Dashboard Route Mapping**
- Admin → `/admin`
- Content Writer → `/content-writer`
- Health Provider → `/health-provider`
- Regular Users → `/dashboard`

## API Integration
- Integrated with existing API client (`frontend/src/lib/api/client.ts`)
- Uses role-specific endpoints for profile management
- Handles authentication tokens consistently across all user types

## Error Handling
- Graceful error handling for invalid tokens
- Automatic token cleanup on authentication failures
- Consistent error messaging across all functions

## Context Provider Values
The enhanced AuthContext now provides:
```javascript
{
  user,                    // User object with role-specific data
  loading,                 // Loading state
  error,                   // Error messages
  login,                   // Login function
  register,                // Registration function
  logout,                  // Logout function
  updateProfile,           // Role-aware profile update
  hasPermission,           // Permission checker
  hasRole,                 // Role checker
  getUserDisplayName,      // Display name helper
  getDashboardRoute,       // Dashboard route helper
  makeAuthenticatedRequest // Authenticated API helper
}
```

## Usage Examples

### Check User Permissions
```javascript
const { hasPermission } = useAuth();
if (hasPermission('manage_users')) {
  // Show admin functionality
}
```

### Role-Based Rendering
```javascript
const { hasRole } = useAuth();
if (hasRole('content_writer')) {
  // Show content writer specific UI
}
```

### Get Dashboard Route
```javascript
const { getDashboardRoute } = useAuth();
router.push(getDashboardRoute());
```

## Backend Compatibility
- Works with existing backend authentication endpoints
- Supports all user types: admin, content_writer, health_provider, parent, adolescent
- Handles role-specific profile data structures
- Compatible with JWT token authentication

## Testing
- Frontend builds successfully with no TypeScript errors
- All dashboard endpoints integrate properly
- Role-based access control implemented
- Proper error handling and token management

## Security Features
- Automatic token validation and cleanup
- Role-based access control
- Secure localStorage token management
- Protected API endpoints integration

This enhancement provides a robust, scalable authentication system that supports all user types with appropriate role-based access control and profile management.
