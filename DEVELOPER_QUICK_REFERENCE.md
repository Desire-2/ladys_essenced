# Lady's Essence - Developer Quick Reference

**Last Updated:** May 20, 2026

---

## 🚀 Quick Start (Copy & Paste)

### Terminal 1: Backend
```bash
cd backend
source venv/bin/activate
python run.py
# ✅ http://localhost:5001
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
# ✅ http://localhost:3000
```

### Browser
```
http://localhost:3000
Login: 0788123456 / PIN: 1234
```

---

## 📋 Environment Variables

### `frontend/.env.local`
```env
VITE_API_URL=http://localhost:5001
PORT=3000
```

### `backend/.env`
```env
DATABASE_URL=sqlite:///instance/ladys_essence.db
JWT_SECRET_KEY=dev-secret-key
FLASK_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🧪 Test Credentials

| Role | Phone | PIN/Pass | Purpose |
|------|-------|----------|---------|
| Adolescent | 0788123456 | 1234 | Kezia - track cycles |
| Parent | 0788654321 | password123 | Marie - manage children |
| Provider | 0788998877 | doctor123 | Dr. Agnes - appointments |
| Admin | 0788001122 | admin123 | System admin |
| Writer | 0788445566 | writer123 | Content creator |

---

## 🔑 Key Files

### Backend
| File | Purpose |
|------|---------|
| `backend/run.py` | Entry point (starts on 5001) |
| `backend/app/__init__.py` | Flask factory, blueprints, CORS |
| `backend/app/models/__init__.py` | 20+ SQLAlchemy models |
| `backend/app/routes/` | 20 files with 150+ endpoints |
| `backend/app/auth/middleware.py` | JWT decorators |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Main router & pages |
| `frontend/src/lib/axios.ts` | API client + JWT interceptor |
| `frontend/src/stores/authStore.ts` | Auth state (Zustand) |
| `frontend/src/types.ts` | TypeScript interfaces |
| `frontend/vite.config.ts` | Vite dev server (proxies `/api` → Flask) |

---

## 🔗 API Base URLs

### Development
```
Frontend: http://localhost:3000
Backend:  http://localhost:5001
API:      http://localhost:5001/api
```

### Example API Calls
```bash
# Get profile
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5001/api/auth/profile

# Create cycle log
curl -X POST http://localhost:5001/api/cycle-logs \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2025-05-20","flow_level":"medium"}'

# Get cycle logs
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5001/api/cycle-logs
```

---

## 🔐 JWT Flow

```
1. User logs in → POST /api/auth/login
2. Backend returns: { access_token, refresh_token, user }
3. Frontend stores:
   - localStorage['refresh_token']
   - Zustand: accessToken + user
4. Every request adds: Authorization: Bearer {accessToken}
5. If 401 → Frontend calls POST /api/auth/refresh
6. Backend returns: { access_token }
7. Frontend retries request with new token
```

---

## 📊 Common Endpoints

### Authentication
```
POST   /api/auth/register          # Create account
POST   /api/auth/login             # Login
POST   /api/auth/refresh           # Refresh token
GET    /api/auth/profile           # Get current user
POST   /api/auth/logout            # Logout
```

### Cycle Tracking
```
POST   /api/cycle-logs             # Create log
GET    /api/cycle-logs             # Get all logs
GET    /api/cycle-logs/:id         # Get one log
PUT    /api/cycle-logs/:id         # Update log
DELETE /api/cycle-logs/:id         # Delete log
GET    /api/cycle-logs/predictions # Get predictions
GET    /api/cycle-logs/fertile-window  # Fertile days
GET    /api/cycle-logs/health-summary  # Overview
```

### Parent
```
GET    /api/parents/children       # Get children
POST   /api/parents/children       # Add child
GET    /api/parents/children/:id/cycle-logs
GET    /api/parents/children/:id/appointments
```

### Appointments
```
POST   /api/appointments/book-appointment
GET    /api/appointments
GET    /api/appointments/:id
PATCH  /api/appointments/:id/status
GET    /api/appointments/search-providers
```

### Notifications
```
GET    /api/notifications
GET    /api/notifications/unread-count
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
```

---

## 🎯 Role-Based Routes

| User Type | Route | Component |
|-----------|-------|-----------|
| parent | #/dashboard/parent | ParentDashboard |
| health_provider | #/dashboard/provider | ProviderDashboard |
| admin | #/dashboard/admin | AdminDashboard |
| content_writer | #/dashboard/writer | WriterDashboard |
| adolescent | #/dashboard | AdolescentDashboard |

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check port 5001 is free
lsof -i :5001

# Check requirements installed
pip install -r requirements.txt

# Run migrations
flask db upgrade
```

### Frontend won't connect
```bash
# Check VITE_API_URL env var
echo $VITE_API_URL  # Should be: http://localhost:5001

# Check DevTools Network tab
# Should see requests to http://localhost:5001/api/...

# Check backend CORS
# Headers should include: Access-Control-Allow-Origin
```

### Login fails
```bash
# Test backend directly
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"0788123456","password":"1234"}'

# Check user exists in database
# Check password hashing (Bcrypt)
```

### Token expires immediately
```bash
# Check JWT_SECRET_KEY in backend .env
# Check token refresh endpoint works
curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"your_token"}'
```

---

## 💾 Database Commands

### Migrations
```bash
# Create migration after model change
flask db migrate -m "Description"

# Apply migrations
flask db upgrade

# Rollback one migration
flask db downgrade

# See migration history
flask db history
```

### Database Utils
```bash
# SQLite console
sqlite3 instance/ladys_essence.db

# PostgreSQL console (if using)
psql postgresql://user:pass@localhost/ladys_essence
```

---

## 🎨 Frontend Component Locations

```
src/
├── components/
│   ├── ui/              → Button, Input, Card, etc.
│   ├── features/        → CycleRing, AppointmentCard, etc.
│   ├── forms/           → CycleLogForm, MealLogForm, etc.
│   ├── layout/          → DashboardLayout, Sidebar, etc.
│   └── umwari/          → AI chat components
├── stores/              → Zustand: authStore, umwariStore
├── lib/
│   ├── axios.ts         → API client
│   ├── utils.ts         → Helpers
│   └── gemini.ts        → AI integration
└── types/
    └── types.ts         → TypeScript interfaces
```

---

## 🔄 Common Tasks

### Add New API Endpoint

**Backend:**
```python
# backend/app/routes/example.py
@example_bp.route('/new-endpoint', methods=['POST'])
@jwt_required()
def create_new():
    data = request.get_json()
    # Business logic
    return jsonify({'message': 'Created'}), 201
```

**Frontend:**
```typescript
// frontend/src/lib/api.ts (or within component)
const { data } = await api.post('/example/new-endpoint', payload);
```

### Add New Feature Component

```typescript
// frontend/src/components/features/NewFeature.tsx
import { api } from '@/lib/axios';

export function NewFeature() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    api.get('/api/new-endpoint')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Update Type Definitions

```typescript
// frontend/src/types.ts
export interface NewType {
  id: number;
  name: string;
  created_at: string;
  // Match backend model field names exactly!
}
```

---

## 📱 Frontend Components Checklist

**UI (Base):**
- [ ] Button, Input, Card, Badge, Modal
- [ ] Avatar, Spinner, EmptyState

**Features:**
- [ ] CycleRing, CycleCalendar, NutritionDonut
- [ ] AppointmentCard, ChildCard, InsightCard

**Forms:**
- [ ] CycleLogForm, MealLogForm
- [ ] AppointmentForm, ChildForm

**Layout:**
- [ ] DashboardLayout, Sidebar, TopBar

**Umwari (AI):**
- [ ] UmwariChat, UmwariFab
- [ ] UmwariLanguagePicker, UmwariFullPage

---

## 🚢 Deployment Commands

### Frontend
```bash
# Build
npm run build

# Test build locally
npm run start

# Deploy to Vercel (connected)
git push origin main  # Auto-deploys
```

### Backend
```bash
# Using Gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 run:app

# Using Heroku
git push heroku main

# Check logs
heroku logs --tail
```

---

## 🔍 Debugging

### Check API Response
```javascript
// In browser console after login
const token = useAuthStore.getState().accessToken;
fetch('http://localhost:5001/api/cycle-logs', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log(d))
```

### Check Backend Logs
```bash
# Terminal where Flask is running
# Look for: [INFO], [WARNING], [ERROR]
# Print statements show in terminal
```

### Check Database
```bash
# SQLite
sqlite3 instance/ladys_essence.db
SELECT * FROM user;
SELECT * FROM cycle_log;
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| BACKEND_ANALYSIS_REPORT.md | Complete backend documentation |
| FRONTEND_ANALYSIS_INTEGRATION_REPORT.md | Frontend & integration guide |
| INTEGRATION_SETUP_GUIDE.md | Step-by-step configuration |
| SYSTEM_INTEGRATION_SUMMARY.md | Architecture & workflows |
| THIS FILE | Quick reference for developers |

---

## ✅ Before Going Live

- [ ] Frontend env vars configured
- [ ] Backend env vars configured
- [ ] CORS includes production domain
- [ ] Database backups enabled
- [ ] Monitoring/logging set up
- [ ] Error tracking enabled
- [ ] Performance tested
- [ ] Security audit passed
- [ ] All roles tested
- [ ] Parent-child auth verified

---

## 🎓 Learning Path

1. **Read:** SYSTEM_INTEGRATION_SUMMARY.md (10 min)
2. **Setup:** INTEGRATION_SETUP_GUIDE.md (5 min)
3. **Test:** Run login flow locally (5 min)
4. **Explore:** Read backend/app/routes/auth.py (5 min)
5. **Build:** Add new feature (30+ min)

---

## 🆘 When Stuck

1. Check INTEGRATION_SETUP_GUIDE.md troubleshooting section
2. Check backend terminal for errors
3. Check browser DevTools Network tab
4. Check browser console for client errors
5. Test endpoint with curl
6. Check database directly

---

## 📞 Key Contacts

- **Backend Lead:** Check Flask docs, SQLAlchemy ORM docs
- **Frontend Lead:** Check React docs, Vite docs
- **Database:** PostgreSQL/SQLite docs
- **AI:** Google Gemini API docs

---

**Status:** ✅ Ready for Integration  
**Quick Start Time:** ~5 minutes  
**Full Integration Time:** ~1 hour  
**Testing Time:** ~2-4 hours  

🚀 **Happy coding!**
