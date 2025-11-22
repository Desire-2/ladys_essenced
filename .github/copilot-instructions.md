# Lady's Essence - AI Coding Agent Instructions

## Project Overview
Lady's Essence is a women's health application targeting rural/underserved areas, focusing on menstrual health tracking, pregnancy care, and family health management. The system supports **multi-role access** (parents, adolescents, health providers, admins, content writers) with sophisticated parent-child relationship management.

## Architecture

### Tech Stack
- **Backend**: Flask 3.1.0 + SQLAlchemy 2.0 + PostgreSQL/SQLite + Flask-JWT-Extended + Flask-Migrate (Alembic)
- **Frontend**: Next.js 15.2.4 (App Router) + React 19 + TypeScript 5 + Bootstrap 5.3.5
- **Deployment**: Docker Compose (backend:5000, frontend:3000, postgres:5432) 
  - **Dev Environment**: Backend runs on port 5001, Frontend on port 3000

### Project Structure
```
backend/
  app/
    __init__.py          # Flask app factory, CORS config, blueprint registration
    models/__init__.py   # 20+ SQLAlchemy models (User, Parent, Adolescent, CycleLog, etc.)
    models/notification.py # Enhanced notification system with templates & subscriptions
    models/insight_cache.py # AI insights caching for cycle predictions
    routes/              # RESTful API blueprints (auth, parents, cycle_logs, appointments, etc.)
    routes/parent_appointments.py # Child appointment booking (650 lines)
    auth/middleware.py   # JWT decorators (token_required, role_required)
  migrations/            # Alembic migration files - NEVER use db.drop_all()
  run.py                # Entry point (port 5001 for dev)

frontend/
  src/
    app/                 # Next.js App Router pages
      dashboard/         # Role-specific dashboards (parent/, admin/, health-provider/)
    contexts/            # React Context providers (AuthContext.js, ChildAccessContext.js, etc.)
      AuthContext.js     # JWT authentication & role management
      ChildAccessContext.js # Parent-child access switching
      NotificationContext.js # Real-time notifications
    config/api.ts        # Centralized API configuration & helper functions
    components/          # Reusable UI components
      parent/ChildAppointmentBooking.tsx # 4-step appointment wizard (450 lines)
```

## Critical Development Patterns

### 1. Database Migrations (NOT db.create_all())
**The database uses Flask-Migrate for schema management. NEVER use `db.create_all()` or `db.drop_all()`.** All data is preserved across restarts.

```bash
# After model changes:
cd backend
flask db migrate -m "Description of changes"
flask db upgrade

# Check migration status:
flask db current
flask db history
```

See `DATABASE_MIGRATION_SYSTEM.md` for emergency procedures. The system was migrated from auto-recreation (data loss) to production-safe migrations on Nov 2025.

### 2. JWT Authentication Pattern
**All API requests require JWT tokens stored in localStorage:**

```typescript
// Frontend: Token stored as 'access_token' (not 'token')
const token = localStorage.getItem('access_token');
headers: { 'Authorization': `Bearer ${token}` }

// Backend: Extract user identity
from flask_jwt_extended import jwt_required, get_jwt_identity

@jwt_required()
def endpoint():
    current_user_id = get_jwt_identity()  # Returns string
```

**Token refresh flow**: Frontend auto-refreshes on 401 using `/api/auth/refresh` endpoint with refresh_token.

### 3. Multi-Role Access Control
**5 user types with distinct permissions and dashboards:**

```python
# Backend role validation pattern (see routes/parents.py):
user = User.query.get(current_user_id)
if user.user_type != 'parent':
    return jsonify({'message': 'Only parent accounts...'}), 403

# Frontend role checking (see contexts/AuthContext.js):
const { hasRole } = useAuth();
if (hasRole('parent')) { /* render parent features */ }
```

**Dashboard routing**:
- `parent` → `/dashboard/parent` (ParentContext + ChildAccessContext)
- `adolescent` → `/dashboard` (own data only)
- `admin` → `/admin`
- `health_provider` → `/health-provider`
- `content_writer` → `/content-writer`

### 4. Parent-Child Authorization (CRITICAL)
**Parents can manage multiple children's data. Every child data endpoint MUST validate parent-child relationship:**

```python
# Required authorization pattern (see routes/parents.py line 262-280):
@jwt_required()
def get_child_data(adolescent_id):
    # 1. Verify user is parent
    user = User.query.get(get_jwt_identity())
    if user.user_type != 'parent':
        return jsonify({'message': 'Unauthorized'}), 403
    
    # 2. Get parent record
    parent = Parent.query.filter_by(user_id=user.id).first()
    
    # 3. CRITICAL: Verify parent-child relationship
    relation = ParentChild.query.filter_by(
        parent_id=parent.id, 
        adolescent_id=adolescent_id
    ).first()
    if not relation:
        return jsonify({'message': 'Child not found'}), 404
    
    # 4. Check if adolescent allows parent access (NEW PRIVACY CONTROL)
    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)
    if not child_user.allow_parent_access:
        return jsonify({'message': 'Access denied: Child has disabled parent access'}), 403
    
    # 5. Use child's user_id for data queries (NOT parent's)
    child_user_id = adolescent.user_id  # Use this for CycleLog/MealLog/Appointment
```

**Frontend pattern** (see `contexts/ChildAccessContext.js`):
```javascript
const { accessedChild, switchToChild } = useChildAccess();
// accessedChild stored in localStorage, cleared on logout
```

### 5. API Client Configuration
**Backend runs on port 5001 (not 5000) to avoid conflicts:**

```typescript
// frontend/src/config/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// All API calls use centralized client with auto-retry on 401
import { apiCall, apiPost } from './config/api';
```

**CORS origins** (backend/app/__init__.py line 123): Whitelist includes localhost:3000-3005, Vercel domains.

### 6. Enhanced Notification System
**Real-time notifications with templates and subscriptions** (see `models/notification.py`):

```python
# Backend: Create notification with template
notification = Notification.create_from_template(
    'appointment_confirmed', 
    user_id=user_id,
    data={'appointment_date': '2025-11-15', 'provider_name': 'Dr. Smith'}
)

# Frontend: Subscribe to notifications
const { notifications, markAsRead } = useNotification();
```

**Notification channels**: in-app, email, SMS (configurable per user)

## Common Tasks

### Starting Development Servers
```bash
# Backend (port 5001):
cd backend
source venv/bin/activate  # or use: python -m venv venv
python run.py

# Frontend (port 3000):
cd frontend
npm run dev
```

**Health check**: `curl http://localhost:5001/health`

### Testing Authentication Flow
```bash
# 1. Login to get token:
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "1111111111", "password": "testpass"}'

# 2. Use token in requests:
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/parents/children
```

See `BACKEND_RESTART_GUIDE.md` for test accounts and `test.md` for credentials.

### Adding New Features
1. **Backend**: Update models → `flask db migrate` → add routes → register blueprint in `app/__init__.py`
2. **Frontend**: Create component → add to appropriate dashboard → use `useAuth()` for role checks
3. **Always validate parent-child relationships** for family data features
4. **Never create user-facing files without authorization checks**

## Project-Specific Conventions

### Model Relationships
- `User` (base) → `Parent`/`Adolescent`/`Admin`/`HealthProvider`/`ContentWriter` (1:1)
- `ParentChild` (junction table) links Parent.id to Adolescent.id
- **User IDs**: CycleLog/MealLog/Appointment use `user_id` (child's User.id, NOT Adolescent.id)

### Password Hashing
**Always use Flask-Bcrypt** (see `routes/auth.py` line 28):
```python
from app import bcrypt
password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
bcrypt.check_password_hash(user.password_hash, password)
```

### PIN Authentication
4-digit PINs supported as alternative login method (see `ENHANCED_PIN_AUTHENTICATION.md`):
```python
# Both password and PIN stored as bcrypt hashes
User.password_hash, User.pin_hash, User.enable_pin_auth
```

### Frontend Context Providers
**Context hierarchy** (see `contexts/index.js`):
```jsx
<AuthProvider>
  <ParentProvider>
    <ChildAccessProvider>
      {/* Parent dashboard components */}
    </ChildAccessProvider>
  </ParentProvider>
</AuthProvider>
```

### Cycle Prediction Algorithms
Intelligent cycle tracking uses weighted moving average + exponential smoothing (see `DEVELOPER_QUICK_REFERENCE.md` line 88-95). Endpoints return confidence levels (high/medium/low) based on data quality.

## Documentation Index
The project has 100+ documentation files. Start with:
- `00_MASTER_INDEX_START_HERE.md` - Navigation hub
- `DATABASE_MIGRATION_SYSTEM.md` - Migration workflows
- `BACKEND_RESTART_GUIDE.md` - Testing/debugging commands
- `PARENT_CHILD_ACCESS_ENHANCEMENT.md` - Authorization patterns
- `COMPREHENSIVE_CHILD_APPOINTMENT_SUMMARY.md` - Feature implementation example

## Recent System Enhancements

### Notification System (Nov 2025)
**Advanced notification framework with templates and multi-channel delivery:**
- **Templates**: Pre-defined notification templates with placeholder substitution
- **Channels**: In-app, email, SMS support with user preferences
- **Subscriptions**: Users can subscribe/unsubscribe from notification categories
- **Models**: `Notification`, `NotificationTemplate`, `NotificationSubscription` (see `models/notification.py`)

### AI Insights Caching
**Performance optimization for cycle predictions:**
- **Caching Layer**: `InsightCache` model stores computed insights to avoid re-calculation
- **Algorithms**: Weighted moving average + exponential smoothing for cycle predictions
- **Confidence Levels**: System returns high/medium/low confidence based on data quality

## Common Pitfalls

❌ **DON'T**: Use `db.create_all()` or `db.drop_all()` → Use `flask db upgrade`  
❌ **DON'T**: Store tokens as 'token' → Use 'access_token' (localStorage key inconsistency was a bug)  
❌ **DON'T**: Use parent's user_id for child data → Always use `adolescent.user_id`  
❌ **DON'T**: Skip parent-child relationship validation → Security vulnerability  
❌ **DON'T**: Run backend on port 5000 → Use port 5001 (configured in run.py)  

✅ **DO**: Check migration status after model changes  
✅ **DO**: Test authorization with curl before UI work  
✅ **DO**: Use role-specific contexts (ParentContext, not generic UserContext)  
✅ **DO**: Clear localStorage on logout (access_token, refresh_token, accessed_child_id)  
✅ **DO**: Handle 401 responses by refreshing token or redirecting to login
