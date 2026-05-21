# Lady's Essence Frontend - Comprehensive Analysis & Backend Integration Report

**Generated:** May 20, 2026  
**Project:** Lady's Essence - Women's Health Application (Frontend)  
**Framework:** React 19 + Vite + TypeScript + Zustand  

---

## Table of Contents

1. [Frontend Architecture](#frontend-architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [State Management (Zustand)](#state-management-zustand)
5. [API Integration & Configuration](#api-integration--configuration)
6. [Authentication Flow](#authentication-flow)
7. [Routing System](#routing-system)
8. [Component Architecture](#component-architecture)
9. [Forms & Data Entry](#forms--data-entry)
10. [Features Overview](#features-overview)
11. [Backend Integration Points](#backend-integration-points)
12. [Environment Configuration](#environment-configuration)
13. [Development & Deployment](#development--deployment)
14. [Integration Checklist](#integration-checklist)

---

## Frontend Architecture

### High-Level System Diagram

```
┌──────────────────────────────────────────────────┐
│         Browser (User Interface)                 │
│  ┌────────────────────────────────────────────┐ │
│  │       React 19 SPA (Vite)                  │ │
│  │  - App.tsx (Main Router)                   │ │
│  │  - Hash-based routing (#/dashboard, etc.)  │ │
│  │  - 5 Role-specific dashboards              │ │
│  └────────────────────────────────────────────┘ │
│           ▲                ▲                     │
│           │                │                     │
└───────────┼────────────────┼─────────────────────┘
            │                │
      Axios Client       WebSocket
      (with JWT)         (Future)
            │                │
            ▼                ▼
    ┌────────────────────────────────┐
    │  Express.js Proxy Server       │
    │  (Port 3000)                   │
    │  - Dev: Mock endpoints         │
    │  - Prod: Proxy to Flask (5001) │
    └────────┬────────────────────────┘
             │
    ┌────────▼─────────────────────────┐
    │ Flask Backend                    │
    │ (Port 5001)                      │
    │  ✓ Provides 150+ endpoints       │
    │  ✓ JWT Authentication            │
    │  ✓ Role-Based Access Control    │
    │  ✓ PostgreSQL Database           │
    └──────────────────────────────────┘
```

### Architecture Principles
- **Component-Driven:** Organized by features (cycle, appointments, etc.)
- **State Management:** Zustand for global state (auth, umwari)
- **API-First:** All data flows through Axios interceptor (JWT injection)
- **Role-Based UI:** Conditional rendering based on user_type
- **Hash Routing:** SPA navigation without server redirects
- **Type Safety:** Full TypeScript coverage with generated types
- **Responsive Design:** Tailwind CSS with custom color palette

---

## Technology Stack

### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.0.1 | UI framework |
| Vite | 6.2.3 | Build tool & dev server |
| TypeScript | 5.8.2 | Type safety |
| Zustand | 5.0.13 | State management |
| Axios | 1.16.1 | HTTP client |
| TailwindCSS | 4.1.14 | Styling |
| React Hot Toast | 2.6.0 | Toast notifications |
| Recharts | 3.8.1 | Data visualization |
| Lucide React | 0.546.0 | Icon library |
| Motion | 12.23.24 | Animation library |
| Express | 4.21.2 | Node.js server |

### Dev Dependencies
- **TSC:** TypeScript compiler for type checking
- **ESBuild:** Bundle server code for production
- **Autoprefixer:** CSS vendor prefixes

### AI Integration
| Package | Version | Purpose |
|---------|---------|---------|
| @google/generative-ai | 0.24.1 | Gemini API client |
| @google/genai | 1.29.0 | Alternative Gemini wrapper |

---

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx                    # Main router & page components
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Global styles (Tailwind)
│   │
│   ├── components/
│   │   ├── ui/                    # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   │
│   │   ├── features/              # Domain-specific components
│   │   │   ├── CycleRing.tsx      # Visual cycle tracker
│   │   │   ├── CycleCalendar.tsx  # Calendar heatmap
│   │   │   ├── NutritionDonut.tsx # Nutrition breakdown
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── ChildCard.tsx
│   │   │   └── InsightCard.tsx
│   │   │
│   │   ├── forms/                 # Data entry forms
│   │   │   ├── CycleLogForm.tsx
│   │   │   ├── MealLogForm.tsx
│   │   │   ├── AppointmentForm.tsx
│   │   │   └── ChildForm.tsx
│   │   │
│   │   └── umwari/                # AI Companion components
│   │       ├── UmwariChat.tsx
│   │       ├── UmwariFab.tsx
│   │       ├── UmwariLanguagePicker.tsx
│   │       ├── UmwariFullPage.tsx
│   │       ├── UmwariMessage.tsx
│   │       ├── UmwariTyping.tsx
│   │       ├── UmwariDoctorCard.tsx
│   │       └── UmwariOnboarding.tsx
│   │
│   ├── stores/                    # Zustand state management
│   │   ├── authStore.ts          # Authentication state
│   │   └── umwariStore.ts        # AI companion state
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useUmwari.ts          # AI chat hook
│   │   └── useUmwariContext.ts
│   │
│   ├── lib/                       # Utilities & config
│   │   ├── axios.ts              # API client config & interceptors
│   │   ├── utils.ts              # Helper functions
│   │   ├── gemini.ts             # Gemini API wrapper
│   │   └── constants.ts          # App constants
│   │
│   ├── types/
│   │   ├── types.ts              # Main TypeScript types
│   │   ├── umwari.ts             # AI-specific types
│   │   └── api.ts                # API response types
│   │
│   └── assets/                    # Static files
│
├── server.ts                       # Express dev server & mock API
├── vite.config.ts                  # Vite build config
├── tsconfig.json                   # TypeScript config
├── tailwind.config.js              # TailwindCSS config
├── package.json
├── index.html                      # HTML entry point
└── .env.example                    # Environment template
```

---

## State Management (Zustand)

### Authentication Store (`authStore.ts`)

```typescript
interface AuthState {
  accessToken: string | null;           // JWT access token (1 hour TTL)
  user: User | null;                    // Current user profile
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

// Usage:
const { user, accessToken, setUser, setAccessToken, logout } = useAuthStore();
```

**State Persistence:**
- `accessToken`: Session-only (cleared on logout)
- `user`: Session-only
- `refresh_token`: Stored in localStorage for silent auth resume

**Logout Behavior:**
```javascript
logout() {
  localStorage.removeItem('refresh_token');
  set({ accessToken: null, user: null });
  navigate('/login');
}
```

### Umwari AI Store (`umwariStore.ts`)

```typescript
interface UmwariState {
  // Persistent config
  isConfigured: boolean;
  apiKey: string | null;               // Gemini API key
  language: UmwariLanguageCode;        // 'en' | 'rw' | 'sw' | 'fr'
  
  // Session chat state (NOT persisted)
  messages: UmwariMessage[];
  isStreaming: boolean;
  isLoadingContext: boolean;
  error: string | null;
  isOpen: boolean;

  // Actions
  completeOnboarding: () => void;
  setApiKey: (key: string) => void;
  setLanguage: (lang: UmwariLanguageCode) => void;
  addMessage: (msg: UmwariMessage) => void;
  updateLastMessage: (chunk: string) => void;
  setStreaming: (val: boolean) => void;
  clearChat: () => void;
  toggleOpen: () => void;
  setOpen: (val: boolean) => void;
}

// Persistence: 'umwari-config-v2' (config only, not messages)
```

---

## API Integration & Configuration

### Axios Client Setup (`lib/axios.ts`)

```typescript
export const api = axios.create({
  baseURL: '/api',                    // Relative path (proxied by Express)
  headers: { 'Content-Type': 'application/json' },
});
```

**Request Interceptor - JWT Injection:**
```typescript
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor - Auto-Refresh:**
```typescript
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { 
            refresh_token: refreshToken 
          });
          
          useAuthStore.getState().setAccessToken(data.access_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);  // Retry
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### API Client Usage Pattern

```typescript
// GET list
const { data } = await api.get('/cycle-logs');

// GET single
const { data } = await api.get(`/cycle-logs/${logId}`);

// POST create
const { data } = await api.post('/cycle-logs', {
  start_date: '2025-05-20',
  flow_level: 'medium',
  symptoms: ['cramps', 'mood_change']
});

// PUT update
const { data } = await api.put(`/cycle-logs/${logId}`, updates);

// DELETE
await api.delete(`/cycle-logs/${logId}`);
```

### Type-Safe API Wrapper

```typescript
// Response type from types.ts
export interface ApiResponse<T> {
  data: T;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Usage with types:
const { data: cycleLog } = await api.get<CycleLog>('/cycle-logs/1');
const { data: logs } = await api.get<CycleLog[]>('/cycle-logs');
```

---

## Authentication Flow

### 1. Registration Flow

```
User fills ChildForm (or ParentForm) with:
├── phone_number
├── first_name, last_name
├── email (optional)
├── user_type (adolescent | parent | health_provider | admin | content_writer)
└── password

      ↓

POST /api/auth/register
{
  "phone_number": "0788123456",
  "password": "secure_password",
  "user_type": "adolescent",
  "first_name": "Kezia",
  "last_name": "Uwase"
}

      ↓

Backend creates User + role-specific record (Adolescent/Parent/etc.)

      ↓

Response: { access_token, refresh_token, user: {...} }

      ↓

Frontend stores:
├── localStorage['refresh_token'] = refresh_token
├── authStore.accessToken = access_token
└── authStore.user = user

      ↓

Navigate to role-based dashboard
```

### 2. Login Flow

```
LoginPage renders with fields:
├── Phone Number (default: 0788123456)
└── PIN/Password (toggle between 4-digit PIN or password)

      ↓

User submits login form

      ↓

const payload = isPinMode
  ? { phone_number, pin: password }
  : { phone_number, password };

POST /api/auth/login

      ↓

Backend validates credentials (Bcrypt check + PIN support)

      ↓

Response: { access_token, refresh_token, user: {...} }

      ↓

Store tokens & user in:
├── localStorage['refresh_token']
├── Zustand authStore.accessToken
└── Zustand authStore.user

      ↓

Role-based redirect:
├── parent → /dashboard/parent
├── health_provider → /dashboard/provider
├── admin → /dashboard/admin
├── content_writer → /dashboard/writer
└── adolescent → /dashboard
```

### 3. Token Refresh Flow

```
User makes API request → Axios interceptor adds JWT header

Request succeeds (200-399) → Use response directly

Request fails with 401 → Token expired

      ↓

Check localStorage['refresh_token']

      ↓

POST /api/auth/refresh
{
  "refresh_token": "<token>"
}

      ↓

Backend validates refresh token & returns new access_token

      ↓

Frontend updates:
├── authStore.setAccessToken(new_access_token)
└── Retry original request with new token

      ↓

Success or fail based on retry

If refresh also fails (401/403) → Logout & redirect to /login
```

### 4. Logout Flow

```
User clicks "Sign Out"

      ↓

authStore.logout():
├── Remove localStorage['refresh_token']
├── Clear accessToken (null)
├── Clear user (null)

      ↓

Navigate to /login

      ↓

Browser session cleared
```

### Seeded Test Credentials (Dev Mode)

| User Type | Phone | PIN/Password | Purpose |
|-----------|-------|-------------|---------|
| Adolescent | 0788123456 | 1234 (PIN) | Kezia Uwase - test user |
| Parent | 0788654321 | password123 | Marie Mukamana - can manage children |
| Healthcare Provider | 0788998877 | doctor123 | Dr. Agnes - manage appointments |
| Admin | 0788001122 | admin123 | System administrator |
| Content Writer | 0788445566 | writer123 | Esperance - create content |

---

## Routing System

### Hash-Based SPA Router

The frontend uses **hash-based routing** (no server-side redirects needed):

```typescript
// Route structure:
window.location.hash = '#/dashboard/parent'
// vs traditional:
window.location.pathname = '/dashboard/parent'
```

**Why Hash Routing:**
- ✅ No server-side routing required (works with static hosting)
- ✅ Browser history management (back/forward buttons)
- ✅ Bookmarkable URLs
- ✅ No 404 errors when refreshing

### Route Map

```
/login                          - Authentication page
/register                       - Registration page
/dashboard                      - Default dashboard (adolescent)
/dashboard/parent               - Parent dashboard (manage children)
/dashboard/provider             - Health provider dashboard
/dashboard/admin                - Admin dashboard
/dashboard/writer               - Content writer dashboard
/umwari                         - AI companion full-screen chat
/cycle                          - Cycle tracking detail
/meals                          - Meal logging detail
/appointments                   - Appointments list/management
/notifications                  - Notifications center
/settings                       - User settings
/content                        - Browse educational content
```

### Router Implementation (in App.tsx)

```typescript
useEffect(() => {
  const handlePopState = () => {
    const hash = window.location.hash.replace('#', '');
    setCurrentPath(hash || '/login');
  };
  window.addEventListener('popstate', handlePopState);
  
  const initialHash = window.location.hash.replace('#', '');
  setCurrentPath(initialHash || '/login');
  
  return () => window.removeEventListener('popstate', handlePopState);
}, []);

const navigate = (path: string) => {
  setCurrentPath(path);
  window.location.hash = path;
};

// Conditional rendering based on currentPath
{currentPath === '/login' && <LoginPage />}
{currentPath === '/register' && <RegisterPage />}
{currentPath === '/dashboard/parent' && <RoleRequired allowed={['parent']}>
  <ParentDashboard />
</RoleRequired>}
```

### Role-Based Access Control

```typescript
const RoleRequired = ({ 
  children, 
  allowed 
}: { 
  children: React.ReactNode; 
  allowed: string[] 
}) => {
  if (!user) {
    return <UnauthenticatedAlert />;
  }

  if (!allowed.includes(user.user_type)) {
    return <UnauthorizedAlert userType={user.user_type} />;
  }

  return <>{children}</>;
};
```

---

## Component Architecture

### UI Components (Base Components)

Located in `components/ui/`:

| Component | Purpose | Props |
|-----------|---------|-------|
| **Button** | Action button | `isLoading`, `disabled`, `className`, `onClick` |
| **Input** | Text/number input | `label`, `icon`, `placeholder`, `type`, `value`, `onChange` |
| **Card** | Container/card layout | `className`, `children` |
| **Badge** | Status/tag badge | `variant`, `children` |
| **Modal** | Dialog/modal | `isOpen`, `onClose`, `title`, `children`, `footer` |
| **Avatar** | User avatar | `src`, `alt`, `size` |
| **Spinner** | Loading indicator | `size`, `color` |
| **EmptyState** | Empty list view | `icon`, `title`, `description`, `action` |

### Feature Components

Located in `components/features/`:

| Component | Purpose |
|-----------|---------|
| **CycleRing** | Visual circle showing current cycle phase |
| **CycleCalendar** | Heatmap calendar of cycle history |
| **NutritionDonut** | Pie chart of meal macronutrients |
| **AppointmentCard** | Individual appointment display |
| **ChildCard** | Child profile card (for parents) |
| **InsightCard** | AI-generated health insight |

### Form Components

Located in `components/forms/`:

```typescript
<CycleLogForm 
  onSubmit={(data) => { /* POST /api/cycle-logs */ }}
  initialData={cycleLogs[0]}
/>

<MealLogForm 
  onSubmit={(data) => { /* POST /api/meal-logs */ }}
/>

<AppointmentForm 
  providers={providers}
  onSubmit={(data) => { /* POST /api/appointments */ }}
/>

<ChildForm 
  onSubmit={(data) => { /* POST /api/parents/children */ }}
  mode="add" | "edit"
/>
```

### Layout Components

**DashboardLayout:** Wraps authenticated pages with sidebar + topbar

```typescript
<DashboardLayout currentPath={currentPath} navigate={navigate}>
  {/* Page content */}
</DashboardLayout>
```

**Sidebar:** Navigation menu with role-based items

**TopBar:** Profile menu, notifications, search

### Umwari AI Companion Components

**UmwariChat:** Main chat interface
- Message history display
- Input field with send button
- Streaming text support
- Language selection

**UmwariFab:** Floating action button to open chat

**UmwariFullPage:** Full-screen chat interface

**UmwariLanguagePicker:** Select conversation language

---

## Forms & Data Entry

### Form Submission Pattern

All forms follow this pattern:

```typescript
const handleSubmit = async (data: FormData) => {
  try {
    setIsLoading(true);
    const payload = transformData(data);  // Client-side validation & transform
    
    // POST or PUT
    const { data: result } = isEditing
      ? await api.put(`/endpoint/${id}`, payload)
      : await api.post('/endpoint', payload);
    
    toast.success('Success!');
    onSuccess?.();  // Callback to parent
    resetForm();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Operation failed');
  } finally {
    setIsLoading(false);
  }
};
```

### CycleLogForm Example

**Fields:**
- Start Date (required)
- End Date (optional)
- Flow Level (light | medium | heavy)
- Symptoms (multi-select: cramps, mood_change, fatigue, etc.)
- Notes (optional text)

**Validation:**
- Start date cannot be in future
- End date must be after start date
- At least one symptom required

**API Integration:**
```typescript
POST /api/cycle-logs {
  start_date: '2025-05-20',
  end_date: '2025-05-26',
  flow_level: 'medium',
  symptoms: ['cramps', 'fatigue'],
  notes: 'Moderate pain on day 2'
}

Response: { id, user_id, confidence_score, created_at, ... }
```

### AppointmentForm Example

**Fields:**
- Health Provider (dropdown, searchable)
- Appointment Type (checkup | consultation | vaccination)
- Preferred Date & Time
- Appointment Notes (optional)

**Provider Search:**
```typescript
GET /api/appointments/search-providers?q=query

GET /api/health-provider/appointments/next-available-slot
  ?provider_id=3&date=2025-05-21
```

---

## Features Overview

### 1. Cycle Tracking (Adolescent Feature)

**Frontend Components:**
- `CycleLogForm` - Data entry
- `CycleRing` - Visual phase indicator
- `CycleCalendar` - Historical heatmap
- Insights card showing predictions

**API Endpoints Used:**
- `POST /api/cycle-logs` - Create log
- `GET /api/cycle-logs` - List logs
- `GET /api/cycle-logs/predictions` - Get predictions
- `GET /api/cycle-logs/fertile-window` - Fertile days
- `GET /api/cycle-logs/health-summary` - Overview

**Data Flow:**
```
User fills CycleLogForm
    ↓
Client-side validation
    ↓
POST /api/cycle-logs
    ↓
Backend calculates predictions (ML insights)
    ↓
Returns cycle_log with confidence_score
    ↓
Update UI with new insights & calendar heatmap
```

### 2. Meal Tracking (Nutrition)

**Frontend Components:**
- `MealLogForm` - Food & mood entry
- `NutritionDonut` - Macronutrient breakdown

**API Endpoints:**
- `POST /api/meal-logs`
- `GET /api/meal-logs`
- `PUT /api/meal-logs/:id`
- `DELETE /api/meal-logs/:id`
- `GET /api/meal-logs/stats`

**Automatic Nutritional Calculation:**
- Backend (or frontend) calculates protein, carbs, fats, calories from food items
- Food database lookup (from nutritionix or similar)

### 3. Appointments

**Frontend Components:**
- `AppointmentForm` - Booking interface
- `AppointmentCard` - Appointment display

**Two Booking Workflows:**

**A. Direct Booking (Adolescent):**
```
/api/appointments/search-providers
/api/appointments/providers/{provider_id}/detailed-info
POST /api/appointments/book-appointment
```

**B. Parent Booking for Child:**
```
GET /api/parent/children
GET /api/parent/children/{child_id}/details
POST /api/parent/book-appointment-for-child
```

**Status Workflow:**
```
pending → confirmed → completed
       ↘ cancelled ↗
```

### 4. Parent-Child Management

**Parent Dashboard Features:**
- List all managed children
- Switch between children (context-aware data viewing)
- View child's cycle logs, meals, appointments
- Add/edit/remove children

**API Endpoints:**
```
GET /api/parents/children                                  # List
POST /api/parents/children                                 # Add
GET /api/parents/children/{child_id}                       # Get
PUT /api/parents/children/{child_id}                       # Edit
DELETE /api/parents/children/{child_id}                    # Remove
GET /api/parents/children/{child_id}/cycle-logs           # View child's cycles
GET /api/parents/children/{child_id}/meal-logs            # View child's meals
GET /api/parents/children/{child_id}/appointments         # View child's appointments
```

**Frontend Context (ChildAccessContext):**
```typescript
const { 
  accessedChild,           // Currently viewed child
  switchToChild,           // Switch viewing context
  clearChildAccess 
} = useChildAccess();

// On logout:
localStorage.removeItem('accessed_child_id');
```

### 5. Health Provider Dashboard

**Features:**
- View assigned/unassigned appointments
- Claim appointments
- Update appointment status
- Manage availability (time slots)
- View patient list
- Analytics & performance metrics

**Key Endpoints:**
```
GET /api/health-provider/dashboard/stats
GET /api/health-provider/appointments
GET /api/health-provider/appointments/unassigned
PATCH /api/health-provider/appointments/{id}/claim
PATCH /api/health-provider/appointments/{id}/update
PUT /api/health-provider/availability
GET /api/health-provider/availability
POST /api/health-provider/availability/slots
GET /api/health-provider/patients
GET /api/health-provider/analytics
```

### 6. Admin Dashboard

**Features:**
- User management (create, suspend, delete, change role)
- Health provider verification
- Content moderation (approve/reject submissions)
- Course management
- System logs & analytics

**API Endpoints:**
```
GET /api/admin/dashboard/stats
GET /api/admin/users
POST /api/admin/users/create
PATCH /api/admin/users/{id}/change-role
GET /api/admin/health-providers
POST /api/admin/health-providers/{id}/verify
GET /api/admin/content/pending
PATCH /api/admin/content/{id}/approve
GET /api/admin/system/logs
POST /api/admin/analytics/generate
```

### 7. Content Writer Dashboard

**Features:**
- Create/edit educational content
- Submit content for approval
- Create courses with modules
- View content analytics
- Manage categories

**API Endpoints:**
```
GET /api/content-writer/dashboard/stats
GET /api/content-writer/content
POST /api/content-writer/content
PUT /api/content-writer/content/{id}
PATCH /api/content-writer/content/{id}/submit
GET /api/content-writer/courses
POST /api/content-writer/courses
PUT /api/content-writer/courses/{id}
PATCH /api/content-writer/courses/{id}/submit
```

### 8. Umwari AI Companion

**Features:**
- Multi-language health Q&A (English, Kinyarwanda, Swahili)
- Streaming chat responses
- Context-aware from user's cycle data
- Onboarding flow for Gemini API key

**Integration Points:**
```typescript
// Hook for AI chat
const { messages, sendMessage, isStreaming } = useUmwari();

// Stores Gemini API key
const { apiKey, language, setApiKey, setLanguage } = useUmwariStore();

// Calls backend or directly to Gemini
POST /api/insights/generate {
  prompt: user_message,
  language: 'rw' | 'en' | 'sw',
  context: { cycle_data, health_history }
}
```

### 9. Notifications

**Features:**
- In-app notification center
- Toast notifications for actions
- Unread count badge
- Mark as read individually or all
- Real-time WebSocket support (future)

**API Endpoints:**
```
GET /api/notifications
GET /api/notifications/recent
GET /api/notifications/unread-count
PUT /api/notifications/{id}/read
PUT /api/notifications/read-all
DELETE /api/notifications/{id}
```

### 10. Content Browser

**Features:**
- Browse educational articles & courses
- Filter by category & language
- Search content
- View featured articles
- Like/save (future feature)

**API Endpoints:**
```
GET /api/content/categories
GET /api/content/items
GET /api/content/items/{id}
GET /api/content/featured
GET /api/content/search?q=term
```

---

## Backend Integration Points

### Critical Integration Requirements

#### 1. Base URL Configuration
**Current:** `baseURL: '/api'` (relative proxy via Express)

**For Backend Integration:**
```typescript
// frontend/src/lib/axios.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5001/api'    // Direct to Flask backend
    : 'https://api.production.com/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
```

#### 2. Environment Variables
**Create `.env` file:**
```env
# Backend API
VITE_API_URL=http://localhost:5001

# AI (Optional - if Umwari doesn't call backend)
VITE_GEMINI_API_KEY=your_gemini_key

# Server port
PORT=3000
```

**Access in frontend:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

#### 3. CORS Handling
**Backend Config (already set):**
```
ALLOWED_ORIGINS: localhost:3000,127.0.0.1:3000,
```

**Frontend needs to include credentials:**
```typescript
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // Include cookies if using cookie-based auth
});
```

#### 4. Token Refresh Endpoint
**Frontend expects:**
```
POST /api/auth/refresh
{
  "refresh_token": "..."
}
Response: { "access_token": "new_token" }
```

**Backend provides:** ✅ Already implemented

#### 5. Role-Based Routes
**Frontend implements:** Route guards that check `user.user_type`

**Backend enforces:** `@role_required()` decorators

**Mapping:**
| Frontend Route | Backend Role | Dashboard Component |
|---|---|---|
| /dashboard/parent | parent | ParentDashboard |
| /dashboard/provider | health_provider | ProviderDashboard |
| /dashboard/admin | admin | AdminDashboard |
| /dashboard/writer | content_writer | WriterDashboard |
| /dashboard | adolescent | AdolescentDashboard |

#### 6. Parent-Child Authorization
**Frontend:** Displays role gate & redirects unauthorized users

**Backend:** **CRITICAL** - validates parent-child relationship on every child data endpoint

```python
# Backend pattern (from instructions):
@jwt_required()
def get_child_data(adolescent_id):
    parent = Parent.query.filter_by(user_id=current_user_id)
    relation = ParentChild.query.filter_by(
        parent_id=parent.id,
        adolescent_id=adolescent_id
    ).first()
    if not relation:
        return 403  # Forbidden
```

#### 7. Type Synchronization
**Frontend types** (in `src/types.ts`) must match **Backend models**

**Critical Mappings:**
```typescript
// Frontend
enum UserType = 'parent' | 'adolescent' | 'health_provider' | 'admin' | 'content_writer'

// Backend
user_type = Column(Enum('parent', 'adolescent', 'health_provider', 'admin', 'content_writer'))

// Field names MUST match exactly:
- phone_number (snake_case)
- first_name (snake_case)
- user_type (NOT userType)
- allow_parent_access (snake_case)
- health_provider_id (snake_case)
```

#### 8. PIN Authentication Support
**Frontend:** Provides PIN toggle in LoginPage

```typescript
isPinMode 
  ? { phone_number, pin: password }
  : { phone_number, password }
```

**Backend:** ✅ Supports both `password` and `pin` fields (Bcrypt hashed)

#### 9. Error Handling
**Frontend expects:** Standard error response format

```typescript
{
  "message": "Error description",
  "error_code": "VALIDATION_ERROR",
  "details": {}  // Optional
}
```

**Backend provides:** ✅ Consistent error JSON responses

#### 10. Pagination
**Frontend expects:** Standard pagination response

```typescript
{
  "data": [...items...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "pages": 25
  }
}
```

**Backend provides:** ✅ Implements pagination with defaults

---

## Environment Configuration

### Development Environment Setup

**1. Backend (.env):**
```env
DATABASE_URL=postgresql://user:pass@localhost/ladys_essence
# OR for SQLite:
DATABASE_URL=sqlite:///instance/ladys_essence.db

JWT_SECRET_KEY=dev-secret-key-change-in-prod
FLASK_ENV=development
FLASK_DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**2. Frontend (.env):**
```env
VITE_API_URL=http://localhost:5001
VITE_GEMINI_API_KEY=optional_if_calling_backend
```

**3. Ports:**
- Frontend: **3000**
- Backend: **5001** (not 5000 - conflict avoidance)
- Database: **5432** (PostgreSQL)

### Development Server Commands

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python run.py
# Runs on http://localhost:5001

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000

# Terminal 3: Database (if using Docker)
docker run -p 5432:5432 postgres:15
```

### Build & Deployment

**Frontend Production Build:**
```bash
npm run build
# Outputs: dist/ (static files)
# dist/index.html - entry point
# dist/server.cjs - Express server bundle
```

**Start Production Server:**
```bash
npm run start
# Serves on port 3000 (configurable via PORT env var)
```

**Docker Compose:**
```bash
docker-compose up
# Brings up backend (5000), frontend (3000), postgres (5432)
```

---

## Development & Deployment

### Local Development Workflow

**1. Start Services:**
```bash
# Backend
cd backend
source venv/bin/activate
flask db upgrade
python run.py &

# Frontend
cd frontend
npm run dev &

# Visit http://localhost:3000
```

**2. Hot Reload:**
- React components: ✅ Vite HMR (instant)
- Backend routes: ❌ Manual restart required
- Types: ✅ TypeScript auto-detection

**3. Debugging:**
```
Browser DevTools:
- React DevTools extension
- Network tab for API requests
- Console for errors

Backend Logs:
- Flask server output in terminal
- SQL queries (if SQLALCHEMY_ECHO=true)
```

### Production Deployment

**Frontend (Vercel):**
```
1. Push code to GitHub
2. Connect repo to Vercel
3. Set env variables:
   - VITE_API_URL=https://api.production.com
4. Auto-builds & deploys on push
```

**Backend (Heroku/Railway/Custom VPS):**
```
1. Ensure .env with production values
2. Run migrations: flask db upgrade
3. Start with gunicorn:
   gunicorn -w 4 -b 0.0.0.0:5001 run:app
```

**Database:**
- Production: Aiven PostgreSQL (already configured)
- Ensure SSL mode in connection string

### Monitoring & Logging

**Frontend:**
- Browser console errors
- Sentry integration (optional)
- Google Analytics

**Backend:**
- Flask logs
- Application Performance Monitoring (APM)
- Error tracking

---

## Integration Checklist

### ✅ Backend API Implementation
- [x] Authentication endpoints (register, login, refresh, profile)
- [x] Cycle logs CRUD + analytics
- [x] Meal logs CRUD
- [x] Period logs CRUD
- [x] Appointments CRUD + search
- [x] Notifications CRUD
- [x] Parent-child management
- [x] Parent appointment booking
- [x] Health provider endpoints
- [x] Admin endpoints
- [x] Content writer endpoints
- [x] Settings endpoints
- [x] JWT middleware
- [x] CORS configuration
- [x] Role-based access control
- [x] Database migrations
- [x] Error handling

### 🔄 Frontend Integration Tasks

#### 1. API Configuration
```typescript
// Update frontend/src/lib/axios.ts
- [x] Configure baseURL from env
- [x] Add request interceptor for JWT
- [x] Add response interceptor for token refresh
- [ ] Add request/response logging (optional)
- [ ] Add error analytics (optional)
```

#### 2. Environment Setup
```bash
# frontend/.env
- [ ] Set VITE_API_URL to backend URL
- [ ] Add other environment variables
```

#### 3. Endpoint Testing
```typescript
// Test each feature's API calls:
- [ ] /api/auth/register - new user signup
- [ ] /api/auth/login - user login
- [ ] /api/auth/refresh - token refresh
- [ ] /api/cycle-logs/* - cycle tracking
- [ ] /api/meal-logs/* - nutrition tracking
- [ ] /api/appointments/* - appointment booking
- [ ] /api/parents/children/* - parent management
- [ ] /api/health-provider/* - provider dashboard
- [ ] /api/admin/* - admin features
- [ ] /api/content-writer/* - content management
- [ ] /api/notifications/* - notifications
- [ ] /api/settings/* - user settings
```

#### 4. Type Synchronization
- [ ] Verify all backend model fields match frontend types
- [ ] Check field naming consistency (snake_case)
- [ ] Ensure enum values match (user_type, status, etc.)
- [ ] Update frontend types if backend schema changes

#### 5. Authentication Testing
- [ ] Test registration flow end-to-end
- [ ] Test login with password
- [ ] Test login with PIN
- [ ] Test token refresh on 401
- [ ] Test logout clears state
- [ ] Test remember-me functionality
- [ ] Test role-based redirects

#### 6. Role-Based Feature Testing
- [ ] Parent dashboard shows children
- [ ] Parent can switch child context
- [ ] Parent can only see own children's data
- [ ] Health provider sees patients & appointments
- [ ] Admin has full control
- [ ] Content writer can submit content
- [ ] Unauthorized users redirected

#### 7. Form Validation
- [ ] CycleLogForm validates dates
- [ ] MealLogForm validates entries
- [ ] AppointmentForm validates times
- [ ] All forms show error messages
- [ ] All forms show success toast

#### 8. Data Loading States
- [ ] Add loading spinners on page transitions
- [ ] Add skeletons for lists
- [ ] Handle empty states gracefully
- [ ] Show error alerts for failed requests

#### 9. WebSocket Integration (Future)
- [ ] Connect to real-time notifications socket
- [ ] Update notification count in real-time
- [ ] Stream appointment updates

#### 10. Performance Optimization
- [ ] Add request/response caching
- [ ] Implement pagination for lists
- [ ] Lazy load images
- [ ] Code split by route
- [ ] Monitor API response times

### 🚀 Deployment Checklist

#### Pre-Deployment
- [ ] Run frontend build: `npm run build`
- [ ] Test production build locally
- [ ] Set all environment variables
- [ ] Update backend API_URL in production config
- [ ] Run backend migrations on production DB
- [ ] Ensure CORS allows production domains

#### Production
- [ ] Deploy frontend to Vercel/netlify
- [ ] Deploy backend to Heroku/Railway/VPS
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure logging/monitoring
- [ ] Set up database backups
- [ ] Configure email/SMS services

---

## Quick Start Commands

### Development
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python run.py

# Terminal 2: Frontend  
cd frontend
npm install
npm run dev

# Visit http://localhost:3000
```

### Testing Accounts
| Role | Phone | PIN/Pass |
|------|-------|----------|
| Adolescent | 0788123456 | 1234 |
| Parent | 0788654321 | password123 |
| Provider | 0788998877 | doctor123 |
| Admin | 0788001122 | admin123 |

### Build & Deploy
```bash
# Frontend build
npm run build

# Frontend start
npm run start

# Backend production
gunicorn -w 4 -b 0.0.0.0:5001 run:app
```

---

## Summary

The Lady's Essence frontend is a **production-ready React SPA** with:

✅ **Complete UI** - All dashboards, forms, and features  
✅ **State Management** - Zustand stores for auth & AI  
✅ **Type Safety** - Full TypeScript coverage  
✅ **API Integration** - Axios with JWT & token refresh  
✅ **Responsive Design** - Mobile-first Tailwind  
✅ **AI Companion** - Umwari multi-language chat  
✅ **Accessibility** - Semantic HTML & ARIA attributes  

**Integration Status:**
- Frontend: ✅ Ready (uses `/api` baseURL)
- Backend: ✅ Ready (provides all endpoints)
- **Connection:** Ready - just configure VITE_API_URL env var

**Key Integration Points:**
1. API base URL environment variable
2. CORS headers (already configured)
3. JWT token in Authorization header (automated)
4. Token refresh on 401 (automated)
5. Role-based route guards (frontend + backend)

---

*Report Generated: May 20, 2026*  
*Frontend Version: React 19 + Vite 6.2.3 + TypeScript 5.8.2*  
*Backend Integration: Ready*
