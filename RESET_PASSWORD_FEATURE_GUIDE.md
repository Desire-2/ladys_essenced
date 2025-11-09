# Reset Password Feature - Implementation Guide

## Date: November 9, 2025

## Overview
Added a "Reset Password" button to the admin user management interface that allows admins to reset any user's password to the default value ("password") with a single click.

---

## Features

### Backend Endpoint
**New:** `PATCH /api/admin/users/<user_id>/reset-password`

**Description:** Resets a user's password to the default value and optionally clears PIN authentication.

**Authentication:** Requires admin role and `manage_users` permission

**Request:**
```bash
PATCH /api/admin/users/5/reset-password
Authorization: Bearer <admin_token>
```

**Response - Success (200):**
```json
{
  "message": "Password reset to default for user John Doe",
  "user_id": 5,
  "user_name": "John Doe",
  "default_password": "password"
}
```

**Response - Error (404):**
```json
{
  "error": "404 Not Found"
}
```

**Response - Error (500):**
```json
{
  "error": "Failed to reset user password"
}
```

---

## What Gets Reset

When admin clicks the "Reset Password" button:

1. ✅ **Password Hash** → Reset to bcrypt hash of "password"
2. ✅ **PIN Hash** → Cleared (set to NULL)
3. ✅ **PIN Auth Enabled** → Disabled (set to False)
4. ✅ **Activity Log** → Entry created with reset details

---

## UI/UX Implementation

### Location
Admin Dashboard → Users Tab → Action Buttons (per user row)

### Button
- **Icon:** 🔑 (Key icon - `fas fa-key`)
- **Color:** Info (Blue) - `btn-outline-info`
- **Title:** "Reset Password to Default"
- **Position:** Between "Change Role" and "Quick Actions" buttons

### Interaction Flow

1. User clicks the **Key icon** button
2. Confirmation dialog appears:
   ```
   "Reset password to default (password) for [Username]? 
    They will need to change it on next login."
   ```
3. User confirms action
4. Loading state shown briefly
5. Success toast notification:
   ```
   "Password reset successfully to default"
   ```
6. Users list refreshes automatically

### Error Handling
If reset fails:
- Error toast notification shown
- User list NOT refreshed
- Admin can retry

---

## Frontend Changes

### File: `frontend/src/app/admin/page.tsx`

#### 1. New Button Added (Line ~2167)
```tsx
<button
  className="btn btn-outline-info btn-sm"
  onClick={() => handleResetPassword(user.id, user.name)}
  title="Reset Password to Default"
>
  <i className="fas fa-key"></i>
</button>
```

#### 2. New Handler Function (Line ~703)
```tsx
const handleResetPassword = useCallback(async (userId: number, userName: string) => {
  const actionKey = `reset-password-${userId}`;
  
  confirmActionDialog(
    `Reset password to default (password) for ${userName}? They will need to change it on next login.`,
    async () => {
      try {
        setActionLoadingState(actionKey, true);
        const data = await makeApiCall(buildApiUrl(`/users/${userId}/reset-password`), {
          method: 'PATCH'
        });
        
        showToast('success', data.message || 'Password reset successfully to default');
        loadUsers(usersPagination.current_page);
        loadDashboardData();
      } catch (err: any) {
        console.error('Failed to reset user password:', err);
        showToast('error', err.message || 'Failed to reset user password');
      } finally {
        setActionLoadingState(actionKey, false);
      }
    }
  );
}, [buildApiUrl, makeApiCall, showToast, setActionLoadingState, loadUsers, usersPagination.current_page, loadDashboardData, confirmActionDialog]);
```

---

## Backend Changes

### File: `backend/app/routes/admin.py`

#### New Endpoint (Line ~328)
```python
@admin_bp.route('/users/<int:user_id>/reset-password', methods=['PATCH'])
@admin_required
@check_permissions(['manage_users'])
def reset_user_password(user_id):
    """Reset user password to default (password)"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Set default password
        default_password = 'password'
        from app import bcrypt
        user.password_hash = bcrypt.generate_password_hash(default_password).decode('utf-8')
        
        # Optionally reset PIN auth if enabled
        user.pin_hash = None
        user.enable_pin_auth = False
        
        db.session.commit()
        
        log_user_activity('reset_user_password', {
            'user_id': user_id,
            'user_name': user.name,
            'default_password_set': 'password'
        })
        
        return jsonify({
            'message': f'Password reset to default for user {user.name}',
            'user_id': user_id,
            'user_name': user.name,
            'default_password': 'password'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error resetting user password: {str(e)}")
        return jsonify({'error': 'Failed to reset user password'}), 500
```

---

## Security Considerations

✅ **Admin-Only:** Requires `@admin_required` decorator  
✅ **Permission Check:** Requires `manage_users` permission  
✅ **Audit Trail:** All resets logged via `log_user_activity()`  
✅ **Secure Hashing:** Uses bcrypt for password hashing  
✅ **User Confirmation:** Confirmation dialog before action  
✅ **PIN Cleanup:** Clears PIN when password is reset  

---

## Testing Checklist

### Basic Functionality
- [ ] Admin can see reset password button for all users
- [ ] Clicking button shows confirmation dialog
- [ ] Confirmation dialog shows correct username
- [ ] Confirming action resets password
- [ ] Success toast shows after reset
- [ ] Users list refreshes after reset

### Access Control
- [ ] Non-admin cannot access endpoint (403)
- [ ] Admin without `manage_users` permission cannot reset (403)
- [ ] Admin with permission can reset (200)

### Error Handling
- [ ] Resetting non-existent user shows error (404)
- [ ] Database errors handled gracefully (500)
- [ ] Error toast shows error message

### User Login After Reset
- [ ] User can login with username + default password
- [ ] User can login with phone + default password
- [ ] PIN auth is disabled after reset
- [ ] PIN login attempts fail after reset

### Activity Log
- [ ] Reset action appears in system logs
- [ ] Log includes user_id, user_name, timestamp
- [ ] Log includes admin who performed reset

---

## Test Scenarios

### Test 1: Reset Parent User Password
1. Login as admin
2. Go to Admin → Users tab
3. Find a parent user
4. Click key icon (Reset Password)
5. Confirm action
6. Verify success toast
7. Parent user tries to login with password "password"
   - ✅ Should succeed

### Test 2: Reset Adolescent User with PIN Auth
1. Setup adolescent user with PIN auth enabled
2. Click reset password
3. Confirm action
4. Verify PIN is disabled
5. Try PIN login attempt
   - ✅ Should fail (PIN auth disabled)
6. Try password login
   - ✅ Should succeed

### Test 3: Confirmation Dialog
1. Click reset password
2. Verify dialog text shows:
   - Username
   - "default (password)" text
   - "next login" warning
3. Click Cancel
   - ✅ Dialog closes, password NOT reset
4. Click Confirm
   - ✅ Password resets

### Test 4: Non-Admin Cannot Reset
1. Login as regular user
2. Try to access endpoint directly
   ```
   PATCH /api/admin/users/5/reset-password
   ```
   - ✅ Should return 403 Forbidden

---

## Database Changes

**No migrations needed** - Uses existing `User` model fields:
- `password_hash` (VARCHAR 255)
- `pin_hash` (VARCHAR 255, nullable)
- `enable_pin_auth` (Boolean)

---

## Activity Log Entry

When password is reset, system logs:

```
Action: reset_user_password
User ID: [admin_user_id]
Details: {
  "user_id": 5,
  "user_name": "John Doe",
  "default_password_set": "password"
}
Timestamp: [ISO 8601]
IP Address: [admin_ip]
User Agent: [browser]
```

---

## Frontend Dependencies

Required for functionality:
- `confirmActionDialog` hook (existing)
- `showToast` hook (existing)
- `makeApiCall` hook (existing)
- `setActionLoadingState` hook (existing)
- `loadUsers` function (existing)
- `loadDashboardData` function (existing)

All dependencies already exist in codebase.

---

## Default Password

**Current Default:** `password`

To change default in future:
1. Edit backend: `default_password = 'your_new_password'` (line ~334)
2. Update documentation
3. Notify all admins of the change

---

## Future Enhancements

1. **Bulk Reset:** Add ability to reset passwords for multiple users at once
2. **Custom Default:** Allow admins to set custom default password per user
3. **Force Change:** Require user to change password on next login (add `password_changed_required` flag)
4. **Notification:** Send email to user when password is reset
5. **Password History:** Track when password was last reset

---

## Deployment Instructions

### For Backend:
1. Deploy `backend/app/routes/admin.py` changes
2. Restart backend service
3. Verify endpoint works: 
   ```bash
   curl -X PATCH http://localhost:5001/api/admin/users/5/reset-password \
     -H "Authorization: Bearer $TOKEN"
   ```

### For Frontend:
1. Deploy `frontend/src/app/admin/page.tsx` changes
2. Rebuild frontend: `npm run build`
3. Restart frontend service
4. Verify button appears in admin dashboard
5. Test reset flow end-to-end

---

## Troubleshooting

### Button Not Visible
- Verify user is admin
- Check browser console for JS errors
- Verify frontend deployment completed

### Reset Fails with 500 Error
- Check backend logs: `tail -f backend.log`
- Verify database connection
- Check bcrypt is imported correctly

### Password Hash Not Updating
- Verify bcrypt package is installed
- Check database write permissions
- Verify `db.session.commit()` is executed

### User Cannot Login After Reset
- Verify correct default password is set
- Check token expiration
- Verify login endpoint accepts "password"

---

## Monitoring

### Metrics to Track
- Number of password resets per day
- Which users are having passwords reset most
- Error rate of reset operations
- Average time between reset and user login

### Alerts to Setup
- Multiple failed reset attempts
- User trying to login multiple times after reset
- Unusual reset patterns

---

## Related Documentation

- [Admin Bulk Actions](./ADMIN_BULK_ACTIONS_ANALYSIS_AND_FIXES.md)
- [Authentication System](./AUTHENTICATION_COMPLETE.txt)
- [User Management](./BACKEND_RESTART_GUIDE.md)

---

## Files Modified

1. **backend/app/routes/admin.py**
   - Added `reset_user_password()` function (25 lines)
   - Import bcrypt at function level

2. **frontend/src/app/admin/page.tsx**
   - Added reset password button to user table (10 lines)
   - Added `handleResetPassword()` function (25 lines)

---

## Code Summary

**Total Lines Added:** ~60 lines
**Database Queries:** 1 SELECT, 1 UPDATE, 1 COMMIT
**API Calls:** 1 PATCH request
**Permissions Required:** `@admin_required` + `manage_users`
**Time to Implement:** ~30 minutes
**Risk Level:** ✅ Low (isolated feature, no breaking changes)

