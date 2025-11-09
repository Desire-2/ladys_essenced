# Admin Bulk Actions - Quick Reference

## 3 Issues Fixed

### Issue #1: Bulk Delete Users ❌→✅

**Problem:** Deleting users without cascading to dependent records
- CycleLog, MealLog, Appointment, Notification deleted
- ParentChild relationships cleaned up
- Role-specific profiles (Parent, Adolescent, ContentWriter, etc.) deleted

**Fixed:** Added cascade delete logic to match single delete behavior

---

### Issue #2: Change User Role ❌→✅

**Problem:** Changing roles without cleaning up old profiles
- Old profile remained in database (orphaned)
- Could create conflicts when user had both profiles

**Fixed:** 
- Delete old profile before creating new one
- Prevent admin role changes (403 error)
- Clean up ParentChild relationships

---

### Issue #3: Missing Bulk Role Change ❌→✅

**Problem:** No endpoint to change multiple users' roles at once

**Added:** 
```
POST /api/admin/users/bulk-change-role
```

---

## API Reference

### Bulk Delete Users
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [5, 10, 15],
    "action": "delete"
  }'
```

Response:
```json
{
  "message": "Deleted 3 users",
  "action": "delete",
  "results": {
    "successful": 3,
    "failed": 0
  }
}
```

---

### Bulk Activate/Deactivate
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [5, 10, 15],
    "action": "activate"
  }'
```

---

### Single Role Change
```bash
curl -X PATCH http://localhost:5001/api/admin/users/5/change-role \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_type": "content_writer",
    "specialization": "menstrual health"
  }'
```

---

### Bulk Change Roles ⭐ NEW
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-change-role \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [5, 10, 15],
    "user_type": "health_provider",
    "specialization": "General Healthcare",
    "license_number": "LIC123"
  }'
```

Response:
```json
{
  "message": "Changed role to health_provider for 3 users",
  "results": {
    "successful": 3,
    "failed": 0,
    "total": 3
  }
}
```

---

## Error Handling

### Admin User Deletion Prevented
```json
{
  "error": "Cannot delete 1 admin user(s)",
  "admin_user_ids": [1]
}
```

### Admin Role Change Prevented
```json
{
  "error": "Cannot change role of admin users"
}
```

### Invalid Role
```json
{
  "error": "Invalid user type. Must be one of: parent, adolescent, content_writer, health_provider, admin"
}
```

### Partial Failures in Bulk
```json
{
  "message": "Changed role to content_writer for 2 users",
  "results": {
    "successful": 2,
    "failed": 1,
    "total": 3
  },
  "details": [
    {
      "user_id": 1,
      "error": "Cannot change role of admin users"
    }
  ]
}
```

---

## Validation Rules

✅ Validate user_ids are integers
✅ Validate action is in ['activate', 'deactivate', 'delete']
✅ Validate user_type is in valid types
✅ Prevent admin role changes
✅ Handle parent/adolescent relationship cleanup
✅ Return per-user success/failure tracking

---

## Database Cleanup on Delete

When a user is deleted:
1. CycleLog entries → deleted
2. MealLog entries → deleted
3. Appointment entries → deleted
4. Notification entries → deleted
5. UserSession entries → deleted
6. ParentChild relationships → deleted (if parent/adolescent)
7. Role profile (Parent/Adolescent/etc) → deleted
8. User record → deleted

---

## Key Changes in Files

**backend/app/routes/admin.py**

Added imports:
```python
from app.models import (
    ..., ParentChild, UserSession
)
```

Enhanced functions:
- `bulk_user_action()` - Added cascade delete, validation, per-user tracking
- `change_user_role()` - Added cleanup, admin prevention, better validation

New function:
- `bulk_change_user_role()` - Bulk role changes for multiple users

---

## Testing

```bash
# Test 1: Delete mix of user types
POST /api/admin/users/bulk-action
{"user_ids": [5, 10], "action": "delete"}

# Test 2: Try to delete admin
POST /api/admin/users/bulk-action
{"user_ids": [1], "action": "delete"}
# Response: 403 error

# Test 3: Change roles in bulk
POST /api/admin/users/bulk-change-role
{"user_ids": [5, 10], "user_type": "content_writer"}

# Test 4: Partial failure (mix of regular + admin)
POST /api/admin/users/bulk-change-role
{"user_ids": [1, 5, 10], "user_type": "adolescent"}
# Response: 200 with 2 successful, 1 failed

# Test 5: Invalid inputs
POST /api/admin/users/bulk-action
{"user_ids": ["invalid"], "action": "delete"}
# Response: 400 error - "Invalid user_ids"
```

---

## Summary

| Issue | Before | After |
|-------|--------|-------|
| Bulk Delete | ❌ 500 Error | ✅ Cascades all dependent records |
| Role Change | ❌ Orphaned old profile | ✅ Cleans up old profile |
| Admin Changes | ❌ Allowed | ✅ Prevented (403) |
| Validation | ❌ Minimal | ✅ Comprehensive |
| Responses | ❌ Generic | ✅ Detailed per-user tracking |
| Bulk Roles | ❌ Not available | ✅ New endpoint |

