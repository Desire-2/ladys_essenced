# Virtual Environment & Configuration Setup Guide

## Quick Start

### Activate Virtual Environment
```bash
cd backend
source venv/bin/activate
```

### Verify Notification System
```bash
python -c "
from app.models.notification import Notification, NotificationTemplate, NotificationSubscription
from app.services.notification_manager import notification_manager
from app.services.appointment_notifications import notify_appointment_created
from app.services.cycle_notifications import notify_cycle_prediction_updated
from app.services.admin_notifications import notify_provider_verified
from app.services.settings_notifications import notify_parent_access_enabled
from app.services.content_writer_notifications import notify_content_submitted
print('✓ All notification modules import successfully')
"
```

---

## Environment Configuration (.env)

### Current Configuration
Location: `backend/.env`

**Existing Variables:**
```
ALLOWED_ORIGINS=...          # CORS whitelist
DATABASE_URL=...             # PostgreSQL connection (Aiven cloud)
GOOGLE_API_KEY=...           # Google API credentials
JWT_SECRET_KEY=...           # JWT secret for authentication
GEMINI_API_KEY=...           # Gemini AI integration
```

### Notification-Specific Configuration

#### Email Notifications (Optional)
Add these to `.env` if implementing email notifications:

```env
# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=noreply@ladysessence.com
MAIL_SUBJECT_PREFIX=[Lady's Essence]
```

**Gmail Setup:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password in `MAIL_PASSWORD`

#### SMS Notifications (Optional)
Add these to `.env` if implementing SMS notifications:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Or using environment variables directly
SMS_PROVIDER=twilio
SMS_API_KEY=your-api-key
```

#### Notification Preferences (Optional)
```env
# Default notification settings
NOTIFICATIONS_ENABLED=True
NOTIFICATIONS_DEFAULT_CHANNEL=in_app
NOTIFICATIONS_RETENTION_DAYS=30
NOTIFICATIONS_BACKGROUND_INTERVAL=30
```

---

## Virtual Environment Setup

### Installation Reminder
The backend uses Python 3.8+ with requirements specified in `requirements.txt`.

**Already Installed Packages for Notifications:**
```
Flask==3.1.0
Flask-SQLAlchemy==3.0.5
Flask-JWT-Extended==4.4.4
Flask-SocketIO==5.3.4
```

### Install Additional Notifications Features (if needed)

**For Email Support:**
```bash
source venv/bin/activate
pip install Flask-Mail==0.9.1
```

**For SMS Support:**
```bash
source venv/bin/activate
pip install twilio==8.10.0
```

**For Background Tasks (Production):**
```bash
source venv/bin/activate
pip install celery==5.3.4 redis==5.0.0
```

**Update requirements.txt after installing:**
```bash
pip freeze > requirements.txt
```

---

## Running the Notification System

### Start Backend with Virtual Environment
```bash
cd backend
source venv/bin/activate
python run.py
```

**Output should show:**
```
✓ Notification templates seeded successfully
 * Running on http://127.0.0.1:5001
```

### Start Frontend (Separate Terminal)
```bash
cd frontend
npm run dev
```

**Frontend will connect to:**
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## Testing Notification Integration

### Test 1: Import All Modules
```bash
source venv/bin/activate
python -c "
from app.models.notification import Notification, NotificationTemplate, NotificationSubscription
from app.services.notification_manager import notification_manager
from app.services.appointment_notifications import *
from app.services.cycle_notifications import *
from app.services.admin_notifications import *
from app.services.settings_notifications import *
from app.services.content_writer_notifications import *
print('✓ All notification helpers import successfully')
"
```

### Test 2: Verify Database Connection
```bash
source venv/bin/activate
python -c "
from app import create_app, db
from app.models.notification import Notification
app = create_app()
with app.app_context():
    notification_count = Notification.query.count()
    print(f'✓ Database connected, {notification_count} notifications in system')
"
```

### Test 3: Check Template Seeding
```bash
source venv/bin/activate
python -c "
from app import create_app, db
from app.models.notification import NotificationTemplate
app = create_app()
with app.app_context():
    templates = NotificationTemplate.query.all()
    print(f'✓ {len(templates)} notification templates seeded')
    for t in templates[:3]:
        print(f'  - {t.name}')
"
```

### Test 4: API Endpoint Health Check
```bash
# Start backend first: source venv/bin/activate && python run.py

# In another terminal:
curl http://localhost:5001/health
# Expected: {"status": "ok"}
```

---

## Development Workflow

### Phase 3 Route Integration (Current Task)

1. **Activate Virtual Environment**
   ```bash
   cd backend
   source venv/bin/activate
   ```

2. **Edit Route Files**
   - Open `app/routes/appointments.py`
   - Add import: `from app.services.appointment_notifications import notify_appointment_created`
   - Call helper at integration point

3. **Test Changes**
   ```bash
   python -m py_compile app/routes/appointments.py
   ```

4. **Run Backend**
   ```bash
   python run.py
   ```

5. **Test with curl/Frontend**
   ```bash
   curl -X GET http://localhost:5001/api/notifications \
     -H "Authorization: Bearer $TOKEN"
   ```

### Deactivate Virtual Environment (When Done)
```bash
deactivate
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'app'"

**Solution:** Ensure you've activated venv first
```bash
source venv/bin/activate  # Always do this first!
python run.py             # Then run commands
```

### Issue: "python: command not found"

**Solution:** Use `python3` explicitly or activate venv
```bash
source venv/bin/activate
python run.py  # Now 'python' is available
```

### Issue: Database connection fails

**Verify .env has valid DATABASE_URL:**
```bash
source venv/bin/activate
python -c "import os; print(os.getenv('DATABASE_URL')[:30] + '...')"
```

### Issue: Notification templates not seeding

**Check app/__init__.py imports template seeding:**
```bash
source venv/bin/activate
grep -n "seed_notification_templates" app/__init__.py
```

Should show: `from app.services.notification_templates_seed import seed_notification_templates`

---

## File Checklist

### Required Files
- ✅ `backend/venv/` - Python virtual environment
- ✅ `backend/.env` - Environment configuration
- ✅ `backend/requirements.txt` - Python dependencies
- ✅ `backend/app/models/notification.py` - Notification models (19 columns)
- ✅ `backend/app/services/notification_manager.py` - Core service
- ✅ `backend/app/services/notification_templates_seed.py` - 16 templates
- ✅ `backend/app/services/appointment_notifications.py` - Appointment helpers
- ✅ `backend/app/services/cycle_notifications.py` - Cycle helpers
- ✅ `backend/app/services/admin_notifications.py` - Admin helpers
- ✅ `backend/app/services/settings_notifications.py` - Settings helpers
- ✅ `backend/app/services/content_writer_notifications.py` - Content helpers
- ✅ `backend/app/routes/notifications_api.py` - REST endpoints (4 new)

### Integration Files (In Progress - Phase 3)
- ⏳ `backend/app/routes/appointments.py` - Add appointment helper calls
- ⏳ `backend/app/routes/parent_appointments.py` - Add parent appointment helpers
- ⏳ `backend/app/routes/cycle_logs.py` - Add cycle notification helpers
- ⏳ `backend/app/routes/settings.py` - Add privacy notification helpers
- ⏳ `backend/app/routes/health_provider.py` - Add provider notification helpers
- ⏳ `backend/app/routes/admin_complete.py` - Add admin notification helpers
- ⏳ `backend/app/routes/content_writer.py` - Add content submission helpers

---

## Environment Variables Reference

### Required (Already Set)
```
DATABASE_URL         # PostgreSQL connection string
JWT_SECRET_KEY       # JWT authentication secret
GOOGLE_API_KEY       # Google API key
GEMINI_API_KEY       # Gemini AI API key
ALLOWED_ORIGINS      # CORS whitelist
```

### Optional (For Future Enhancement)
```
MAIL_SERVER          # SMTP server for email notifications
MAIL_PORT            # SMTP port (587 for TLS, 465 for SSL)
MAIL_USERNAME        # Email account username
MAIL_PASSWORD        # Email account app password
TWILIO_ACCOUNT_SID   # Twilio SMS account
TWILIO_AUTH_TOKEN    # Twilio authentication token
TWILIO_PHONE_NUMBER  # Twilio phone number for SMS
```

---

## Next Steps

1. **Phase 3 Integration**: Use venv to edit and test route integrations
   ```bash
   cd backend && source venv/bin/activate
   # Edit routes, test with: python -m py_compile app/routes/appointments.py
   ```

2. **Phase 4 Background Tasks**: Implement appointment reminders
   ```bash
   # May need: pip install celery redis
   # Add to .env: NOTIFICATIONS_BACKGROUND_INTERVAL=30
   ```

3. **Email Support (Optional)**: Add email channel
   ```bash
   pip install Flask-Mail
   # Add MAIL_* variables to .env
   ```

4. **SMS Support (Optional)**: Add SMS channel
   ```bash
   pip install twilio
   # Add TWILIO_* variables to .env
   ```

---

## Summary

| Component | Status | Command |
|-----------|--------|---------|
| Virtual Environment | ✅ Ready | `source venv/bin/activate` |
| .env Configuration | ✅ Ready | `cat backend/.env` |
| Notification Models | ✅ Ready | `python -c "from app.models.notification import Notification"` |
| Helper Modules | ✅ Ready | All 5 helpers in `app/services/` |
| API Endpoints | ✅ Ready | 4 new endpoints in `notifications_api.py` |
| Route Integration | ⏳ Phase 3 | In progress (20 integration points) |

**Everything is configured and ready for Phase 3 route integration!**
