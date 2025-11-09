# Reset Password Feature - Quick Reference

## What Was Added?

A **Reset Password** button in the admin user management dashboard that resets any user's password to the default value.

---

## Where Is It?

**Admin Dashboard** → **Users Tab** → **Action Buttons (per user row)**

The button appears as a **🔑 Key icon** between the "Change Role" (⚙️) and "Quick Actions" (⚡) buttons.

---

## How It Works

### Admin's View
1. Click the **🔑 Key icon** button on any user row
2. Confirmation dialog appears asking to confirm
3. Click **Confirm**
4. Success toast notification shows
5. User list refreshes

### User's Experience
After password is reset:
- Old password no longer works
- New password: **`password`** (lowercase)
- Can use phone number + password or username + password to login
- PIN authentication is automatically disabled
- Should change password on next login

---

## API Endpoint

**URL:** `PATCH /api/admin/users/{user_id}/reset-password`

**Auth Required:** Yes (Admin role + manage_users permission)

**Example:**
```bash
curl -X PATCH http://localhost:5001/api/admin/users/5/reset-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Password reset to default for user John Doe",
  "user_id": 5,
  "user_name": "John Doe",
  "default_password": "password"
}
```

---

## What Gets Reset?

✅ Password hash (set to bcrypt hash of "password")
✅ PIN hash (cleared)
✅ PIN auth flag (disabled)
✅ Activity logged

❌ Username (unchanged)
❌ Email (unchanged)
❌ User role (unchanged)
❌ Created date (unchanged)

---

## Security

- Only admins with `manage_users` permission can reset
- All resets are logged in system activity
- Confirmation required before action
- Secure bcrypt hashing used
- PIN auth automatically disabled

---

## Testing

### Test: Basic Reset
1. Go to Admin → Users
2. Click key icon on any user
3. Confirm
4. See success message
5. ✅ Should work

### Test: Login After Reset
1. Reset password for user "John"
2. Logout from admin
3. Try to login as John
4. Use password: `password`
5. ✅ Should succeed

### Test: PIN Disabled
1. User had PIN auth enabled
2. Admin resets password
3. Try to login with PIN
4. ✅ Should fail (PIN disabled)

### Test: Access Control
1. Login as non-admin user
2. Try to call endpoint directly
3. ✅ Should get 403 Forbidden

---

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to reset user password" | Database error | Check backend logs |
| "404 Not Found" | User doesn't exist | Verify user ID exists |
| Unauthorized | Not an admin | Login as admin |
| No permission | Missing manage_users | Check admin permissions |

---

## Frontend Code Location

**File:** `frontend/src/app/admin/page.tsx`

**Components:**
- Button: Line ~2167 (in user table)
- Handler: Line ~703 (`handleResetPassword` function)

---

## Backend Code Location

**File:** `backend/app/routes/admin.py`

**Endpoint:** Line ~328 (`reset_user_password` function)

---

## Default Password

**Current:** `password`

Users get this password when admin clicks reset.

To change it, edit `backend/app/routes/admin.py` line 334:
```python
default_password = 'your_new_password'
```

---

## Activity Logging

Every password reset is logged:

```
Action: reset_user_password
Admin ID: [who performed it]
Target User ID: 5
Target User Name: John Doe
Timestamp: 2025-11-09T10:30:45Z
```

View in: Admin → Logs tab

---

## FAQ

**Q: Can I reset an admin's password?**
A: Yes, admins can reset each other's passwords (as long as they have manage_users permission).

**Q: Will the user be notified?**
A: No automatic notification. The admin should inform the user separately.

**Q: Can I recover the old password?**
A: No. The old password hash is overwritten. This is intentional for security.

**Q: What if user has 2FA enabled?**
A: 2FA is not yet implemented in this system, so no concerns.

**Q: Can I reset multiple passwords at once?**
A: Not yet, but this can be added in the future.

**Q: How many times can I reset?**
A: Unlimited - admins can reset as many times as needed.

---

## Permissions Required

```python
@admin_required                          # Must be admin
@check_permissions(['manage_users'])     # Must have manage_users permission
```

If user has any of these roles but NOT manage_users permission:
- ❌ Admin without manage_users → 403 Forbidden
- ❌ Parent → 403 Forbidden  
- ❌ Adolescent → 403 Forbidden
- ❌ Content Writer → 403 Forbidden
- ❌ Health Provider → 403 Forbidden

---

## Related Features

- **Change Role:** Change user's role (parent ↔ adolescent, etc.)
- **Toggle Status:** Activate/deactivate user
- **Delete User:** Remove user from system
- **Bulk Actions:** Activate/deactivate/delete multiple users

---

## Deployment Checklist

- [ ] Backend code deployed
- [ ] Frontend code deployed  
- [ ] Frontend rebuilt with `npm run build`
- [ ] Services restarted
- [ ] Test reset works
- [ ] Test login after reset
- [ ] Verify logs show activity
- [ ] Confirm permission checks work

---

## Files Changed

1. `backend/app/routes/admin.py` - Added endpoint
2. `frontend/src/app/admin/page.tsx` - Added button + handler

No migrations needed.

---

## Summary

**What:** Admin can reset user passwords to default ("password")
**Where:** Admin dashboard user actions
**Why:** Emergency password recovery, troubleshooting login issues
**How:** Click 🔑 key icon, confirm, done
**Security:** Admin-only, permission-gated, fully logged

