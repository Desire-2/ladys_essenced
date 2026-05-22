# Admin User Type - Complete Data Flow & Architecture

## 1. Admin User Creation Flow

### Step 1: User Registration (If Using UI)
```
Frontend: POST /api/auth/register or POST /api/admin/users/create
    ↓
Backend: Validates input
    ↓
Create User record:
    {
        name: "Admin Name",
        phone_number: "1234567890",
        email: "admin@example.com",
        password_hash: bcrypt(password),
        user_type: "admin",    ← KEY FIELD
        is_active: true,
        created_at: datetime.utcnow(),
        allow_parent_access: true
    }
    ↓
Create Admin Profile:
    {
        user_id: <newly_created_user.id>,
        permissions: {
            "manage_users": true,
            "manage_content": true,
            "view_analytics": true,
            "manage_appointments": true,
            "view_system_logs": true,
            "all": true
        },
        department: "Administration",
        created_at: datetime.utcnow()
    }
    ↓
Return: 201 with user_id and admin_profile info
```

### Step 2: Admin Login Flow
```
Frontend: POST /api/auth/login
    {
        phone_number: "1234567890",
        password: "password123"
    }
    ↓
Backend /api/auth/login:
    1. Find User by phone_number
    2. Verify password hash using bcrypt
    3. Check user.is_active == true
    4. Check user.user_type == "admin"
    5. Generate JWT token
    6. Return { access_token, refresh_token }
    ↓
Frontend: Store in localStorage
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', refresh_token)
    ↓
Redirect: /admin or /dashboard/admin
```

---

## 2. Admin Model & Database Schema

### Admin Table Schema
```sql
CREATE TABLE admins (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    permissions TEXT,  -- JSON: {"manage_users": true, "manage_content": true, ...}
    department VARCHAR(100),
    created_at DATETIME DEFAULT current_timestamp
);
```

### Related User Record
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(120) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) DEFAULT 'adolescent',  -- 'admin' for admin users
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT current_timestamp,
    updated_at DATETIME DEFAULT current_timestamp,
    allow_parent_access BOOLEAN DEFAULT true,
    ...
);
```

### Relationship
```
User (id) 1─── 1 Admin
├── Unique: Only one Admin profile per User
├── user_type = 'admin' (enforced in business logic)
└── Admin.user provides access to User details
```

### Permission Storage Format
```json
// Preferred: Object format
{
  "manage_users": true,
  "manage_content": true,
  "view_analytics": true,
  "manage_appointments": true,
  "view_system_logs": true,
  "all": true
}

// Legacy: Array format
["manage_users", "manage_content", "view_analytics", "manage_appointments", "view_system_logs", "all"]
```

---

## 3. Admin Authentication & Authorization Middleware

### Authentication Decorator: `@admin_required`
```python
@wraps(f)
def decorated(*args, **kwargs):
    # Step 1: Verify JWT token exists and is valid
    verify_jwt_in_request()
    
    # Step 2: Extract user ID from token payload
    current_user_id = get_jwt_identity()
    
    # Step 3: Fetch User record
    current_user = User.query.get(int(current_user_id))
    
    # Step 4: Validate user exists and is active
    if not current_user or not current_user.is_active:
        return { "error": "User not found or inactive" }, 401
    
    # Step 5: Check user_type == 'admin'
    if current_user.user_type != 'admin':
        return { "error": "Admin access required" }, 403
    
    # Step 6: Get Admin profile (auto-create if missing)
    admin_profile = Admin.query.filter_by(user_id=current_user.id).first()
    if not admin_profile:
        # Auto-create with default all permissions
        admin_profile = Admin(
            user_id=current_user.id,
            permissions=json.dumps({
                "manage_users": True,
                "manage_content": True,
                "view_analytics": True,
                "manage_appointments": True,
                "view_system_logs": True,
                "all": True
            })
        )
        db.session.add(admin_profile)
        db.session.commit()
    
    # Step 7: Store in Flask g context for endpoint use
    g.current_user = current_user
    g.admin_profile = admin_profile
    
    # Step 8: Call endpoint
    return f(*args, **kwargs)
```

### Authorization Decorator: `@check_permissions(required_permissions)`
```python
def decorator(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Step 1: Verify admin profile exists
        if not hasattr(g, 'admin_profile') or not g.admin_profile:
            return { "error": "Admin profile required" }, 403
        
        # Step 2: Parse permissions (handle both formats)
        permissions_str = g.admin_profile.permissions or '{}'
        user_permissions = json.loads(permissions_str)
        
        # Step 3: Check if user has 'all' permission
        if isinstance(user_permissions, dict):
            if user_permissions.get('all') is True:
                return f(*args, **kwargs)  # Grant access
        
        # Step 4: Check for specific required permissions
        if isinstance(user_permissions, dict):
            if all(user_permissions.get(perm) is True for perm in required_permissions):
                return f(*args, **kwargs)  # Grant access
        elif isinstance(user_permissions, list):
            if 'all' in user_permissions or all(perm in user_permissions for perm in required_permissions):
                return f(*args, **kwargs)  # Grant access
        
        # Step 5: Deny access
        return { "error": "Insufficient permissions" }, 403
    
    return decorated
```

---

## 4. Request Flow for Admin Endpoint

### Example: GET /api/admin/users (List All Users)

```
Frontend:
    GET http://localhost:5001/api/admin/users?page=1&user_type=parent
    Headers: {
        Authorization: "Bearer eyJhbGc..."
    }
    ↓
Backend Middleware:
    1. Extract token from header
    2. Decode JWT and get user_id
    3. Fetch User record
    ↓
@admin_required decorator:
    1. Verify JWT ✓
    2. Check User exists & is_active ✓
    3. Check user_type == 'admin' ✓
    4. Fetch Admin profile ✓
    5. Store in g.current_user & g.admin_profile
    ↓
@check_permissions(['manage_users']):
    1. Get permissions from g.admin_profile
    2. Check if 'manage_users' permission is true ✓
    ↓
Endpoint: get_all_users():
    1. Get query parameters
    2. Build SQL query with filters
    3. Paginate results
    4. log_user_activity('view_users_list', {...})
       ↓ Creates SystemLog entry
    5. Return JSON response with users list
    ↓
Frontend:
    Display users in table with pagination
```

---

## 5. System Logging - Activity Tracking

### SystemLog Model
```python
class SystemLog(db.Model):
    __tablename__ = 'system_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(255))  # e.g., 'view_users_list', 'delete_user'
    details = db.Column(db.Text)  # JSON with contextual data
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### Logging Function
```python
def log_user_activity(action, details=None):
    try:
        if hasattr(g, 'current_user') and g.current_user:
            log_entry = SystemLog(
                user_id=g.current_user.id,
                action=action,
                details=json.dumps(details) if details else None,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            db.session.add(log_entry)
            db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Failed to log activity: {str(e)}")
```

### Example Log Entries
```
Action: view_users_list
Details: {
    "page": 1,
    "user_type": "parent",
    "search": null
}
IP: 192.168.1.100
Timestamp: 2025-11-22 14:30:00

---

Action: delete_user
Details: {
    "deleted_user_id": 42,
    "user_name": "John Doe"
}
IP: 192.168.1.100
Timestamp: 2025-11-22 14:35:00
```

---

## 6. Admin Notification System

### Notification Helpers (Called by Admin Actions)
```python
# Located in: backend/app/services/admin_notifications.py

def notify_provider_verified(provider_id):
    """Send notification to health provider about verification"""
    provider = HealthProvider.query.get(provider_id)
    if provider and provider.user:
        notification = Notification(
            user_id=provider.user_id,
            title='Account Verified',
            message='Your health provider account has been verified',
            type='system'
        )
        db.session.add(notification)
        db.session.commit()

def notify_content_approved(content_id, author_id):
    """Send notification to content author about approval"""
    content = ContentItem.query.get(content_id)
    notification = Notification(
        user_id=author_id,
        title='Content Approved',
        message=f'Your content "{content.title}" has been approved and published',
        type='system'
    )
    db.session.add(notification)
    db.session.commit()

def notify_content_rejected(content_id, author_id, reason):
    """Send notification to content author about rejection"""
    content = ContentItem.query.get(content_id)
    notification = Notification(
        user_id=author_id,
        title='Content Rejected',
        message=f'Your content "{content.title}" was rejected. Reason: {reason}',
        type='system'
    )
    db.session.add(notification)
    db.session.commit()
```

### Notification Flow
```
Admin Action
    (e.g., POST /health-providers/<id>/verify)
    ↓
Admin Handler
    Updates provider.is_verified = true
    Calls notify_provider_verified(provider_id)
    ↓
Notification System
    Creates Notification record
    Stores in notifications table
    ↓
Frontend (RealTime Notifications)
    Fetches via WebSocket or polling
    Displays in notification center
    ↓
User Sees
    Notification badge/alert
    Can click to view details
```

---

## 7. Cascade Delete Handling

### Example: DELETE User (Admin Action)

```python
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
@check_permissions(['manage_users'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    
    # Prevent deleting admin users
    if user.user_type == 'admin':
        return { "error": "Cannot delete admin users" }, 403
    
    # DELETE PHASE 1: User-owned data
    CycleLog.query.filter_by(user_id=user_id).delete()
    MealLog.query.filter_by(user_id=user_id).delete()
    Appointment.query.filter_by(user_id=user_id).delete()
    Notification.query.filter_by(user_id=user_id).delete()
    UserSession.query.filter_by(user_id=user_id).delete()
    
    # DELETE PHASE 2: Role-specific profiles & relationships
    if user.user_type == 'parent':
        parent = Parent.query.filter_by(user_id=user_id).first()
        if parent:
            ParentChild.query.filter_by(parent_id=parent.id).delete()
            db.session.delete(parent)
    
    elif user.user_type == 'adolescent':
        adolescent = Adolescent.query.filter_by(user_id=user_id).first()
        if adolescent:
            ParentChild.query.filter_by(adolescent_id=adolescent.id).delete()
            db.session.delete(adolescent)
    
    elif user.user_type == 'content_writer':
        content_writer = ContentWriter.query.filter_by(user_id=user_id).first()
        if content_writer:
            ContentItem.query.filter_by(author_id=content_writer.id).update({'author_id': None})
            db.session.delete(content_writer)
    
    elif user.user_type == 'health_provider':
        health_provider = HealthProvider.query.filter_by(user_id=user_id).first()
        if health_provider:
            Appointment.query.filter_by(provider_id=health_provider.id).update({'provider_id': None})
            db.session.delete(health_provider)
    
    elif user.user_type == 'admin':
        admin_profile = Admin.query.filter_by(user_id=user_id).first()
        if admin_profile:
            db.session.delete(admin_profile)
    
    # DELETE PHASE 3: User record
    db.session.delete(user)
    db.session.commit()
    
    log_user_activity('delete_user', {
        'deleted_user_id': user_id,
        'user_name': user.name
    })
    
    return { "message": f"User {user.name} deleted successfully" }, 200
```

---

## 8. Analytics Report Generation

### Report Generation Flow
```
Frontend: POST /api/admin/analytics/generate
    {
        "report_type": "overview",
        "start_date": "2025-11-01T00:00:00Z",
        "end_date": "2025-11-30T23:59:59Z"
    }
    ↓
Backend Handler:
    1. Parse and validate report_type
    2. Parse ISO date strings
    3. Set defaults (last 30 days if not provided)
    ↓
Report Engine (7 types):
    ├─ overview: System metrics
    ├─ user_activity: Daily active users
    ├─ user_registrations: Signup trends
    ├─ content_performance: Content analytics
    ├─ appointments: Appointment metrics
    ├─ health_tracking: Tracking data
    └─ engagement: User engagement
    ↓
Data Collection:
    Run aggregation queries
    Group by date/type/status
    Calculate metrics
    ↓
Return JSON Response:
    {
        "report_type": "overview",
        "period": { "start": "...", "end": "..." },
        "summary": { ... },
        "user_types": [ ... ],
        "monthly_growth": [ ... ]
    }
    ↓
Frontend:
    Parse JSON
    Create charts/tables
    Display visualizations
```

---

## 9. Security Considerations

### Password Security
```python
# Using bcrypt for hashing
from app import bcrypt

# Generate hash
password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

# Verify password
bcrypt.check_password_hash(user.password_hash, password)
```

### JWT Token Security
```
Token Structure:
    Header.Payload.Signature
    
Payload Contains:
    - user_id (identity)
    - iat (issued at)
    - exp (expiration - default 15 min)
    - fresh (freshness)
    
Storage:
    - access_token: localStorage (15 min lifetime)
    - refresh_token: localStorage (24 hour lifetime)
    
Refresh Flow:
    - Access token expires
    - Frontend uses refresh_token to get new access_token
    - POST /api/auth/refresh with refresh_token
```

### Permission Validation
```
Hierarchy:
    "all": true (grants all permissions)
    ↓
    Specific permissions: ["manage_users", "manage_content", ...]
    ↓
    Denied access (insufficient permissions)
```

### Audit Trail
```
Every admin action logged to SystemLog:
    - User ID
    - Action name
    - Contextual details (JSON)
    - IP address
    - User-Agent
    - Timestamp

Viewable via: GET /api/admin/system/logs
```

---

## 10. Common Issues & Solutions

### Issue: "Admin access required" (403)
**Cause:** User.user_type != 'admin'
**Solution:**
```bash
# Check user type in database
SELECT id, name, user_type FROM users WHERE id = ?;

# Update if needed
UPDATE users SET user_type = 'admin' WHERE id = ?;
```

### Issue: "Insufficient permissions" (403)
**Cause:** Admin.permissions doesn't include required permission
**Solution:**
```bash
# Check permissions
SELECT permissions FROM admins WHERE user_id = ?;

# Update permissions if needed
UPDATE admins SET permissions = '{"all": true}' WHERE user_id = ?;
```

### Issue: Admin profile not found but user is admin
**Cause:** Missing Admin record in admins table
**Solution:**
```bash
# @admin_required decorator auto-creates it
# Or manually create:
INSERT INTO admins (user_id, permissions, department) 
VALUES (?, '{"all": true}', 'Administration');
```

### Issue: Cascade delete fails
**Cause:** Foreign key constraint violation
**Solution:**
- Use raw SQL for delete (as in admin.py bulk delete)
- Update related records to NULL before deleting
- Check database constraints: `PRAGMA foreign_keys;`

---

## 11. Integration with Frontend

### Frontend Admin Context (Example)
```javascript
// contexts/AdminContext.js
const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const { user, hasRole } = useAuth();
    
    // Only provide context if user is admin
    if (!user || !hasRole('admin')) {
        return null;
    }
    
    return (
        <AdminContext.Provider value={{ /* admin data */ }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => useContext(AdminContext);
```

### Frontend Admin Dashboard Route
```javascript
// app/dashboard/admin/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';

export default function AdminDashboard() {
    const { hasRole } = useAuth();
    const { dashboardStats } = useAdmin();
    
    if (!hasRole('admin')) {
        return redirect('/');
    }
    
    return (
        <div className="admin-dashboard">
            <h1>System Dashboard</h1>
            {/* Render admin components */}
        </div>
    );
}
```

---

## Summary

The Admin user type provides:
- ✅ Complete system management
- ✅ Role-based access control (RBAC)
- ✅ Permission-based authorization
- ✅ Comprehensive activity logging
- ✅ Multi-level security (JWT + permissions)
- ✅ Notification integration
- ✅ Analytics and reporting
- ✅ Cascade-safe data deletion
- ✅ Bulk operations support

All admin features are protected by JWT authentication and role-based decorators with detailed audit logging for compliance and security.
