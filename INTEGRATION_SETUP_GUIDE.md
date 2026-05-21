# Frontend-Backend Integration Configuration Guide

**Created:** May 20, 2026  
**Status:** Ready for Integration  

---

## Quick Integration Steps

### Step 1: Configure Environment Variables

**Create `frontend/.env.local` (development):**
```env
# Backend API URL (Flask runs on port 5001)
VITE_API_URL=http://localhost:5001

# Optional: Gemini API Key (if Umwari calls external API directly)
VITE_GEMINI_API_KEY=

# Development port (optional)
PORT=3000
```

**Create `frontend/.env.production` (production):**
```env
# Production backend URL
VITE_API_URL=https://api.production.com
VITE_GEMINI_API_KEY=your_production_key
```

### Step 2: Update Axios Configuration

**File:** `frontend/src/lib/axios.ts`

**Current (uses relative baseURL with Express proxy):**
```typescript
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});
```

**Update to (use environment variable):**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // Include credentials if needed
});
```

### Step 3: Update Token Refresh Endpoint

**File:** `frontend/src/lib/axios.ts`

**Current:**
```typescript
const { data } = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
```

**Update to:**
```typescript
const refreshApiUrl = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/auth/refresh`
  : '/api/auth/refresh';

const { data } = await axios.post(refreshApiUrl, { refresh_token: refreshToken });
```

### Step 4: Verify Backend CORS Configuration

**Backend is already configured with:**
```python
# backend/app/__init__.py
allowed_origins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://ladys-essence.afritechbridge.online',
  'https://ladys-essenced.vercel.app',
  # ... other production domains
]

CORS(app, origins=allowed_origins, ...)
```

**If needed, add production frontend URL to backend `.env`:**
```env
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

### Step 5: Start Both Services

**Terminal 1 - Backend (port 5001):**
```bash
cd backend
source venv/bin/activate
flask db upgrade          # Ensure migrations applied
python run.py
```

**Terminal 2 - Frontend (port 3000):**
```bash
cd frontend
npm install               # First time only
npm run dev
```

**Expected Output:**
```
Frontend: ✅ http://localhost:3000
Backend:  ✅ http://localhost:5001
```

### Step 6: Test Integration

**1. Login Test:**
```bash
Navigate to: http://localhost:3000/#/login
Use credentials:
- Phone: 0788123456
- PIN: 1234
```

**2. API Call Verification (browser console):**
```javascript
// Get current API base URL
console.log(import.meta.env.VITE_API_URL)

// Make test request
fetch(new URL('/api/auth/profile', import.meta.env.VITE_API_URL).toString(), {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('Profile:', d))
```

---

## Environment Variable Reference

### Frontend Environment Variables

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `VITE_API_URL` | ❌ | `/api` | `http://localhost:5001` |
| `VITE_GEMINI_API_KEY` | ❌ | `undefined` | `AIzaSy...` |
| `PORT` | ❌ | `3000` | `3001` |

**Vite Env Prefix:** `VITE_` (automatically exposed to client)

### Backend Environment Variables

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `DATABASE_URL` | ✅ | SQLite fallback | `postgresql://user:pass@localhost/db` |
| `JWT_SECRET_KEY` | ✅ | `dev-secret-key` | Long random string |
| `FLASK_ENV` | ❌ | `development` | `production` |
| `FLASK_DEBUG` | ❌ | `false` | `true` (dev only) |
| `ALLOWED_ORIGINS` | ✅ | Defaults | `http://localhost:3000,https://app.com` |

---

## API Endpoint Verification Checklist

### Auth Endpoints
```bash
# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "0788111111",
    "password": "test123",
    "user_type": "adolescent",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "0788123456",
    "password": "1234"
  }'
# Note: PIN mode uses "pin" instead of "password"

# Get Profile (requires token)
TOKEN="eyJ0eXAi..."  # From login response
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"

# Refresh Token
curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "..."}'
```

### Cycle Logs Endpoints
```bash
TOKEN="eyJ0eXAi..."

# Create cycle log
curl -X POST http://localhost:5001/api/cycle-logs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-05-20",
    "flow_level": "medium",
    "symptoms": ["cramps", "fatigue"]
  }'

# Get all cycle logs
curl -X GET http://localhost:5001/api/cycle-logs \
  -H "Authorization: Bearer $TOKEN"

# Get cycle predictions
curl -X GET http://localhost:5001/api/cycle-logs/predictions \
  -H "Authorization: Bearer $TOKEN"
```

### Parent Endpoints
```bash
# Get children list
curl -X GET http://localhost:5001/api/parents/children \
  -H "Authorization: Bearer $TOKEN"

# Get child's cycle logs
curl -X GET http://localhost:5001/api/parents/children/1/cycle-logs \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting Common Integration Issues

### Issue 1: "Cannot POST /api/auth/login"

**Cause:** Frontend requesting wrong URL or Express proxy not configured

**Solution:**
```typescript
// frontend/src/lib/axios.ts
console.log('API Base URL:', import.meta.env.VITE_API_URL);

// Check actual request in DevTools Network tab:
// Should show: http://localhost:5001/api/auth/login
// NOT: http://localhost:3000/api/auth/login
```

### Issue 2: "CORS error: Access-Control-Allow-Origin missing"

**Cause:** Frontend domain not in backend ALLOWED_ORIGINS

**Solution:**
1. Check backend logs for allowed origins
2. Add frontend URL to `backend/.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```
3. Restart backend: `python run.py`

### Issue 3: "401 Unauthorized" on protected endpoints

**Cause:** JWT token missing or invalid

**Solution:**
```typescript
// Check if token is in localStorage
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
console.log('Access Token:', useAuthStore.getState().accessToken);

// Check if Authorization header is sent
// DevTools → Network → Select request → Headers → Authorization
```

### Issue 4: "User not found" on login

**Cause:** Test credentials don't exist in database

**Solution:**
1. Register a new user first
2. Or use seeded test users in `server.ts` (Express dev server)
3. Or directly create user in database:
   ```bash
   psql -U user -d ladys_essence
   INSERT INTO user (phone_number, password_hash, user_type, first_name, last_name)
   VALUES ('0788111111', bcrypt_hash('1234'), 'adolescent', 'Test', 'User');
   ```

### Issue 5: Tokens not persisting after page refresh

**Cause:** localStorage cleared or refresh token endpoint failing

**Solution:**
```typescript
// Check localStorage persistence
localStorage.setItem('refresh_token', 'test');
console.log(localStorage.getItem('refresh_token'));  // Should show 'test'

// Check token refresh endpoint
curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your_token"}'
# Should return { "access_token": "new_token" }
```

### Issue 6: Parent-child authorization "Child not found"

**Cause:** Parent-child relationship not created in database

**Solution:**
```python
# Backend verification
parent = Parent.query.filter_by(user_id=parent_user_id).first()
relation = ParentChild.query.filter_by(
    parent_id=parent.id,
    adolescent_id=child_id
).first()
print(f"Relation exists: {relation is not None}")

# Create relation if missing (one-time setup)
relation = ParentChild(parent_id=parent.id, adolescent_id=child_id)
db.session.add(relation)
db.session.commit()
```

---

## Performance Optimization Tips

### Frontend
```typescript
// 1. Add request/response caching
const cache = new Map();

api.interceptors.request.use(config => {
  if (config.method === 'get') {
    const key = `${config.url}`;
    if (cache.has(key)) {
      return Promise.resolve(cache.get(key));
    }
  }
  return config;
});

// 2. Implement pagination
GET /api/cycle-logs?page=1&limit=10&sort=-created_at

// 3. Use code splitting by route
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// 4. Lazy load images
<img loading="lazy" src={imageUrl} />
```

### Backend
```python
# 1. Add database indexes
class User(db.Model):
    __table_args__ = (
        Index('idx_user_phone', 'phone_number'),
        Index('idx_user_type', 'user_type'),
    )

# 2. Use query optimization
db.session.query(CycleLog).filter_by(user_id=user_id).limit(10).all()

# 3. Cache predictions
if cache.exists(f'predictions:{user_id}'):
    return cache.get(f'predictions:{user_id}')

# 4. Use pagination
page = request.args.get('page', 1, type=int)
limit = request.args.get('limit', 10, type=int)
items = CycleLog.query.paginate(page=page, per_page=limit)
```

---

## Docker Integration

### Development with Docker Compose

**File:** `docker-compose.yml` (already configured)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Stop services
docker-compose down
```

**Port Mappings:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000 (mapped internally)
- PostgreSQL: localhost:5432

### Production Deployment

**Frontend (Vercel):**
```bash
# Connect GitHub repo to Vercel
# Set environment variable in Vercel dashboard:
VITE_API_URL=https://api.production.com

# Auto-deploys on push to main
```

**Backend (Heroku):**
```bash
# Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0

# Set environment variables
heroku config:set JWT_SECRET_KEY=prod_key
heroku config:set ALLOWED_ORIGINS=https://frontend.vercel.app

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

---

## Security Checklist

- [ ] JWT_SECRET_KEY is strong (32+ characters)
- [ ] HTTPS enforced in production
- [ ] CORS allows only trusted origins
- [ ] Passwords hashed with Bcrypt
- [ ] API keys not committed to Git (.env in .gitignore)
- [ ] SQL injection prevented (using SQLAlchemy ORM)
- [ ] XSS prevention (React auto-escapes by default)
- [ ] CSRF tokens used if needed
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all forms
- [ ] Error messages don't leak sensitive info
- [ ] Secrets not logged to console

---

## Monitoring & Logging

### Frontend Monitoring
```typescript
// Add error reporting
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your_sentry_dsn@sentry.io/project",
  environment: process.env.NODE_ENV,
});

// Log API errors
api.interceptors.response.use(null, error => {
  console.error('API Error:', {
    status: error.response?.status,
    data: error.response?.data,
    url: error.config?.url,
  });
  Sentry.captureException(error);
  return Promise.reject(error);
});
```

### Backend Monitoring
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log important events
logger.info(f"User {user_id} logged in")
logger.warning(f"Failed login attempt from {phone_number}")
logger.error(f"Database error: {e}")
```

---

## Testing Integration

### Unit Tests (Frontend)
```typescript
// frontend/src/__tests__/api.test.ts
import { api } from '../lib/axios';

describe('API Client', () => {
  it('should add Authorization header', () => {
    // Mock auth store
    const spy = jest.spyOn(api.interceptors.request, 'handlers');
    // Assert Authorization header added
  });

  it('should refresh token on 401', async () => {
    // Mock 401 response
    // Assert token refresh called
    // Assert request retried
  });
});
```

### Integration Tests
```typescript
// Test full authentication flow
describe('Authentication', () => {
  it('should register and login new user', async () => {
    // Register
    const registerRes = await api.post('/auth/register', {...});
    expect(registerRes.status).toBe(200);
    
    // Login
    const loginRes = await api.post('/auth/login', {
      phone_number: '0788111111',
      password: 'test123'
    });
    expect(loginRes.data.access_token).toBeDefined();
  });
});
```

---

## Common Integration Patterns

### 1. Fetching Protected Data

```typescript
// In a component
useEffect(() => {
  const fetchData = async () => {
    try {
      const { data } = await api.get('/cycle-logs');
      setData(data);
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, will be auto-refreshed
        // Retry will happen automatically
      } else {
        toast.error('Failed to load data');
      }
    }
  };
  
  fetchData();
}, []);
```

### 2. Creating Resources

```typescript
const handleSubmit = async (formData) => {
  try {
    const { data } = await api.post('/cycle-logs', {
      start_date: formData.startDate,
      flow_level: formData.flow,
      symptoms: formData.symptoms,
    });
    
    toast.success('Cycle log created!');
    navigate('/cycle-logs');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to create');
  }
};
```

### 3. Updating Resources

```typescript
const handleUpdate = async (id, updates) => {
  try {
    const { data } = await api.put(`/cycle-logs/${id}`, updates);
    toast.success('Updated successfully');
    setData(data);
  } catch (error) {
    toast.error(error.response?.data?.message);
  }
};
```

### 4. Deleting Resources

```typescript
const handleDelete = async (id) => {
  if (!confirm('Are you sure?')) return;
  
  try {
    await api.delete(`/cycle-logs/${id}`);
    toast.success('Deleted');
    setData(data.filter(item => item.id !== id));
  } catch (error) {
    toast.error('Failed to delete');
  }
};
```

---

## Next Steps

1. **Configure environment variables** (`.env.local`)
2. **Start both backend and frontend** on correct ports
3. **Test login flow** with demo credentials
4. **Verify API calls** in browser DevTools
5. **Test each feature** (cycle tracking, appointments, etc.)
6. **Load test** with multiple concurrent users
7. **Deploy to staging** environment
8. **Perform UAT** with real users
9. **Deploy to production**
10. **Monitor performance** and errors

---

**Status:** ✅ Ready for Integration  
**Contact:** If integration issues, check logs & troubleshooting section above.
