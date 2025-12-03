# Health Provider Management - Admin Dashboard

## Overview
Comprehensive health provider management system for Lady's Essence admin dashboard. Enables administrators to create, view, update, verify, and manage health providers who book appointments with users.

## Features

### Backend API Endpoints (Flask)

#### 1. List All Health Providers
```
GET /api/admin/health-providers
```
**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Results per page (default: 20)
- `search` (string): Search by name, email, clinic name, specialization, or license number
- `is_verified` (boolean): Filter by verification status
- `specialization` (string): Filter by specialization

**Response:**
```json
{
  "providers": [
    {
      "id": 1,
      "user_id": 10,
      "name": "Dr. Jane Smith",
      "email": "jane.smith@clinic.com",
      "phone": "250788123456",
      "license_number": "MED12345",
      "specialization": "Gynecology",
      "clinic_name": "Women's Health Clinic",
      "clinic_address": "123 Kigali Street",
      "is_verified": true,
      "is_active": true,
      "created_at": "2025-01-15T10:00:00",
      "appointments": {
        "total": 45,
        "pending": 5,
        "completed": 40
      }
    }
  ],
  "total": 50,
  "pages": 3,
  "current_page": 1,
  "has_prev": false,
  "has_next": true
}
```

#### 2. Get Provider Details
```
GET /api/admin/health-providers/{provider_id}
```
**Response:**
```json
{
  "id": 1,
  "name": "Dr. Jane Smith",
  "email": "jane.smith@clinic.com",
  "specialization": "Gynecology",
  "license_number": "MED12345",
  "clinic_name": "Women's Health Clinic",
  "clinic_address": "123 Kigali Street",
  "is_verified": true,
  "is_active": true,
  "availability_hours": {
    "monday": {"start": "09:00", "end": "17:00", "enabled": true},
    "tuesday": {"start": "09:00", "end": "17:00", "enabled": true}
  },
  "statistics": {
    "total_appointments": 45,
    "by_status": {
      "pending": 5,
      "confirmed": 10,
      "completed": 30
    }
  },
  "recent_appointments": [...]
}
```

#### 3. Create Health Provider
```
POST /api/admin/health-providers
```
**Request Body:**
```json
{
  "name": "Dr. Test Provider",
  "email": "test@clinic.com",
  "phone_number": "250788999999",
  "password": "securepassword",
  "specialization": "General Practice",
  "license_number": "MED67890",
  "clinic_name": "Test Clinic",
  "clinic_address": "456 Test Street",
  "is_verified": false
}
```

**Required Fields:** name, email, password, specialization

#### 4. Update Health Provider
```
PUT /api/admin/health-providers/{provider_id}
```
**Request Body:** (all fields optional)
```json
{
  "name": "Dr. Updated Name",
  "specialization": "Gynecology & Obstetrics",
  "is_verified": true,
  "is_active": true
}
```

#### 5. Verify/Unverify Provider
```
POST /api/admin/health-providers/{provider_id}/verify
```
**Request Body:**
```json
{
  "verify": true
}
```
**Note:** Automatically sends notification to provider about verification status change.

#### 6. Delete Health Provider
```
DELETE /api/admin/health-providers/{provider_id}?delete_user=true
```
**Query Parameters:**
- `delete_user` (boolean): Whether to also delete the associated user account

**Validation:** Cannot delete providers with active appointments (pending/confirmed).

#### 7. Get Provider Appointments
```
GET /api/admin/health-providers/{provider_id}/appointments
```
**Query Parameters:**
- `page`, `per_page`, `status`

#### 8. Get Provider Statistics
```
GET /api/admin/health-providers/statistics
```
**Response:**
```json
{
  "total_providers": 25,
  "verified_providers": 20,
  "unverified_providers": 5,
  "active_providers": 18,
  "by_specialization": [
    {"specialization": "Gynecology", "count": 10},
    {"specialization": "General Practice", "count": 8}
  ],
  "recent_providers": [...]
}
```

### Frontend Component

#### Location
`frontend/src/components/admin/HealthProviderManagement.tsx`

#### Features
1. **Statistics Dashboard**
   - Total providers count
   - Verified vs unverified breakdown
   - Active providers (last 30 days)
   - Specialization distribution

2. **Provider List Table**
   - Sortable columns
   - Search functionality (name, email, clinic, specialization, license)
   - Verification status badges
   - Appointment counts
   - Quick actions (view, edit, verify, delete)

3. **Filter Options**
   - Search by text
   - Filter by verification status
   - Filter by specialization

4. **Create Provider Modal**
   - Full form with validation
   - Required fields: name, email, password, specialization
   - Optional: license number, clinic details
   - Instant verification option

5. **Edit Provider Modal**
   - Update all provider fields
   - Change verification status
   - Update user account status

6. **Provider Details Modal**
   - Complete provider information
   - Appointment statistics
   - Recent appointments list
   - Availability schedule

7. **Toast Notifications**
   - Success/error feedback for all actions
   - Auto-dismiss after 5 seconds

#### Usage in Admin Dashboard

Added to `frontend/src/app/admin/page.tsx`:

```tsx
import HealthProviderManagement from '../../components/admin/HealthProviderManagement';

// In navigation tabs
{ id: 'health-providers', label: 'Health Providers', icon: 'fas fa-user-md' }

// In render
{activeTab === 'health-providers' && (
  <div>
    <HealthProviderManagement />
  </div>
)}
```

## Database Models

### HealthProvider Model
```python
class HealthProvider(db.Model):
    __tablename__ = 'health_providers'
    
    id = Integer (Primary Key)
    user_id = Integer (Foreign Key -> users.id)
    license_number = String(50)
    specialization = String(100)
    clinic_name = String(200)
    clinic_address = Text
    phone = String(20)
    email = String(120)
    is_verified = Boolean (default: False)
    availability_hours = Text (JSON)
    created_at = DateTime
    
    # Relationships
    user = relationship('User')
    managed_appointments = relationship('Appointment')
```

## Authorization

All endpoints require:
1. **JWT Authentication**: Valid access token in `Authorization: Bearer <token>` header
2. **Admin Role**: User must have `user_type = 'admin'`
3. **Permissions**: `manage_users` permission for CUD operations, `view_analytics` for read-only

Middleware decorators used:
- `@admin_required`
- `@check_permissions(['manage_users'])`

## Testing

### Manual Testing Script
Run `backend/test_health_provider_admin.sh`:
```bash
cd backend
./test_health_provider_admin.sh
```

Tests:
1. Admin login
2. List providers
3. Get statistics
4. Create provider
5. Get provider details
6. Update provider
7. Toggle verification
8. Get provider appointments

### Frontend Testing
1. Navigate to admin dashboard: `http://localhost:3000/admin`
2. Click "Health Providers" tab
3. Test all CRUD operations
4. Verify filtering and pagination
5. Check toast notifications

## Security Features

1. **Password Hashing**: Uses Flask-Bcrypt for secure password storage
2. **Email Uniqueness**: Validates email not already registered
3. **Role-Based Access**: Only admins can access these endpoints
4. **Verification System**: Two-tier verification (is_verified + is_active)
5. **Delete Protection**: Cannot delete providers with active appointments
6. **Audit Logging**: All actions logged via `log_user_activity()`

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK`: Successful operation
- `201 Created`: Provider created
- `400 Bad Request`: Invalid input/validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Provider not found
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Performance Optimizations

1. **Pagination**: Default 20 items per page
2. **Indexed Queries**: Filters use database indexes
3. **Eager Loading**: User relationships loaded efficiently
4. **Aggregation**: Statistics use SQL aggregation functions
5. **Caching**: Frontend component caches API responses

## Notifications

When provider verification status changes:
- Automatic notification sent to provider's user account
- Notification type: `system`
- Contains verification status and next steps
- Stored in database and available in-app

## Related Documentation

- `DATABASE_MIGRATION_SYSTEM.md` - Schema changes
- `BACKEND_RESTART_GUIDE.md` - Testing accounts
- `DEVELOPER_QUICK_REFERENCE.md` - API patterns
- `PARENT_CHILD_ACCESS_ENHANCEMENT.md` - Authorization patterns

## Future Enhancements

1. **Bulk Operations**: Verify/delete multiple providers
2. **Export Function**: CSV/Excel export of provider list
3. **Analytics**: Provider performance metrics
4. **Schedule Management**: Admin-side availability editing
5. **Provider Reviews**: Patient feedback system
6. **Appointment Assignment**: Manually assign appointments
7. **Email Notifications**: Send verification emails
8. **Document Upload**: License/certification uploads

## Maintenance Notes

- Always use migrations for schema changes: `flask db migrate`
- Test authorization on all endpoints before deploying
- Keep statistics queries optimized (use SQL aggregation)
- Monitor appointment counts for performance
- Regular audit of inactive/unverified providers
