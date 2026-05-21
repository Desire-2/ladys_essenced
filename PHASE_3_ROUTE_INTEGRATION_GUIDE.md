# Phase 3: Notification Helper Integration Guide

## Overview
This document provides exact integration points for wiring notification helper modules into existing route handlers. All helper modules are complete and tested; this guide ensures systematic integration without missing any events.

## Helper Modules Created ✅

| Module | Location | Functions | Status |
|--------|----------|-----------|--------|
| appointment_notifications.py | backend/app/services/ | notify_appointment_created(), notify_appointment_confirmed(), notify_appointment_cancelled(), notify_appointment_rescheduled() | Ready |
| cycle_notifications.py | backend/app/services/ | notify_cycle_prediction_updated(), notify_period_late(), notify_cycle_anomaly() | Ready |
| admin_notifications.py | backend/app/services/ | notify_provider_verified(), notify_provider_verification_revoked(), notify_content_approved(), notify_content_rejected(), notify_new_provider_registration(), notify_user_role_changed(), notify_user_deactivated() | Ready |
| settings_notifications.py | backend/app/services/ | notify_parent_access_enabled(), notify_parent_access_disabled() | Ready |
| content_writer_notifications.py | backend/app/services/ | notify_content_submitted() | Ready |

## New API Endpoints Added ✅

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/notifications/preferences | GET | Retrieve user's notification channel preferences |
| /api/notifications/preferences | PUT | Update user's notification preferences |
| /api/notifications/clear-all | DELETE | Clear all read notifications |
| /api/notifications/admin/broadcast | POST | Admin-only broadcast to all/specific roles |

---

## Integration Points by Route File

### 1. backend/app/routes/appointments.py

**Import Statement (Top of File):**
```python
from app.services.appointment_notifications import (
    notify_appointment_created,
    notify_appointment_confirmed,
    notify_appointment_cancelled,
    notify_appointment_rescheduled,
)
```

**Point 1: POST / - Create Appointment**
- **Current Location**: After appointment is saved to DB and status is 'pending'
- **Integration Code**:
```python
# After: db.session.commit() for new appointment
appointment = Appointment(...)
db.session.add(appointment)
db.session.commit()

# ADD THIS:
notify_appointment_created(appointment, current_user_id)
```

**Point 2: PUT /<id> - Reschedule Appointment**
- **Current Location**: After appointment is updated with new datetime
- **Integration Code**:
```python
# Save old datetime before update
old_datetime = appointment.appointment_datetime

# Update appointment
appointment.appointment_datetime = new_datetime
db.session.commit()

# ADD THIS:
notify_appointment_rescheduled(appointment, old_datetime)
```

**Point 3: DELETE /<id> - Cancel Appointment**
- **Current Location**: Before appointment is deleted or marked cancelled
- **Integration Code**:
```python
# ADD THIS BEFORE deletion:
notify_appointment_cancelled(appointment)

# Then proceed with deletion:
db.session.delete(appointment)
db.session.commit()
```

**Point 4: Provider Claiming Appointment**
- **Current Location**: When provider assigns themselves to appointment
- **Look for**: Code updating appointment.provider_id or status to 'confirmed'
- **Integration Code**:
```python
# After provider is assigned and status is updated to 'confirmed'
appointment.provider_id = provider_id
appointment.status = 'confirmed'
db.session.commit()

# ADD THIS:
notify_appointment_confirmed(appointment)
```

---

### 2. backend/app/routes/parent_appointments.py

**Import Statement (Top of File):**
```python
from app.services.appointment_notifications import (
    notify_appointment_created,
    notify_appointment_confirmed,
    notify_appointment_cancelled,
    notify_appointment_rescheduled,
)
```

**Point 1: Parent Books for Child**
- **Current Location**: After appointment is created with parent_booked_for_child context
- **Integration Code**:
```python
appointment = Appointment(...)
db.session.add(appointment)
db.session.commit()

# ADD THIS (passes parent's user_id to distinguish parent-booking context):
notify_appointment_created(appointment, current_user_id)
```

**Point 2: Parent Reschedules Child's Appointment**
- **Same as appointments.py PUT /<id> integration**
- **Integration Code**:
```python
old_datetime = appointment.appointment_datetime
appointment.appointment_datetime = new_datetime
db.session.commit()

# ADD THIS:
notify_appointment_rescheduled(appointment, old_datetime)
```

**Point 3: Parent Cancels Child's Appointment**
- **Same as appointments.py DELETE /<id> integration**
- **Integration Code**:
```python
# ADD THIS BEFORE deletion:
notify_appointment_cancelled(appointment)

db.session.delete(appointment)
db.session.commit()
```

---

### 3. backend/app/routes/cycle_logs.py

**Import Statement (Top of File):**
```python
from app.services.cycle_notifications import (
    notify_cycle_prediction_updated,
    notify_period_late,
    notify_cycle_anomaly,
)
```

**Point 1: POST / - New Cycle Log Entry**
- **Trigger**: When cycle log is created and predictions are calculated
- **Current Location**: After CycleLog.query() and prediction calculation
- **Integration Code**:
```python
# After predictions are calculated:
next_period_date = calculated_prediction['next_date']
fertile_start = calculated_prediction['fertile_start']
fertile_end = calculated_prediction['fertile_end']
confidence = calculated_prediction['confidence']

# ADD THIS:
notify_cycle_prediction_updated(
    user_id=current_user_id,
    next_period_date=next_period_date,
    fertile_start=fertile_start,
    fertile_end=fertile_end,
    confidence=confidence
)
```

**Point 2: PUT /<id> - Update Cycle Log with Late Period Detection**
- **Trigger**: When updating a cycle log reveals period is >3 days late
- **Current Location**: In cycle log update logic where late period is detected
- **Integration Code**:
```python
# After detecting late period:
days_late = (datetime.now() - predicted_date).days
if days_late > 3:
    # ADD THIS:
    notify_period_late(
        user_id=current_user_id,
        predicted_date=predicted_date.strftime('%Y-%m-%d'),
        days_late=days_late
    )
```

**Point 3: PUT /<id> - Update with Anomaly Detection**
- **Trigger**: When cycle anomalies are detected (irregular patterns, etc.)
- **Current Location**: In anomaly detection logic
- **Integration Code**:
```python
# When anomaly is detected:
if anomaly_detected:
    # ADD THIS:
    notify_cycle_anomaly(
        user_id=current_user_id,
        anomaly_message='Period duration is unusually long',
        anomaly_type='unusually_long_period',
        severity_level='medium'  # 'low', 'medium', or 'high'
    )
```

---

### 4. backend/app/routes/settings.py

**Import Statement (Top of File):**
```python
from app.services.settings_notifications import (
    notify_parent_access_enabled,
    notify_parent_access_disabled,
)
```

**Point 1: PUT /privacy - Enable Parent Access**
- **Trigger**: When adolescent sets allow_parent_access=True
- **Current Location**: After User.allow_parent_access is updated to True
- **Integration Code**:
```python
# After user.allow_parent_access = True and commit:
db.session.commit()

# ADD THIS:
if user.user_type == 'adolescent':
    notify_parent_access_enabled(user.id)
```

**Point 2: PUT /privacy - Disable Parent Access**
- **Trigger**: When adolescent sets allow_parent_access=False
- **Current Location**: After User.allow_parent_access is updated to False
- **Integration Code**:
```python
# After user.allow_parent_access = False and commit:
db.session.commit()

# ADD THIS:
if user.user_type == 'adolescent':
    notify_parent_access_disabled(user.id)
```

---

### 5. backend/app/routes/health_provider.py

**Import Statement (Top of File):**
```python
from app.services.admin_notifications import (
    notify_provider_verified,
    notify_provider_verification_revoked,
)
```

**Point 1: Admin Verifies Provider**
- **Current Location**: When admin endpoint updates provider.is_verified=True
- **Integration Code**:
```python
# After provider is verified in admin flow:
provider_user_id = provider.user_id
db.session.commit()

# ADD THIS:
notify_provider_verified(provider_user_id)
```

**Point 2: Admin Revokes Provider Verification**
- **Current Location**: When admin endpoint updates provider.is_verified=False
- **Integration Code**:
```python
# After provider verification is revoked:
provider_user_id = provider.user_id
db.session.commit()

# ADD THIS:
notify_provider_verification_revoked(provider_user_id)
```

---

### 6. backend/app/routes/admin_complete.py (or admin.py)

**Import Statements (Top of File):**
```python
from app.services.admin_notifications import (
    notify_content_approved,
    notify_content_rejected,
    notify_new_provider_registration,
    notify_user_role_changed,
    notify_user_deactivated,
)
```

**Point 1: Admin Approves Content**
- **Trigger**: When admin sets content.status='approved'
- **Integration Code**:
```python
content.status = 'approved'
content.approved_by = current_user_id
db.session.commit()

# ADD THIS:
notify_content_approved(
    writer_user_id=content.created_by,
    content_title=content.title,
    content_id=content.id
)
```

**Point 2: Admin Rejects Content**
- **Trigger**: When admin sets content.status='rejected'
- **Integration Code**:
```python
content.status = 'rejected'
content.rejection_reason = request.json.get('reason')
db.session.commit()

# ADD THIS:
notify_content_rejected(
    writer_user_id=content.created_by,
    content_title=content.title,
    reason=content.rejection_reason,
    content_id=content.id
)
```

**Point 3: New Provider Registration Notification**
- **Trigger**: When new health_provider signs up
- **Current Location**: In auth.py register endpoint or health_provider POST endpoint
- **Integration Code**:
```python
# After new provider user is created:
new_provider_user = User(...)
db.session.add(new_provider_user)
db.session.commit()

# ADD THIS:
notify_new_provider_registration(new_provider_user.name)
```

**Point 4: Admin Changes User Role**
- **Trigger**: When admin updates user.user_type
- **Integration Code**:
```python
old_role = user.user_type
user.user_type = new_role
db.session.commit()

# ADD THIS:
notify_user_role_changed(user.id, new_role)
```

**Point 5: Admin Deactivates User**
- **Trigger**: When admin deactivates account (set is_active=False or delete)
- **Integration Code**:
```python
user.is_active = False
db.session.commit()

# ADD THIS:
notify_user_deactivated(user.id)
```

---

### 7. backend/app/routes/content_writer.py (or content.py)

**Import Statement (Top of File):**
```python
from app.services.content_writer_notifications import (
    notify_content_submitted,
)
```

**Point 1: Content Writer Submits Content**
- **Trigger**: When writer submits content for admin review
- **Current Location**: POST / endpoint where content.status='pending_review'
- **Integration Code**:
```python
content = Content(...)
content.status = 'pending_review'
content.created_by = current_user_id
db.session.add(content)
db.session.commit()

# ADD THIS:
notify_content_submitted(
    writer_user_id=current_user_id,
    content_title=content.title,
    content_id=content.id
)
```

---

## Integration Checklist

### Appointments Route
- [ ] Import all 4 notification functions
- [ ] Add notify_appointment_created() in POST /
- [ ] Add notify_appointment_rescheduled() in PUT /<id>
- [ ] Add notify_appointment_cancelled() in DELETE /<id>
- [ ] Add notify_appointment_confirmed() when provider claims
- [ ] Test with curl: Create → Reschedule → Cancel cycle

### Parent Appointments Route
- [ ] Import all 4 notification functions
- [ ] Add notify_appointment_created() for parent-booking context
- [ ] Add notify_appointment_rescheduled() in PUT /<id>
- [ ] Add notify_appointment_cancelled() in DELETE /<id>

### Cycle Logs Route
- [ ] Import all 3 notification functions
- [ ] Add notify_cycle_prediction_updated() after prediction calculation
- [ ] Add notify_period_late() when late period detected
- [ ] Add notify_cycle_anomaly() when anomalies detected

### Settings Route
- [ ] Import both privacy notification functions
- [ ] Add notify_parent_access_enabled() in PUT /privacy (True case)
- [ ] Add notify_parent_access_disabled() in PUT /privacy (False case)

### Health Provider Route
- [ ] Import both provider notification functions
- [ ] Add notify_provider_verified() when admin verifies
- [ ] Add notify_provider_verification_revoked() when admin revokes

### Admin Route
- [ ] Import all admin notification functions
- [ ] Add notify_content_approved() in content approval endpoint
- [ ] Add notify_content_rejected() in content rejection endpoint
- [ ] Add notify_new_provider_registration() in registration flow
- [ ] Add notify_user_role_changed() in role update endpoint
- [ ] Add notify_user_deactivated() in deactivation endpoint

### Content Writer Route
- [ ] Import content submission function
- [ ] Add notify_content_submitted() in POST /

---

## Testing Integration

### Unit Test Pattern
```python
def test_notification_on_appointment_creation():
    # Create appointment
    appointment = create_test_appointment()
    
    # Verify notification was created
    notification = Notification.query.filter_by(
        user_id=user_id,
        notification_type='appointment'
    ).first()
    
    assert notification is not None
    assert 'appointment' in notification.message.lower()
```

### Integration Test Pattern
```bash
# 1. Create appointment and verify notification
curl -X POST http://localhost:5001/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"appointment_datetime": "2025-12-15 10:00"}'

# 2. Query notifications
curl -X GET http://localhost:5001/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# 3. Verify notification appears in response
```

---

## Notes

1. **Error Handling**: Each helper function has try-except with logging. No need to add error handling at integration point.
2. **Subscription Checking**: NotificationManager automatically checks user subscriptions. Set `skip_subscription_check=True` only for critical notifications (account changes).
3. **Role-Specific Content**: Helpers automatically format messages appropriately for different user types. No need to customize.
4. **Real-Time Delivery**: NotificationManager attempts WebSocket delivery. Falls back gracefully if socket not connected.
5. **Database Consistency**: All helpers query fresh from DB. Safe to call immediately after commit.

---

## Progress Tracking

**Phase 3 Status**: 60% Complete
- ✅ All helper modules created (100%)
- ✅ All API endpoints added (100%)
- ⏳ Route integration (0% - ready to begin)

**Next Steps** (After Integration):
1. Phase 4: Background task for appointment reminders (24h, 2h)
2. Phase 8: Frontend notification store + WebSocket hook
3. Phase 9: Comprehensive verification test suite
