# Admin Bulk Actions - Complete Testing Guide

## Test Account Requirements

Need at least 8 test users with different roles:
- User ID 1: admin (cannot delete/change role)
- User ID 2: parent (has children)
- User ID 3: adolescent (has cycle logs, meal logs)
- User ID 4: content_writer
- User ID 5: health_provider
- User ID 6: parent (no children)
- User ID 7: adolescent (no logs)
- User ID 8: admin

---

## TEST GROUP 1: Bulk Delete Users

### Test 1.1: Delete single non-admin user
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [4], "action": "delete"}'
```

**Expected:**
```json
{
  "message": "Deleted 1 users",
  "action": "delete",
  "results": {
    "successful": 1,
    "failed": 0
  }
}
```

**Verify:**
- [ ] User 4 not in database
- [ ] No ContentWriter record for user 4
- [ ] Log shows deletion

---

### Test 1.2: Delete parent with children
```bash
# First create children for user 2
curl -X POST http://localhost:5001/api/parents/add-child \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"adolescent_id": 3, "parent_id": 2}'

# Then delete parent
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [2], "action": "delete"}'
```

**Expected:**
```json
{
  "message": "Deleted 1 users",
  "action": "delete",
  "results": {"successful": 1, "failed": 0}
}
```

**Verify:**
- [ ] User 2 deleted
- [ ] Parent record for user 2 deleted
- [ ] ParentChild relationships deleted
- [ ] User 3 still exists (only link deleted)

---

### Test 1.3: Delete adolescent with cycle logs
```bash
# First add cycle logs for user 7
# Then delete
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [7], "action": "delete"}'
```

**Expected:** 200 with "Deleted 1 users"

**Verify:**
- [ ] User 7 deleted
- [ ] All CycleLog entries deleted
- [ ] All MealLog entries deleted
- [ ] Adolescent profile deleted

---

### Test 1.4: Delete multiple users at once
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [5, 6], "action": "delete"}'
```

**Expected:**
```json
{
  "message": "Deleted 2 users",
  "action": "delete",
  "results": {"successful": 2, "failed": 0}
}
```

---

### Test 1.5: Try to delete admin user (should fail)
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [1], "action": "delete"}'
```

**Expected:** 403
```json
{
  "error": "Cannot delete 1 admin user(s)",
  "admin_user_ids": [1]
}
```

**Verify:**
- [ ] No users deleted
- [ ] Admin user 1 still exists

---

### Test 1.6: Delete mix of regular and admin (should fail)
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [1, 4, 5], "action": "delete"}'
```

**Expected:** 403
```json
{
  "error": "Cannot delete 1 admin user(s)",
  "admin_user_ids": [1]
}
```

**Verify:**
- [ ] All users still exist (transaction rolled back)

---

### Test 1.7: Invalid action value
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [4], "action": "invalid"}'
```

**Expected:** 400
```json
{"error": "Invalid action. Must be one of: activate, deactivate, delete"}
```

---

### Test 1.8: Invalid user_ids (string instead of int)
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": ["invalid"], "action": "delete"}'
```

**Expected:** 400
```json
{"error": "Invalid user_ids. Must be integers"}
```

---

### Test 1.9: Empty user_ids
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [], "action": "delete"}'
```

**Expected:** 400
```json
{"error": "Missing user_ids or action"}
```

---

### Test 1.10: No users found
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [999, 1000], "action": "delete"}'
```

**Expected:** 404
```json
{"error": "No users found with provided IDs"}
```

---

## TEST GROUP 2: Activate/Deactivate Users

### Test 2.1: Activate multiple users
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [3, 4], "action": "activate"}'
```

**Expected:**
```json
{
  "message": "Activated 2 users",
  "action": "activate",
  "results": {"successful": 2, "failed": 0}
}
```

**Verify:**
- [ ] User 3: is_active = true
- [ ] User 4: is_active = true

---

### Test 2.2: Deactivate multiple users
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [3, 4], "action": "deactivate"}'
```

**Expected:**
```json
{
  "message": "Deactivated 2 users",
  "action": "deactivate",
  "results": {"successful": 2, "failed": 0}
}
```

---

## TEST GROUP 3: Single Role Change

### Test 3.1: Change parent to adolescent
```bash
curl -X PATCH http://localhost:5001/api/admin/users/6/change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_type": "adolescent", "date_of_birth": "2010-01-01"}'
```

**Expected:** 200
```json
{
  "message": "User role changed from parent to adolescent",
  "user_type": "adolescent",
  "old_type": "parent"
}
```

**Verify:**
- [ ] User 6: user_type = 'adolescent'
- [ ] Old Parent profile deleted
- [ ] New Adolescent profile created
- [ ] date_of_birth set

---

### Test 3.2: Change adolescent to content_writer
```bash
curl -X PATCH http://localhost:5001/api/admin/users/3/change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_type": "content_writer", "bio": "Expert"}'
```

**Expected:** 200

**Verify:**
- [ ] User 3: user_type = 'content_writer'
- [ ] Old Adolescent profile deleted
- [ ] ParentChild relationships deleted (orphaned)
- [ ] New ContentWriter profile created

---

### Test 3.3: Try to change admin role (should fail)
```bash
curl -X PATCH http://localhost:5001/api/admin/users/1/change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_type": "parent"}'
```

**Expected:** 403
```json
{"error": "Cannot change role of admin users"}
```

**Verify:**
- [ ] User 1 still admin

---

### Test 3.4: Change to same role
```bash
curl -X PATCH http://localhost:5001/api/admin/users/4/change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_type": "content_writer"}'
```

**Expected:** 200
```json
{
  "message": "User already has this role",
  "user_type": "content_writer"
}
```

---

### Test 3.5: Invalid role type
```bash
curl -X PATCH http://localhost:5001/api/admin/users/4/change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_type": "invalid_role"}'
```

**Expected:** 400
```json
{"error": "Invalid user type. Must be one of: parent, adolescent, content_writer, health_provider, admin"}
```

---

## TEST GROUP 4: Bulk Change Role (NEW ⭐)

### Test 4.1: Change multiple users to content_writer
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [3, 4],
    "user_type": "health_provider",
    "specialization": "General Healthcare",
    "license_number": "LIC123"
  }'
```

**Expected:** 200
```json
{
  "message": "Changed role to health_provider for 2 users",
  "results": {
    "successful": 2,
    "failed": 0,
    "total": 2
  }
}
```

**Verify:**
- [ ] User 3: user_type = 'health_provider'
- [ ] User 4: user_type = 'health_provider'
- [ ] Old profiles deleted
- [ ] New HealthProvider profiles created

---

### Test 4.2: Bulk change with mix of admin and regular users (partial failure)
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [1, 3, 4],
    "user_type": "parent"
  }'
```

**Expected:** 200
```json
{
  "message": "Changed role to parent for 2 users",
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

**Verify:**
- [ ] User 3: user_type = 'parent' ✅
- [ ] User 4: user_type = 'parent' ✅
- [ ] User 1: user_type = 'admin' (unchanged) ✅

---

### Test 4.3: Bulk change to same role (all skipped)
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [3, 4],
    "user_type": "parent"
  }'
```

**Expected:** 200
```json
{
  "message": "Changed role to parent for 2 users",
  "results": {
    "successful": 2,
    "failed": 0,
    "total": 2
  }
}
```

**Verify:**
- [ ] No error details (all succeeded)
- [ ] User 3 & 4 unchanged (already parent)

---

### Test 4.4: Invalid user_ids in bulk change
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["not", "integers"],
    "user_type": "parent"
  }'
```

**Expected:** 400
```json
{"error": "Invalid user_ids. Must be integers"}
```

---

### Test 4.5: Invalid role in bulk change
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [3, 4],
    "user_type": "superuser"
  }'
```

**Expected:** 400
```json
{"error": "Invalid user type. Must be one of: parent, adolescent, content_writer, health_provider, admin"}
```

---

### Test 4.6: No users found
```bash
curl -X POST http://localhost:5001/api/admin/users/bulk-change-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [999, 1000],
    "user_type": "parent"
  }'
```

**Expected:** 404
```json
{"error": "No users found with provided IDs"}
```

---

## Post-Test Database Verification

After running tests, verify database integrity:

```bash
# Check no orphaned records
SELECT * FROM parents WHERE user_id NOT IN (SELECT id FROM users);
SELECT * FROM adolescents WHERE user_id NOT IN (SELECT id FROM users);
SELECT * FROM content_writers WHERE user_id NOT IN (SELECT id FROM users);
SELECT * FROM health_providers WHERE user_id NOT IN (SELECT id FROM users);

# Check no orphaned ParentChild relationships
SELECT * FROM parent_child WHERE parent_id NOT IN (SELECT id FROM parents);
SELECT * FROM parent_child WHERE adolescent_id NOT IN (SELECT id FROM adolescents);

# Check cycle logs have valid users
SELECT * FROM cycle_logs WHERE user_id NOT IN (SELECT id FROM users);

# Check admin restrictions
SELECT user_type FROM users WHERE id = 1;  -- Should be 'admin'
```

---

## Regression Tests

Ensure existing functionality still works:

### Single User Operations
- [ ] POST /api/admin/users/<user_id> - Create single user
- [ ] GET /api/admin/users - List all users
- [ ] PATCH /api/admin/users/<user_id>/toggle-status - Toggle one user
- [ ] DELETE /api/admin/users/<user_id> - Delete single user

### Authentication
- [ ] Admin can perform bulk actions
- [ ] Non-admin cannot access bulk endpoints
- [ ] Token validation still works

### Logging
- [ ] All bulk actions logged in system_logs
- [ ] Activity tracking includes success/fail counts

---

## Performance Tests

### Test Load: Bulk Delete 100 Users
```bash
# Create 100 test users first
# Then bulk delete in batches

curl -X POST http://localhost:5001/api/admin/users/bulk-action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [<100 user IDs>], "action": "delete"}'
```

**Metrics:**
- [ ] Response time < 5 seconds
- [ ] Database queries optimized
- [ ] No memory leaks

---

## Summary

Total Tests: 23
- Bulk Delete: 10 tests
- Activate/Deactivate: 2 tests
- Single Role Change: 5 tests
- Bulk Role Change: 6 tests

All tests MUST pass before deployment.

