# Child Appointment Booking - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the parent-child appointment booking enhancement to the Lady's Essence application.

---

## Files Created/Modified

### Backend Files

#### 1. **New File:** `/backend/app/routes/parent_appointments.py`
**Status:** ✅ Created  
**Purpose:** Handles all parent-related appointment endpoints  
**Key Endpoints:**
- `GET /parent/children` - Get list of parent's children
- `GET /parent/children/<child_id>/details` - Get child details
- `POST /parent/book-appointment-for-child` - Book appointment for child
- `GET /parent/children/<child_id>/appointments` - Get child's appointments
- `POST /parent/appointments/<id>/cancel` - Cancel appointment
- `POST /parent/appointments/<id>/reschedule` - Reschedule appointment

#### 2. **Modified File:** `/backend/app/models/__init__.py`
**Status:** ⏳ Pending  
**Changes Required:**
```python
# Add new fields to Appointment model
class Appointment(db.Model):
    # ... existing fields ...
    
    # NEW FIELDS
    booked_for_child = db.Column(db.Boolean, default=False)
    parent_consent_date = db.Column(db.DateTime, nullable=True)
    is_telemedicine = db.Column(db.Boolean, default=False)
    payment_method = db.Column(db.String(50), nullable=True)
    duration_minutes = db.Column(db.Integer, default=30)
    consultation_fee = db.Column(db.Float, nullable=True)
    location_notes = db.Column(db.Text, nullable=True)
```

#### 3. **Modified File:** `/backend/app/__init__.py`
**Status:** ⏳ Pending  
**Changes Required:**
```python
# Register the new blueprint
from app.routes.parent_appointments import parent_appointments_bp
app.register_blueprint(parent_appointments_bp)
```

### Frontend Files

#### 1. **New File:** `/frontend/src/components/parent/ChildAppointmentBooking.tsx`
**Status:** ✅ Created  
**Purpose:** Main component for booking appointments for children  
**Features:**
- Child selector
- Provider search
- Date/time selection
- Appointment details form
- Booking confirmation

#### 2. **New File:** `/frontend/src/services/parentAppointments.ts`
**Status:** ✅ Created  
**Purpose:** Service for API calls related to parent appointments  
**Key Methods:**
- `getParentChildren()` - Fetch children list
- `bookAppointmentForChild()` - Book appointment
- `getChildAppointments()` - Get child's appointments
- `cancelAppointment()` - Cancel appointment
- `rescheduleAppointment()` - Reschedule appointment

#### 3. **New File:** `/frontend/src/styles/child-appointment-booking.css`
**Status:** ✅ Created  
**Purpose:** Styling for child appointment booking component

#### 4. **Modified File:** `/frontend/src/app/dashboard/parent/page.tsx`
**Status:** ⏳ Pending  
**Changes Required:**
```typescript
// Add import
import ChildAppointmentBooking from '@/components/parent/ChildAppointmentBooking';

// Add new tab state
const [activeTab, setActiveTab] = useState<'overview' | 'children-health' | 'settings'>('overview');

// Add new tab in JSX
{activeTab === 'children-health' && (
  <ChildAppointmentBooking 
    user={user}
    onBookingSuccess={handleBookingSuccess}
    onError={handleError}
  />
)}
```

#### 5. **Modified File:** `/frontend/src/types/appointments.ts`
**Status:** ⏳ Pending  
**Changes Required:**
```typescript
export interface ChildAppointmentBooking extends AppointmentBookingData {
  childId: number;
  childName: string;
  bookedForChild: true;
  parentConsent: boolean;
}

export interface ChildHealthSummary {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  lastAppointment?: Appointment;
}
```

---

## Database Migration

### Required SQL Changes

```sql
-- Add new columns to appointments table
ALTER TABLE appointments ADD COLUMN booked_for_child BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN parent_consent_date DATETIME;
ALTER TABLE appointments ADD COLUMN is_telemedicine BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN payment_method VARCHAR(50);
ALTER TABLE appointments ADD COLUMN duration_minutes INTEGER DEFAULT 30;
ALTER TABLE appointments ADD COLUMN consultation_fee FLOAT;
ALTER TABLE appointments ADD COLUMN location_notes TEXT;

-- Create indices for better query performance
CREATE INDEX idx_booked_for_child ON appointments(booked_for_child);
CREATE INDEX idx_parent_consent ON appointments(parent_consent_date);
CREATE INDEX idx_user_for_appointment ON appointments(for_user_id, status);

-- Add columns to parent_children table (if needed)
ALTER TABLE parent_children ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
```

### Migration File Creation

**Create:** `/backend/app/migrations/versions/add_child_appointment_fields.py`

```python
"""Add child appointment booking fields

Revision ID: xxxxx
Revises: 
Create Date: 2024-01-XX

"""
from alembic import op
import sqlalchemy as sa

revision = 'xxxxx'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns
    op.add_column('appointments', sa.Column('booked_for_child', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('appointments', sa.Column('parent_consent_date', sa.DateTime(), nullable=True))
    op.add_column('appointments', sa.Column('is_telemedicine', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('appointments', sa.Column('payment_method', sa.String(50), nullable=True))
    op.add_column('appointments', sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='30'))
    op.add_column('appointments', sa.Column('consultation_fee', sa.Float(), nullable=True))
    op.add_column('appointments', sa.Column('location_notes', sa.Text(), nullable=True))

def downgrade():
    # Remove columns
    op.drop_column('appointments', 'location_notes')
    op.drop_column('appointments', 'consultation_fee')
    op.drop_column('appointments', 'duration_minutes')
    op.drop_column('appointments', 'payment_method')
    op.drop_column('appointments', 'is_telemedicine')
    op.drop_column('appointments', 'parent_consent_date')
    op.drop_column('appointments', 'booked_for_child')
```

---

## Implementation Steps

### Phase 1: Database & Backend (Day 1-2)

1. **Create Database Migration**
   ```bash
   cd backend
   flask db migrate -m "Add child appointment booking fields"
   flask db upgrade
   ```

2. **Update Models**
   - Edit `/backend/app/models/__init__.py`
   - Add new fields to `Appointment` model
   - Run tests: `pytest app/tests/test_models.py`

3. **Verify Backend Routes**
   ```bash
   # Test endpoints with curl or Postman
   curl -H "Authorization: Bearer <token>" http://localhost:5000/api/parent/children
   ```

### Phase 2: Frontend Components (Day 3-4)

1. **Integrate ChildAppointmentBooking Component**
   - Files already created and ready
   - Update parent dashboard to include component

2. **Add to Parent Dashboard**
   - Edit `/frontend/src/app/dashboard/parent/page.tsx`
   - Add tab for "Children's Health"
   - Import and render `ChildAppointmentBooking`

3. **Test Component Rendering**
   ```bash
   npm run dev
   # Navigate to parent dashboard
   ```

### Phase 3: Integration & Testing (Day 5)

1. **End-to-End Testing**
   - Test full booking flow
   - Verify notifications sent
   - Check database records

2. **Performance Testing**
   - Test with multiple children
   - Load testing on appointments query
   - Cache effectiveness

3. **Security Testing**
   - Verify parent-child authorization
   - Test access control
   - Validate input sanitization

---

## API Endpoint Reference

### Get Parent's Children

**Endpoint:** `GET /api/parent/children`  
**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "children": [
    {
      "id": 1,
      "user_id": 5,
      "name": "Emma",
      "email": "emma@example.com",
      "relationship_type": "daughter",
      "date_of_birth": "2010-05-15",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total_children": 1
}
```

### Book Appointment for Child

**Endpoint:** `POST /api/parent/book-appointment-for-child`  
**Authentication:** Required  
**Request Body:**
```json
{
  "provider_id": 1,
  "child_id": 2,
  "appointment_date": "2024-01-20T14:30:00Z",
  "issue": "Regular checkup",
  "appointment_type_id": 1,
  "priority": "normal",
  "notes": "Annual health checkup",
  "is_telemedicine": false
}
```
**Response:**
```json
{
  "success": true,
  "message": "Appointment booked successfully for Emma",
  "appointment": {
    "id": 123,
    "for_user_id": 5,
    "child_name": "Emma",
    "provider_id": 1,
    "appointment_date": "2024-01-20T14:30:00Z",
    "status": "pending",
    "booked_for_child": true
  }
}
```

### Get Child's Appointments

**Endpoint:** `GET /api/parent/children/<child_id>/appointments`  
**Authentication:** Required  
**Query Parameters:**
- `status` - Filter by status (optional)
- `date_from` - Start date YYYY-MM-DD (optional)
- `date_to` - End date YYYY-MM-DD (optional)

**Response:**
```json
{
  "success": true,
  "child": {
    "id": 2,
    "name": "Emma"
  },
  "appointments": [
    {
      "id": 123,
      "appointment_date": "2024-01-20T14:30:00Z",
      "issue": "Regular checkup",
      "status": "confirmed",
      "provider": {
        "id": 1,
        "name": "Dr. Smith",
        "specialization": "General Practice"
      }
    }
  ]
}
```

---

## Testing Checklist

### Backend Tests

- [ ] Authorization - Parent can only access own children
- [ ] Child validation - Cannot book for non-existent child
- [ ] Provider availability - Checks provider is available
- [ ] Time slot conflicts - Detects overlapping appointments
- [ ] Notifications - Sent to provider and parent
- [ ] Cancel appointment - Only within 24 hours
- [ ] Reschedule - Validates new time availability
- [ ] Database - Records created correctly

### Frontend Tests

- [ ] Children list loads correctly
- [ ] Child selection works
- [ ] Provider search filters properly
- [ ] Date picker shows available dates
- [ ] Time slots load for selected date
- [ ] Form validation works
- [ ] Loading states display
- [ ] Error messages show clearly
- [ ] Success confirmation appears
- [ ] Responsive on mobile

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Backend routes registered
- [ ] Environment variables configured
- [ ] Frontend components built
- [ ] API endpoints tested
- [ ] Authorization verified
- [ ] Notifications configured
- [ ] Email templates created (if needed)
- [ ] Documentation updated
- [ ] Rollback plan prepared

---

## Configuration

### Environment Variables (Backend)

```bash
# Appointment settings
APPOINTMENT_ADVANCE_BOOKING_DAYS=30
APPOINTMENT_CANCELLATION_HOURS_BEFORE=24
APPOINTMENT_BUFFER_MINUTES=15
APPOINTMENT_DEFAULT_DURATION=30

# Notifications
SEND_APPOINTMENT_NOTIFICATIONS=true
NOTIFICATION_EMAIL_PROVIDER=true
NOTIFICATION_EMAIL_PARENT=true
```

### Feature Flags (Frontend)

```typescript
// In utils/featureFlags.ts
FEATURES = {
  'parent-child-appointments': true,
  'appointment-rescheduling': true,
  'appointment-cancellation': true,
  'appointment-reminders': true
}
```

---

## Troubleshooting

### Issue: "You do not have access to this child"

**Cause:** ParentChild relationship not found in database  
**Solution:** 
1. Verify parent-child relationship exists
2. Check database: `SELECT * FROM parent_children WHERE parent_id=X AND adolescent_id=Y;`
3. Use parent dashboard to link child if missing

### Issue: "Provider is not available at this time"

**Cause:** Provider availability not set up  
**Solution:**
1. Health provider must set their availability first
2. Check provider availability hours in database
3. Verify availability JSON format is correct

### Issue: Notifications not sending

**Cause:** Notification service not configured  
**Solution:**
1. Check notification settings in environment
2. Verify email configuration
3. Check logs for errors

### Issue: Child not appearing in list

**Cause:** Adolescent/ParentChild records missing  
**Solution:**
1. Create adolescent user for child
2. Link parent to child in parent_children table
3. Clear frontend cache

---

## Performance Optimization

### Caching Strategy

```typescript
// Frontend caching
- Children list: Cache for 5 minutes
- Child details: Cache for 10 minutes
- Appointments: Cache for 3 minutes
- Providers: Cache for 15 minutes
```

### Database Indices

```sql
-- Already included in migration
CREATE INDEX idx_booked_for_child ON appointments(booked_for_child);
CREATE INDEX idx_parent_consent ON appointments(parent_consent_date);
CREATE INDEX idx_user_for_appointment ON appointments(for_user_id, status);
```

### Query Optimization

```python
# Use eager loading to prevent N+1 queries
appointments = Appointment.query.options(
    joinedload(Appointment.health_provider).joinedload(HealthProvider.user),
    joinedload(Appointment.user)
).filter_by(for_user_id=child_id).all()
```

---

## Security Considerations

1. **Authorization**
   - Always verify parent-child relationship
   - Never trust child_id from client alone
   - Validate in middleware

2. **Data Privacy**
   - Child health data confidential
   - Only accessible to parent/provider/child (if age ≥ 16)
   - Audit trail for all access

3. **Input Validation**
   - Sanitize all text inputs
   - Validate date/time formats
   - Check file uploads if enabled

4. **Rate Limiting**
   - Limit appointment booking requests
   - Prevent appointment spam
   - Monitor suspicious patterns

---

## Future Enhancements

1. **SMS Reminders** - Appointment reminders via SMS
2. **Calendar Integration** - Export to Google Calendar/Outlook
3. **Waitlist** - Join waitlist for cancelled slots
4. **Video Consultations** - Integrated video call capability
5. **Prescription Management** - Digital prescriptions from provider
6. **Medical Records** - Upload/manage medical documents
7. **Insurance Integration** - Auto-fill insurance information
8. **Payment Processing** - In-app appointment payment

---

## Support & Documentation

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation
3. Check backend logs: `tail -f backend/logs/app.log`
4. Check browser console for frontend errors
5. Contact development team

---

## Version History

- **v1.0** (Jan 2024) - Initial implementation
  - Basic child appointment booking
  - Appointment cancellation/rescheduling
  - Parent-child authorization
