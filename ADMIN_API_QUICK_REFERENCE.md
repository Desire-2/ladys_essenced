# Admin API Quick Reference

## Base URL
```
http://localhost:5001/api/admin
```

## Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

---

## DASHBOARD (view_analytics)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard/stats` | Get system overview statistics |

---

## USER MANAGEMENT (manage_users)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/users` | List all users (paginated, filterable) |
| GET | `/users/<id>` | Get user details |
| POST | `/users/create` | Create new user |
| PATCH | `/users/<id>/toggle-status` | Activate/deactivate user |
| PATCH | `/users/<id>/reset-password` | Reset password to "password" |
| DELETE | `/users/<id>` | Delete user and cascade delete related data |
| POST | `/users/bulk-action` | Bulk activate/deactivate/delete users |
| PATCH | `/users/<id>/change-role` | Change user type |
| POST | `/users/bulk-change-role` | Change role for multiple users |
| GET | `/users/statistics` | Get comprehensive user statistics |

---

## HEALTH PROVIDERS (manage_users)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health-providers` | List all health providers |
| GET | `/health-providers/<id>` | Get provider details |
| POST | `/health-providers` | Create new health provider |
| PUT | `/health-providers/<id>` | Update provider information |
| DELETE | `/health-providers/<id>` | Delete health provider |
| POST | `/health-providers/<id>/verify` | Verify/unverify provider |
| GET | `/health-providers/<id>/appointments` | Get provider's appointments |
| GET | `/health-providers/statistics` | Get health provider statistics |

---

## CONTENT MANAGEMENT (manage_content)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/content/pending` | Get pending content for review |
| PATCH | `/content/<id>/approve` | Approve and publish content |
| PATCH | `/content/<id>/reject` | Reject content with reason |
| GET | `/courses` | List all courses (filtered, paginated) |
| GET | `/courses/stats` | Get course statistics |
| PATCH | `/courses/<id>/status` | Update course status |
| PUT | `/courses/<id>/status` | Update course status (alternative) |
| DELETE | `/courses/<id>` | Delete course |
| GET | `/content-writers` | List all content writers |

---

## APPOINTMENTS (manage_appointments)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/appointments/manage` | Get all appointments for management |

---

## SYSTEM LOGS (view_system_logs)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/system/logs` | Get system activity logs |

---

## ANALYTICS (view_analytics)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/analytics/generate` | Generate analytics report by type |

### Report Types:
- `overview` - System-wide metrics
- `user_activity` - Daily active users
- `user_registrations` - Signup trends
- `content_performance` - Top content & authors
- `appointments` - Appointment analytics
- `health_tracking` - Cycle & meal tracking data
- `engagement` - User engagement metrics

---

## QUERY PARAMETERS

### Pagination
- `page` (int) - Page number (default: 1)
- `per_page` (int) - Items per page (default varies)

### Filtering
- `user_type` - User type filter
- `status` - Content/appointment status
- `search` - Search by name/email/content
- `is_verified` - Provider verification status
- `specialization` - Provider specialization
- `sort_by` - Sort column
- `sort_order` - 'asc' or 'desc'

### Date Ranges (Analytics)
- `start_date` - ISO 8601 format (e.g., "2025-01-01T00:00:00Z")
- `end_date` - ISO 8601 format

---

## COMMON RESPONSE PATTERNS

### Success Response (200/201)
```json
{
  "message": "Operation successful",
  "data": {...}
}
```

### Paginated Response
```json
{
  "items": [...],
  "total": 100,
  "pages": 5,
  "current_page": 1,
  "has_prev": false,
  "has_next": true
}
```

### Error Response (400/403/404/500)
```json
{
  "error": "Error message",
  "message": "Optional details",
  "details": "Optional stack trace"
}
```

---

## PERMISSION LEVELS

| Permission | Can Do |
|------------|--------|
| `manage_users` | CRUD users, change roles, manage bulk actions |
| `manage_content` | Approve/reject content, manage courses |
| `view_analytics` | Access statistics and generate reports |
| `manage_appointments` | View and manage appointments |
| `view_system_logs` | Access system activity logs |
| `all` | Full admin access (superadmin) |

---

## COMMON WORKFLOWS

### Create User
```bash
POST /api/admin/users/create
{
  "name": "John Doe",
  "phone_number": "1234567890",
  "email": "john@example.com",
  "user_type": "parent",
  "password": "password123"
}
```

### Verify Health Provider
```bash
POST /api/admin/health-providers/<id>/verify
{
  "verify": true
}
```

### Approve Content
```bash
PATCH /api/admin/content/<id>/approve
```

### Reject Content
```bash
PATCH /api/admin/content/<id>/reject
{
  "reason": "Does not meet community standards"
}
```

### Generate Report
```bash
POST /api/admin/analytics/generate
{
  "report_type": "overview",
  "start_date": "2025-11-01T00:00:00Z",
  "end_date": "2025-11-30T23:59:59Z"
}
```

### Bulk Delete Users
```bash
POST /api/admin/users/bulk-action
{
  "user_ids": [1, 2, 3],
  "action": "delete"
}
```

---

## STATUS CODES

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PATCH, PUT, DELETE) |
| 201 | Created (POST) |
| 400 | Bad request (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not admin or insufficient permissions) |
| 404 | Not found |
| 500 | Server error |

---

## ENVIRONMENT SETUP

### Default Test Admin Account
**File:** See [backend/BACKEND_RESTART_GUIDE.md](backend/BACKEND_RESTART_GUIDE.md)

### Development Server
```bash
cd backend
python run.py  # Runs on port 5001
```

### Login Flow
```bash
1. POST /api/auth/login with phone/password
2. Receive access_token and refresh_token
3. Store in localStorage
4. Use access_token in Admin API calls
```

---

## TROUBLESHOOTING

### 403 Forbidden
- ❌ Not admin user
- ❌ Missing permissions
- ✅ Check Admin.permissions field

### 401 Unauthorized
- ❌ Invalid/expired token
- ✅ Re-login to get fresh token
- ✅ Use /api/auth/refresh endpoint

### "Admin profile not found"
- ✅ Auto-created by @admin_required decorator
- ✅ Check logs in `/tmp/blueprint_registration.log`

### Cascade Delete Issues
- Check foreign key constraints
- Verify all related tables have ON DELETE CASCADE
- See admin.py bulk delete for raw SQL approach

---

## FILES REFERENCE

| File | Purpose |
|------|---------|
| [backend/app/routes/admin.py](backend/app/routes/admin.py) | All admin endpoints |
| [backend/app/auth/middleware.py](backend/app/auth/middleware.py) | Admin decorators & permissions |
| [backend/app/models/__init__.py](backend/app/models/__init__.py) | Admin model definition |
| [backend/app/services/admin_notifications.py](backend/app/services/admin_notifications.py) | Admin notification helpers |
| [backend/app/__init__.py](backend/app/__init__.py) | Blueprint registration |

---

## ADDITIONAL RESOURCES

- Full Documentation: [ADMIN_FEATURES_COMPREHENSIVE_ANALYSIS.md](ADMIN_FEATURES_COMPREHENSIVE_ANALYSIS.md)
- Backend Guide: [backend/BACKEND_RESTART_GUIDE.md](backend/BACKEND_RESTART_GUIDE.md)
- Database Migrations: [DATABASE_MIGRATION_SYSTEM.md](DATABASE_MIGRATION_SYSTEM.md)
- Authentication: See JWT authentication in [backend/app/routes/auth.py](backend/app/routes/auth.py)
