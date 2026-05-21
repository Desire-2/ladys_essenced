# Lady's Essence Backend - Comprehensive Analysis Report

**Generated:** May 20, 2026  
**Project:** Lady's Essence - Women's Health Application  
**Environment:** Development (Port 5001)

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Core Framework & Configuration](#core-framework--configuration)
4. [Database Layer](#database-layer)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Data Models](#data-models)
8. [Services & Utilities](#services--utilities)
9. [Request/Response Patterns](#requestresponse-patterns)
10. [Deployment & Infrastructure](#deployment--infrastructure)
11. [Development Workflow](#development-workflow)

---

## System Architecture

### High-Level Overview
```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 15)                 │
│                    Port 3000                            │
│         (React 19 + TypeScript + Bootstrap 5)           │
└────────────┬────────────────────────────────────────────┘
             │
             │ HTTP/HTTPS (CORS-enabled)
             │
┌────────────┴────────────────────────────────────────────┐
│         Backend (Flask 3.1.0 + SQLAlchemy 2.0)          │
│              Port 5001 (Development)                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Flask App Factory (app/__init__.py)            │  │
│  │  - CORS Configuration                           │  │
│  │  - Blueprint Registration                       │  │
│  │  - JWT Configuration                            │  │
│  │  - Database Connection Pool                     │  │
│  └─────────────────────────────────────────────────┘  │
│                      │                                  │
│    ┌─────────────────┼─────────────────┐               │
│    ▼                 ▼                 ▼               │
│  Routes          Models            Services           │
│  (20+ files)     (20+ models)      & Utils            │
│    │                 │                 │               │
│    └─────────────────┼─────────────────┘               │
│                      ▼                                  │
│        ┌─────────────────────────┐                    │
│        │  SQLAlchemy ORM Layer   │                    │
│        │  (Flask-SQLAlchemy)     │                    │
│        └────────────┬────────────┘                    │
└─────────────────────┼──────────────────────────────────┘
                      │
                      │ SQL Queries
                      ▼
            ┌──────────────────┐
            │    PostgreSQL    │
            │   (Production)   │
            │                  │
            │   OR             │
            │                  │
            │    SQLite        │
            │  (Development)   │
            └──────────────────┘
```

### Design Principles
- **Modular Blueprint Architecture:** Each feature domain has its own blueprint/route file
- **Multi-Role Access Control:** 5 user types with role-based endpoint access
- **Parent-Child Authorization:** Strict validation of parent-child relationships for family data access
- **JWT-Based Stateless Auth:** Access tokens (1 hour) + Refresh tokens (30 days)
- **Database Migration Safety:** Flask-Migrate (Alembic) ensures data preservation across schema changes
- **Real-Time Capabilities:** WebSocket support via Flask-SocketIO for notifications (defined but underutilized)

---

## Technology Stack

### Backend Core
| Component | Version | Purpose |
|-----------|---------|---------|
| Flask | 3.1.0 | Web framework |
| SQLAlchemy | 2.0 | ORM for database abstraction |
| Flask-SQLAlchemy | Latest | SQLAlchemy bindings for Flask |
| Flask-Migrate | Latest | Database migration management (Alembic wrapper) |
| Flask-JWT-Extended | Latest | JWT token generation & validation |
| Flask-Bcrypt | Latest | Password hashing |
| Flask-CORS | Latest | Cross-Origin Resource Sharing |
| Flask-SocketIO | Latest | WebSocket support (defined but minimal usage) |

### Database
- **Production:** PostgreSQL (Aiven Cloud - Remote)
- **Development:** SQLite (file-based, `instance/ladys_essence.db`)
- **Connection Pool:** 10 persistent + 20 overflow connections, 1-hour recycle, 30-second timeout

### Environment
- **Python:** 3.8+ (inferred from Flask/SQLAlchemy versions)
- **Package Management:** pip/requirements.txt
- **Environment Config:** `.env` file (loads via `python-dotenv`)

---

## Core Framework & Configuration

### Flask App Factory Pattern
**File:** `backend/app/__init__.py` (~520 lines)

**Initialization Sequence:**
```python
1. Load .env variables (dotenv_path = os.path.join(dirname(basedir), '.env'))
2. Configure logging (level from LOG_LEVEL env var)
3. Initialize extensions:
   - SQLAlchemy (db)
   - Flask-Migrate (migrate)
   - JWTManager (jwt)
   - Bcrypt (bcrypt)
4. Create Flask app instance
5. Configure database:
   - SQLALCHEMY_DATABASE_URI (PostgreSQL or SQLite fallback)
   - Connection pooling options
6. Configure JWT:
   - JWT_SECRET_KEY (from .env)
   - Access token expiry: 1 hour
   - Refresh token expiry: 30 days
7. Enable CORS with allowed origins list
8. Register blueprints with URL prefixes
9. Create app context & initialize database
10. Define health check & test routes
```

### Environment Variables
```env
DATABASE_URL              # PostgreSQL connection string or SQLite path
JWT_SECRET_KEY           # Secret key for JWT signing
GOOGLE_API_KEY           # Google Maps/Calendar integration
ALLOWED_ORIGINS          # CORS whitelist (comma-separated)
LOG_LEVEL               # Logging verbosity (default: INFO)
FLASK_ENV               # development/production
FLASK_DEBUG             # true/false for debug mode
```

### Blueprint Registration
All blueprints registered in `create_app()`:

```python
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(cycle_logs_bp, url_prefix='/api/cycle-logs')
app.register_blueprint(period_logs_bp, url_prefix='/api/period-logs')
app.register_blueprint(meal_logs_bp, url_prefix='/api/meal-logs')
app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(content_bp, url_prefix='/api/content')
app.register_blueprint(parents_bp, url_prefix='/api/parents')
app.register_blueprint(ussd_bp, url_prefix='/api/ussd')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(content_writer_bp, url_prefix='/api/content-writer')
app.register_blueprint(health_provider_bp, url_prefix='/api/health-provider')
app.register_blueprint(parent_appointments_bp, url_prefix='/api')
app.register_blueprint(settings_bp, url_prefix='/api/settings')
app.register_blueprint(insights_bp, url_prefix='/api/insights')  # Conditional
```

### CORS Configuration
- **Origins:** Localhost (3000-3005), 127.0.0.1 variants, Vercel domains, production domains
- **Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Headers:** Content-Type, Authorization, Accept, Origin, X-Requested-With
- **Credentials:** Enabled for cookie/auth header support
- **Max Age:** 86400 seconds (24 hours)

---

## Database Layer

### SQLAlchemy Configuration
```python
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,              # Persistent connections
    'pool_recycle': 3600,         # Recycle after 1 hour
    'pool_pre_ping': True,        # Health check before use
    'max_overflow': 20,           # Extra connections if needed
    'pool_timeout': 30,           # Wait up to 30 seconds
    'echo': False,                # Set True for SQL query logging
}
```

### Migration System
**Status:** Migrated from `db.create_all()` → Flask-Migrate (Nov 2025)
- **Tool:** Alembic (via Flask-Migrate)
- **Safety:** Preserves data across schema changes
- **Workflow:**
  ```bash
  cd backend
  flask db migrate -m "Description of changes"  # Auto-generate migration
  flask db upgrade                               # Apply pending migrations
  flask db current                               # Check current schema version
  flask db history                               # View migration history
  ```

### Database Schema
**Primary Tables (20+):**
- `User` (base table with role field)
- `Parent`, `Adolescent`, `Admin`, `HealthProvider`, `ContentWriter` (role-specific, 1:1 with User)
- `ParentChild` (junction table: parent_id → adolescent_id)
- `CycleLog` (period tracking)
- `MealLog` (nutrition tracking)
- `PeriodLog` (alternative period tracking)
- `Appointment` (appointment bookings)
- `Notification` (in-app notifications)
- `NotificationTemplate`, `NotificationSubscription` (notification system)
- `InsightCache` (AI prediction caching)
- `ContentCategory`, `ContentItem`, `Feedback` (educational content)
- `SystemLog`, `Analytics`, `UserSession` (monitoring)

**Key Relationships:**
```
User (1) ──── (1) Parent/Adolescent/Admin/HealthProvider/ContentWriter
Parent (1) ──── (M) ParentChild (M) ──── (1) Adolescent
User (1) ──── (M) CycleLog
User (1) ──── (M) Appointment
User (1) ──── (M) Notification
HealthProvider (1) ──── (M) Appointment
```

---

## Authentication & Authorization

### JWT Flow
**1. Registration → Token Issuance**
```
POST /api/auth/register
├─ Input: phone_number, password, user_type, etc.
├─ Bcrypt hash password
├─ Create User + role-specific record (Parent/Adolescent/etc.)
└─ Return: access_token, refresh_token, user_info
```

**2. Login → Token Issuance**
```
POST /api/auth/login
├─ Input: phone_number, password (or PIN if enabled)
├─ Verify credentials (Bcrypt check)
├─ Generate JWT (sub: user.id, identity: user_id)
├─ Optionally validate PIN (4-digit Bcrypt hashed alternative)
└─ Return: access_token, refresh_token
```

**3. Token Refresh**
```
POST /api/auth/refresh
├─ Input: refresh_token (from localStorage or body)
├─ Validate refresh token (must be valid, not expired)
└─ Return: new access_token
```

### JWT Configuration
- **Secret:** `JWT_SECRET_KEY` from `.env`
- **Access Token:** 1-hour expiry
- **Refresh Token:** 30-day expiry
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Payload Structure:**
  ```json
  {
    "sub": "user_id",           // User's numeric ID
    "type": "access/refresh",   // Token type
    "iat": 1234567890,          // Issued at
    "exp": 1234571490           // Expiration
  }
  ```

### Role-Based Access Control (RBAC)
**5 User Types:**
| Type | Dashboard | Permissions |
|------|-----------|-------------|
| **parent** | `/dashboard/parent` | Manage children, view child data, book appointments |
| **adolescent** | `/dashboard` | View own data, track cycle/meals, book appointments |
| **health_provider** | `/health-provider` | View patients, manage appointments, update availability |
| **admin** | `/admin` | User management, provider verification, content moderation |
| **content_writer** | `/content-writer` | Create/edit educational content, submit for approval |

**Authorization Middleware:**
```python
# app/auth/middleware.py
@jwt_required()
def token_required():
    return get_jwt_identity()  # Returns user_id (string)

@role_required('parent')
def role_check():
    user = User.query.get(get_jwt_identity())
    if user.user_type != 'parent':
        return 403 Forbidden
```

### Parent-Child Authorization (Critical)
**Pattern used in all parent endpoints:**
```python
@jwt_required()
def get_child_data(adolescent_id):
    user = User.query.get(get_jwt_identity())
    
    # 1. Verify user is parent
    if user.user_type != 'parent':
        return 403
    
    # 2. Get parent record
    parent = Parent.query.filter_by(user_id=user.id).first()
    
    # 3. CRITICAL: Verify parent-child relationship
    relation = ParentChild.query.filter_by(
        parent_id=parent.id, 
        adolescent_id=adolescent_id
    ).first()
    if not relation:
        return 404  # Child not found for this parent
    
    # 4. Check child's privacy setting
    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)
    if not child_user.allow_parent_access:
        return 403  # Child disabled parent access
    
    # 5. Use child's user_id for data queries
    child_user_id = adolescent.user_id
    # ... proceed with data retrieval using child_user_id
```

---

## API Endpoints Reference

### Base Endpoints
```
GET  /              Home page
GET  /health        Health check (monitoring)
GET  /api/test-cors CORS test utility
```

### Authentication Module (`/api/auth`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/register` | ❌ | Register new user (parent/adolescent/provider) |
| POST | `/login` | ❌ | Authenticate & get tokens |
| POST | `/refresh` | ❌ | Get new access token |
| GET | `/profile` | ✅ | Get current user profile |
| PUT | `/profile` | ✅ | Update user profile |
| POST | `/logout` | ✅ | Invalidate token (client-side) |
| GET | `/test-jwt` | ✅ | Debug JWT validation |

**Request/Response Examples:**
```bash
# Register
POST /api/auth/register
{
  "phone_number": "1234567890",
  "password": "secure_password",
  "user_type": "parent",
  "first_name": "Jane",
  "last_name": "Doe"
}
→ { "access_token": "...", "refresh_token": "...", "user": {...} }

# Login
POST /api/auth/login
{ "phone_number": "1234567890", "password": "secure_password" }
→ { "access_token": "...", "refresh_token": "...", "user_type": "parent" }

# Refresh
POST /api/auth/refresh
{ "refresh_token": "..." }
→ { "access_token": "..." }
```

### Cycle Logs Module (`/api/cycle-logs`)
**Core CRUD + Analytics:**
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | ✅ | List user's cycle logs |
| GET | `/<log_id>` | ✅ | Get specific cycle log |
| POST | `/` | ✅ | Create new cycle log |
| PUT | `/<log_id>` | ✅ | Update cycle log |
| DELETE | `/<log_id>` | ✅ | Delete cycle log |
| GET | `/stats` | ✅ | Cycle statistics (avg length, regularity) |
| GET | `/calendar` | ✅ | Calendar view of cycle history |

**Analytics & Insights:**
| GET | `/insights` | ✅ | AI-generated insights from cycle data |
| GET | `/predictions` | ✅ | Next period predictions |
| GET | `/ml-insights` | ✅ | Machine learning analysis |
| GET | `/pattern-analysis` | ✅ | Cycle pattern detection |
| GET | `/adaptive-status` | ✅ | Current cycle phase status |
| GET | `/anomaly-detection` | ✅ | Detect irregular patterns |
| GET | `/confidence-metrics` | ✅ | Prediction confidence scores |
| GET | `/fertile-window` | ✅ | Fertility window calculation |
| GET | `/health-summary` | ✅ | Overall reproductive health summary |

**Testing:**
| GET | `/test/calendar` | ✅ | Debug calendar view |

### Period Logs Module (`/api/period-logs`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/` | ✅ | Record period start |
| GET | `/` | ✅ | List period logs |
| GET | `/<log_id>` | ✅ | Get specific period log |
| PUT | `/<log_id>` | ✅ | Update period log |
| DELETE | `/<log_id>` | ✅ | Delete period log |
| GET | `/analytics` | ✅ | Period analytics & patterns |
| GET | `/insights` | ✅ | Health insights from periods |
| GET | `/current` | ✅ | Get current/ongoing period |
| POST | `/end-current` | ✅ | End current period |
| GET | `/parent/<child_id>` | ✅ | [Parent] View child's periods |
| GET | `/parent/<child_id>/analytics` | ✅ | [Parent] Child's period analytics |

### Meal Logs Module (`/api/meal-logs`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | ✅ | List meal logs |
| GET | `/<log_id>` | ✅ | Get specific meal log |
| POST | `/` | ✅ | Create meal log |
| PUT | `/<log_id>` | ✅ | Update meal log |
| DELETE | `/<log_id>` | ✅ | Delete meal log |
| GET | `/stats` | ✅ | Nutrition statistics |

### Appointments Module (`/api/appointments`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | ✅ | List user's appointments |
| GET | `/<appointment_id>` | ✅ | Get specific appointment |
| POST | `/` | ✅ | Book new appointment |
| PUT | `/<appointment_id>` | ✅ | Update appointment |
| DELETE | `/<appointment_id>` | ✅ | Cancel appointment |
| GET | `/upcoming` | ✅ | Get upcoming appointments |
| POST | `/send-reminders` | ✅ | Send appointment reminders (admin) |
| GET | `/statistics` | ✅ | Appointment statistics |

### Appointments Enhanced Module (Not Registered)
**Status:** Defined in `backend/app/routes/appointments_enhanced.py` but **NOT** registered in main blueprint registry.

**Endpoints (for reference):**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/search-providers` | Search health providers |
| GET | `/providers/<provider_id>/detailed-info` | Provider details |
| POST | `/book-appointment` | Enhanced booking workflow |
| PUT | `/appointments/<appointment_id>/confirm` | Confirm appointment |
| PUT | `/appointments/<appointment_id>/cancel` | Cancel with reason |
| PUT | `/appointments/<appointment_id>/reschedule` | Reschedule appointment |
| POST | `/waiting-list` | Join waiting list |
| POST | `/appointments/<appointment_id>/review` | Post appointment review |

### Notifications Module (`/api/notifications`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | ✅ | List user's notifications |
| GET | `/recent` | ✅ | Get recent notifications (limit: 10) |
| GET | `/unread-count` | ✅ | Count unread notifications |
| PUT | `/<notification_id>/read` | ✅ | Mark notification as read |
| PUT | `/read-all` | ✅ | Mark all notifications as read |
| DELETE | `/<notification_id>` | ✅ | Delete notification |

**Features:**
- Notification templates with variable substitution
- Multi-channel support (in-app, email, SMS)
- Subscription-based filtering
- Real-time WebSocket delivery (via `notifications_realtime.py`)

### Content Module (`/api/content`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/categories` | ❌ | List content categories |
| GET | `/categories/<category_id>` | ❌ | Get category details |
| GET | `/items` | ❌ | List content items |
| GET | `/items/<item_id>` | ❌ | Get content item |
| GET | `/featured` | ❌ | Get featured content |
| GET | `/search?q=term` | ❌ | Search content |
| POST | `/categories` | ✅ | [Writer] Create category |
| POST | `/items` | ✅ | [Writer] Create content item |

### Parents Module (`/api/parents`) - Critical Feature
**Manage Children:**
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/children` | ✅ | List all children |
| GET | `/children/<adolescent_id>` | ✅ | Get child profile |
| POST | `/children` | ✅ | Add child to account |
| POST | `/children/add` | ✅ | Alternative add child endpoint |
| PUT | `/children/<adolescent_id>` | ✅ | Update child profile |
| DELETE | `/children/<adolescent_id>` | ✅ | Remove child from account |

**View Child Data (Parent-authorized):**
| GET | `/children/<adolescent_id>/cycle-logs` | ✅ | View child's cycles |
| POST | `/children/<adolescent_id>/cycle-logs` | ✅ | Add cycle log for child |
| GET | `/children/<adolescent_id>/meal-logs` | ✅ | View child's meals |
| GET | `/children/<adolescent_id>/appointments` | ✅ | View child's appointments |

**Security:** All endpoints validate parent-child relationship (see [Parent-Child Authorization](#parent-child-authorization-critical))

### Parent Appointments Module (`/api` prefix) - Separate Feature
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/parent/children` | ✅ | [Parent] List children |
| GET | `/parent/children/<child_id>/details` | ✅ | [Parent] Get child details |
| POST | `/parent/book-appointment-for-child` | ✅ | [Parent] Book appointment for child |
| GET | `/parent/children/<child_id>/appointments` | ✅ | [Parent] View child's appointments |
| POST | `/parent/appointments/<appointment_id>/cancel` | ✅ | [Parent] Cancel child's appointment |
| POST | `/parent/appointments/<appointment_id>/reschedule` | ✅ | [Parent] Reschedule child's appointment |
| GET | `/parent/appointments/<appointment_id>` | ✅ | [Parent] Get appointment details |

**Note:** Overlaps with `/api/parents` module; likely used as enhanced variant for appointment booking specifically.

### USSD Module (`/api/ussd`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/` | Handle USSD session (mobile menu-based interaction) |

**Purpose:** Support for USSD (Unstructured Supplementary Service Data) for SMS-based menu navigation on basic phones in underserved areas.

### Admin Module (`/api/admin`) - 30+ Endpoints
**User Management:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard/stats` | Admin dashboard statistics |
| GET | `/users` | List all users (paginated) |
| GET | `/users/<user_id>` | Get user details |
| POST | `/users/create` | Create user (admin) |
| PATCH | `/users/<user_id>/toggle-status` | Activate/deactivate user |
| PATCH | `/users/<user_id>/reset-password` | Force password reset |
| DELETE | `/users/<user_id>` | Delete user account |
| GET | `/users/statistics` | User growth & stats |
| POST | `/users/bulk-action` | Batch operations on users |
| PATCH | `/users/<user_id>/change-role` | Change user role |
| POST | `/users/bulk-change-role` | Batch role changes |

**Health Provider Management:**
| GET | `/health-providers` | List providers |
| GET | `/health-providers/<provider_id>` | Get provider details |
| POST | `/health-providers` | Register new provider |
| PUT | `/health-providers/<provider_id>` | Update provider |
| DELETE | `/health-providers/<provider_id>` | Remove provider |
| POST | `/health-providers/<provider_id>/verify` | Verify provider credentials |
| GET | `/health-providers/<provider_id>/appointments` | Provider's appointments |
| GET | `/health-providers/statistics` | Provider statistics |

**Content Management:**
| GET | `/content/pending` | List pending content submissions |
| PATCH | `/content/<content_id>/approve` | Approve content |
| PATCH | `/content/<content_id>/reject` | Reject content |
| GET | `/courses/stats` | Course statistics |
| GET | `/courses` | List courses |
| PATCH | `/courses/<course_id>/status` | Update course status |
| PUT | `/courses/<course_id>/status` | Alternative status update |
| DELETE | `/courses/<course_id>` | Delete course |

**System:**
| GET | `/content-writers` | List content writers |
| GET | `/appointments/manage` | Manage all appointments |
| GET | `/system/logs` | System activity logs |
| POST | `/analytics/generate` | Generate analytics report |

### Content Writer Module (`/api/content-writer`) - 18 Endpoints
**Dashboard & Stats:**
| GET | `/dashboard/stats` | Writer dashboard statistics |

**Content Management:**
| GET | `/content` | List writer's content |
| POST | `/content` | Create new content |
| PUT | `/content/<content_id>` | Edit content |
| DELETE | `/content/<content_id>` | Delete content |
| PATCH | `/content/<content_id>/submit` | Submit content for approval |

**Course Management:**
| GET | `/courses` | List writer's courses |
| POST | `/courses` | Create course |
| GET | `/courses/<course_id>` | Get course details |
| PUT | `/courses/<course_id>` | Update course |
| DELETE | `/courses/<course_id>` | Delete course |
| PATCH | `/courses/<course_id>/submit` | Submit course for approval |

**Metadata:**
| GET | `/categories` | Get available categories |
| GET | `/profile` | Get writer profile |
| PUT | `/profile` | Update profile |
| GET | `/suggestions` | Get content suggestions |
| GET | `/analytics` | Writer analytics |
| POST | `/modules` | Create educational module |

### Health Provider Module (`/api/health-provider`) - 40+ Endpoints
**Dashboard & Overview:**
| GET | `/dashboard/stats` | Provider dashboard statistics |
| GET | `/providers` | List all providers |
| GET | `/provider-availability` | Get provider availability calendar |
| GET | `/profile` | Get provider profile |
| PUT | `/profile` | Update provider profile |

**Appointment Management:**
| GET | `/appointments` | List provider's appointments |
| GET | `/appointments/unassigned` | Get unassigned appointments |
| PATCH | `/appointments/<appointment_id>/claim` | Claim appointment |
| PATCH | `/appointments/<appointment_id>/update` | Update appointment status |
| GET | `/appointments/next-available-slot` | Find next available slot |
| GET | `/appointments/provider-availability-summary` | Availability summary |
| GET | `/appointments/provider-time-slots` | Available time slots |

**Patient Management:**
| GET | `/patients` | List provider's patients |
| GET | `/schedule` | Provider schedule |

**Notifications:**
| GET | `/notifications` | List provider's notifications |
| PATCH | `/notifications/<notification_id>/read` | Mark read |
| PATCH | `/notifications/read-all` | Mark all read |
| PUT | `/notifications/read-all` | Alternative mark all read |
| DELETE | `/notifications/<notification_id>` | Delete notification |

**Availability Management:**
| GET | `/availability` | Get availability settings |
| PUT | `/availability` | Update availability |
| POST | `/availability/slots` | Add available time slots |
| DELETE | `/availability/slots/<date>` | Remove time slots |
| POST | `/availability/block` | Block time periods |

**Analytics:**
| GET | `/analytics` | Provider performance analytics |

**Test Endpoints:** (~20 endpoints prefixed with `/test/` for debugging)

### Settings Module (`/api/settings`) - Privacy & Account
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/privacy` | ✅ | Get privacy settings |
| PUT | `/privacy/parent-access` | ✅ | Allow/disable parent access |
| GET | `/account` | ✅ | Get account settings |
| PUT | `/account` | ✅ | Update account settings |
| PUT | `/privacy` | ✅ | Update all privacy settings |

### Insights Module (`/api/insights`) - Conditional Registration
**Status:** Only registered if import succeeds (see error handling in `__init__.py`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/generate` | ✅ | Generate AI insights |
| GET | `/health` | ✅ | Get insight health status |
| GET | `/languages` | ✅ | Get available languages |

### Analytics Enhanced Module (Not Registered)
**Status:** Defined but not registered.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard` | Analytics dashboard |
| GET | `/cycle-insights` | Cycle analytics |
| GET | `/providers` | Provider analytics |

---

## Data Models

### Core User Models
```python
# Base table
User
├── id (PK)
├── phone_number (UNIQUE)
├── password_hash (Bcrypt)
├── pin_hash (Optional, for PIN auth)
├── user_type (parent|adolescent|admin|health_provider|content_writer)
├── first_name, last_name
├── email, date_of_birth
├── allow_parent_access (Boolean) # NEW: Privacy control
├── is_active (Boolean)
├── created_at, updated_at

# Role-specific (1:1 relationships)
Parent
├── id (PK)
├── user_id (FK → User)
├── occupation, emergency_contact
├── created_at

Adolescent
├── id (PK)
├── user_id (FK → User)
├── age, school_name, grade
├── created_at

Admin
├── id (PK)
├── user_id (FK → User)
├── permissions (JSON or text)

HealthProvider
├── id (PK)
├── user_id (FK → User)
├── license_number
├── specialization
├── clinic_name, clinic_address, clinic_phone
├── qualification
├── is_verified (Boolean)
├── created_at

ContentWriter
├── id (PK)
├── user_id (FK → User)
├── bio, specialization
├── created_at

# Relationship junction table
ParentChild
├── parent_id (FK → Parent)
├── adolescent_id (FK → Adolescent)
├── relationship_type (mother|father|guardian)
├── created_at
```

### Data Tracking Models
```python
CycleLog
├── id (PK)
├── user_id (FK → User) # IMPORTANT: child's user_id, NOT Adolescent.id
├── start_date, end_date (optional)
├── flow_level (light|medium|heavy)
├── symptoms (JSON array)
├── notes
├── confidence_score
├── created_at, updated_at

PeriodLog
├── id (PK)
├── user_id (FK → User)
├── start_date, end_date (optional)
├── flow_intensity
├── symptoms
├── created_at

MealLog
├── id (PK)
├── user_id (FK → User)
├── meal_type (breakfast|lunch|dinner|snack)
├── food_items (JSON)
├── nutrients (protein, carbs, fats, calories)
├── mood_after
├── created_at, updated_at

Appointment
├── id (PK)
├── user_id (FK → User)
├── health_provider_id (FK → HealthProvider, optional)
├── appointment_type (checkup|consultation|vaccination)
├── scheduled_datetime
├── status (pending|confirmed|completed|cancelled)
├── notes
├── created_at, updated_at
```

### Notification Models
```python
Notification
├── id (PK)
├── user_id (FK → User)
├── template_id (FK → NotificationTemplate, optional)
├── title, message
├── notification_type (appointment|cycle|health|system)
├── channel (in_app|email|sms)
├── is_read (Boolean)
├── read_at (DateTime, optional)
├── data (JSON) # Template variables
├── created_at

NotificationTemplate
├── id (PK)
├── name
├── title_template, message_template
├── variables (JSON) # Available placeholders
├── created_at

NotificationSubscription
├── id (PK)
├── user_id (FK → User)
├── notification_type
├── is_enabled (Boolean)
├── channels (JSON) # [in_app, email, sms]
├── created_at
```

### Content Models
```python
ContentCategory
├── id (PK)
├── name (UNIQUE)
├── description
├── icon_url
├── created_at

ContentItem
├── id (PK)
├── category_id (FK → ContentCategory)
├── writer_id (FK → ContentWriter, optional)
├── title, description
├── content (text/markdown)
├── media_url (image/video)
├── language (en|rw|sw|etc.)
├── is_featured (Boolean)
├── status (draft|pending|approved|rejected)
├── created_at, updated_at
```

### Performance Models
```python
InsightCache
├── id (PK)
├── user_id (FK → User)
├── insight_type (cycle_prediction|fertility|health_summary)
├── data (JSON) # Cached computation result
├── confidence_level (high|medium|low)
├── expires_at (DateTime)
├── created_at

Analytics
├── id (PK)
├── metric_name
├── metric_value
├── dimension (user_type|date|region)
├── created_at

SystemLog
├── id (PK)
├── user_id (FK → User, optional)
├── action (login|data_update|error)
├── details (JSON)
├── created_at
```

---

## Services & Utilities

### Notification Manager (`app/services/notification_manager.py`)
Centralizes notification creation, template rendering, and channel delivery.

**Key Methods:**
- `create_notification(user_id, template_name, data, channels)`
- `create_from_template(template_name, user_id, data)`
- `send_via_email(user, notification)`
- `send_via_sms(user, notification)`
- `mark_as_read(notification_id)`

### Kinyarwanda Insight Service (`app/services/kinyarwanda_insight_service.py`)
Generates multi-language health insights with Kinyarwanda translation support.

### Authentication Middleware (`app/auth/middleware.py`)
- `@jwt_required()` - Validates JWT token presence & expiry
- `@role_required('role_name')` - Restricts endpoint to specific role

### Performance Monitoring (`app/utils/performance.py`)
Tracks API response times and resource usage (if initialized in `__init__.py`).

---

## Request/Response Patterns

### Standard Success Response
```json
{
  "data": { /* resource object */ },
  "message": "Operation successful",
  "timestamp": "2025-05-20T10:30:00Z"
}
```

### Standard Error Response
```json
{
  "message": "Error description",
  "error_code": "RESOURCE_NOT_FOUND",
  "timestamp": "2025-05-20T10:30:00Z"
}
```

### Pagination Pattern (List Endpoints)
```
GET /api/users?page=1&limit=10&sort=-created_at

Response:
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "pages": 25
  }
}
```

### Authentication Headers
```http
Authorization: Bearer <access_token>

# Refresh token typically in body:
POST /api/auth/refresh
{
  "refresh_token": "..."
}
```

### CORS Preflight Handling
```http
OPTIONS /api/cycle-logs

Response Headers:
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

---

## Deployment & Infrastructure

### Local Development Setup
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
flask db upgrade           # Apply migrations
python run.py             # Runs on port 5001

# Frontend
cd ladys-essence-frontend
npm install
npm run dev               # Runs on port 3000
```

### Docker Compose
**File:** `docker-compose.yml`
```yaml
services:
  backend:
    build: ./backend
    ports: ["5000:5000"]
    env_file: .env
    volumes: ["./backend:/app"]
    depends_on: [postgres]

  frontend:
    build: ./ladys-essence-frontend
    ports: ["3000:3000"]
    env: [NEXT_PUBLIC_API_URL=http://backend:5000]

  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    env: [POSTGRES_DB=ladys_essence, POSTGRES_PASSWORD=...]
    volumes: [postgres_data:/var/lib/postgresql/data]

volumes:
  postgres_data:
```

### Environment Configuration
**Development:** `backend/.env` (SQLite fallback)
```
DATABASE_URL=sqlite:///instance/ladys_essence.db
JWT_SECRET_KEY=dev-secret
FLASK_DEBUG=true
```

**Production:** `backend/.env` (PostgreSQL remote)
```
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET_KEY=<strong-secret>
FLASK_DEBUG=false
ALLOWED_ORIGINS=https://ladys-essenced.vercel.app,...
```

### Deployment Targets
1. **Frontend:** Vercel (Next.js optimized)
2. **Backend:** Heroku, Railway, or custom VPS
3. **Database:** Aiven Cloud PostgreSQL (production)
4. **Email/SMS:** Twilio, SendGrid, or similar

---

## Development Workflow

### Adding a New Endpoint
**1. Create/Update Model** (`app/models/__init__.py`)
```python
class NewModel(db.Model):
    __tablename__ = 'new_models'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    # ... fields ...
```

**2. Create Migration**
```bash
flask db migrate -m "Add NewModel table"
flask db upgrade
```

**3. Create Route** (`app/routes/new_module.py`)
```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import NewModel

new_bp = Blueprint('new_module', __name__)

@new_bp.route('/', methods=['GET'])
@jwt_required()
def list_items():
    user_id = get_jwt_identity()
    items = NewModel.query.filter_by(user_id=user_id).all()
    return jsonify([item.to_dict() for item in items])

@new_bp.route('/', methods=['POST'])
@jwt_required()
def create_item():
    user_id = get_jwt_identity()
    data = request.get_json()
    item = NewModel(user_id=user_id, **data)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201
```

**4. Register Blueprint** (`app/__init__.py`)
```python
from app.routes.new_module import new_bp
app.register_blueprint(new_bp, url_prefix='/api/new-module')
```

**5. Test**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/new-module/
```

### Testing Endpoints
**Using curl:**
```bash
# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"1234567890","password":"test","user_type":"parent"}'

# Login & capture token
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"1234567890","password":"test"}' \
  | jq -r '.access_token')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/cycle-logs/
```

### Debugging
**Enable SQL Query Logging:**
```python
# In app/__init__.py, set echo=True
app.config['SQLALCHEMY_ENGINE_OPTIONS']['echo'] = True
```

**Check Logs:**
```bash
# Flask server logs in terminal where python run.py was executed
tail -f /tmp/flask_before_request.log    # CORS requests
tail -f /tmp/blueprint_registration.log  # Blueprint loading
```

**Database Inspection:**
```bash
# Connect to SQLite
sqlite3 instance/ladys_essence.db

# Or PostgreSQL
psql -U avnadmin -h pg-37c00c3-... defaultdb
```

---

## Key Features Summary

### 1. Multi-Role Access Control
✅ 5 distinct user types with role-based dashboards  
✅ JWT token-based stateless authentication  
✅ Flexible permission model for future role expansion  

### 2. Parent-Child Authorization
✅ Parents manage multiple children  
✅ Strict validation of parent-child relationships  
✅ Privacy control: children can disable parent access  
✅ Parent data visibility based on child user_id (not Adolescent.id)  

### 3. Data Tracking
✅ Cycle tracking with AI predictions & confidence metrics  
✅ Period logging with health analytics  
✅ Meal logging with nutrition tracking  
✅ Appointment booking & management  

### 4. Notifications
✅ Template-based notification system  
✅ Multi-channel delivery (in-app, email, SMS)  
✅ Subscription preferences per user  
✅ Real-time WebSocket support  

### 5. Content Management
✅ Structured content categories & items  
✅ Content writer workflow with approval  
✅ Multi-language support (English, Kinyarwanda, Swahili)  
✅ Featured content & search  

### 6. Health Provider Integration
✅ Provider registry & verification  
✅ Availability scheduling  
✅ Appointment assignment workflow  
✅ Provider-specific analytics & patient tracking  

### 7. Admin Dashboard
✅ User management (create, suspend, role change)  
✅ Health provider verification  
✅ Content moderation  
✅ System monitoring & analytics  

### 8. USSD Support
✅ Menu-based SMS interaction for basic phones  
✅ Supports underserved/rural areas  

---

## Performance Considerations

### Database Optimization
- Connection pooling (10 persistent + 20 overflow)
- Connection recycling every 1 hour
- Pre-ping health checks before use
- 30-second connection timeout

### Caching
- **InsightCache model** stores AI predictions (exponential backoff)
- Prevents re-calculation of cycle insights
- TTL-based expiration via `expires_at` field

### API Response Optimization
- Pagination on list endpoints
- Selective field loading (avoid loading unnecessary relationships)
- Index on frequently queried columns (`user_id`, `created_at`)

### WebSocket (Underutilized)
- Real-time notification delivery via Socket.IO
- Health provider status updates
- Defined but minimal frontend integration

---

## Known Issues & Future Improvements

### Current Limitations
1. **analytics_enhanced.py** - Not registered (partial implementation)
2. **appointments_enhanced.py** - Not registered (overlaps with main appointments)
3. **admin_complete.py** - Empty file (legacy?)
4. **notifications_realtime.py** - WebSocket defined but minimal usage
5. **Test endpoints** - Many `/test/*` routes in health_provider module (should be removed in production)

### Recommended Improvements
1. **Consolidate appointment endpoints** - Merge enhanced + regular variants
2. **Clean up test routes** - Remove or move to separate debug blueprint
3. **Implement rate limiting** - Prevent abuse on auth endpoints
4. **Add request validation** - Use Marshmallow or Pydantic
5. **Enhance WebSocket integration** - Full real-time notification support
6. **API versioning** - Prepare for `/v2/` endpoints without breaking changes
7. **Comprehensive test suite** - Unit tests for all models & routes
8. **API documentation** - Generate Swagger/OpenAPI spec

---

## Quick Reference Commands

### Database Operations
```bash
# Check current migration
flask db current

# View migration history
flask db history

# Create new migration after model change
flask db migrate -m "Description"

# Apply pending migrations
flask db upgrade

# Downgrade to previous migration
flask db downgrade

# Create fresh database (dev only)
rm instance/ladys_essence.db && flask db upgrade
```

### Running the Application
```bash
# Start backend (port 5001)
cd backend && python run.py

# Start frontend (port 3000)
cd ladys-essence-frontend && npm run dev

# Run with Docker
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### Testing
```bash
# Health check
curl http://localhost:5001/health

# Test CORS
curl http://localhost:5001/api/test-cors

# Register test user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1111111111",
    "password": "testpass",
    "user_type": "parent",
    "first_name": "Test",
    "last_name": "User"
  }'
```

---

## Conclusion

The Lady's Essence backend is a **comprehensive, multi-featured Flask application** designed for managing women's health in underserved regions. Key strengths include:

- ✅ Robust multi-role access control
- ✅ Production-safe database migration system
- ✅ Advanced health tracking & prediction algorithms
- ✅ Flexible notification system
- ✅ Health provider integration

Main areas for consolidation:
- Appointment endpoint duplication
- Unregistered enhanced modules
- Test endpoint cleanup
- WebSocket underutilization

**Total API Endpoints:** 150+ (with test endpoints)  
**Active HTTP Endpoints:** ~130 (production-ready)  
**Database Models:** 20+ with sophisticated relationships  
**User Roles:** 5 distinct types with RBAC

---

*Report Generated: May 20, 2026*  
*Backend Version: Flask 3.1.0 + SQLAlchemy 2.0*  
*Database: PostgreSQL (Production) / SQLite (Development)*
