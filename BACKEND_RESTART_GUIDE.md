# 🚀 Backend Restart & Testing Instructions

## Quick Start

### 1. Kill Existing Backend Process
```bash
pkill -f "python.*run.py"
```

### 2. Start Backend
```bash
cd /home/desire/My_Project/ladys_essenced/backend
python run.py
```

### 3. Verify Backend is Running
```bash
curl http://localhost:5001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "message": "Lady's Essence API is running",
  "timestamp": "2025-11-06T..."
}
```

---

## Test Parent Adding Child

### Using Curl
```bash
curl -X POST http://localhost:5001/api/parents/children \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Child",
    "password": "child123",
    "relationship_type": "mother",
    "phone_number": "+250780784925"
  }'
```

### Expected Response (201)
```json
{
  "message": "Child added successfully",
  "child": {
    "id": 3,
    "user_id": 10,
    "name": "Test Child",
    "phone_number": "+250780784925",
    "date_of_birth": null,
    "relationship": "mother"
  }
}
```

---

## Test Logging Cycle for Child

### Using Curl
```bash
curl -X POST http://localhost:5001/api/parents/children/3/cycle-logs \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-10-20",
    "end_date": "2025-10-25",
    "cycle_length": 28,
    "period_length": 5,
    "symptoms": ["cramps", "bloating"],
    "notes": "Test cycle"
  }'
```

### Expected Response (201)
```json
{
  "message": "Cycle log created successfully for child",
  "id": 42
}
```

---

## How to Get JWT Token

### 1. Login as Parent
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+250780784924",
    "password": "parent123"
  }'
```

### 2. Extract Token from Response
```json
{
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 5,
    "name": "Mary Parent",
    "user_type": "parent"
  }
}
```

### 3. Use Token in Requests
```bash
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." ...
```

---

## Verify Database Changes

### Check if Child was Created
```sql
SELECT * FROM users WHERE user_type = 'adolescent' ORDER BY created_at DESC LIMIT 1;
```

**Expected Output:**
```
id | name | email | phone_number | user_type | created_at
10 | Test Child | testchild1730881234@ladysessence.local | +250780784925 | adolescent | 2025-11-06...
```

### Check if Cycle Log was Created
```sql
SELECT cl.id, cl.user_id, u.name, cl.start_date, cl.end_date 
FROM cycle_logs cl
JOIN users u ON cl.user_id = u.id
ORDER BY cl.created_at DESC LIMIT 1;
```

**Expected Output:**
```
id | user_id | name | start_date | end_date
42 | 10 | Test Child | 2025-10-20 | 2025-10-25
```

### Check if Notification was Created
```sql
SELECT * FROM notifications WHERE user_id = 10 ORDER BY created_at DESC LIMIT 1;
```

**Expected Output:**
```
id | user_id | message | notification_type | read | created_at
 1 |   10    | Your next period is predicted to start on 2025-11-17 | cycle | false | 2025-11-06...
```

---

## Frontend Testing

### 1. Refresh Frontend
```bash
# In browser: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
```

### 2. Login as Parent
- Use: parent@ladysessence.com or +250780784924
- Password: parent123

### 3. Add Child
- Go to "Add Child" tab
- Enter child details
- Click "Add Child"
- Verify child appears in list

### 4. Log Cycle for Child
- Select child from list
- Go to "Log Cycle" tab
- Enter cycle details
- Click "Log Cycle"
- Verify success message

### 5. Verify Data
- Go to "Monitor" tab
- Should see cycle in child's data
- Login as child to verify cycle appears

---

## Troubleshooting

### Issue: 404 Not Found for Cycle Logs Endpoint

**Solution:** Backend not restarted
```bash
pkill -f "python.*run.py"
cd /home/desire/My_Project/ladys_essenced/backend
python run.py
```

### Issue: Child Not Added to Database

**Solution:** Check backend logs for errors
```
Possible causes:
1. Missing JWT token
2. User not authenticated as parent
3. Invalid relationship type
4. Duplicate phone number
```

### Issue: Cycle Log 404

**Solution:** Check if child ID is correct
```bash
# Get all children
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:5001/api/parents/children

# Use correct adolescent_id from response
```

### Issue: Email Already Exists

**Solution:** Auto-generated email uses timestamp, so it should be unique
If error occurs, check for existing records:
```sql
SELECT * FROM users WHERE email LIKE '%@ladysessence.local%';
```

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────────┐
│ 1. BACKEND STARTUP                                      │
├─────────────────────────────────────────────────────────┤
│ pkill -f "python.*run.py"                              │
│ cd backend && python run.py                            │
│ Wait for: "Running on http://localhost:5001"           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. LOGIN AS PARENT                                      │
├─────────────────────────────────────────────────────────┤
│ Frontend: Login with parent credentials                │
│ Backend: Returns JWT token                             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. ADD CHILD                                            │
├─────────────────────────────────────────────────────────┤
│ POST /api/parents/children                             │
│ - Creates User (with auto-generated email)             │
│ - Creates Adolescent record                            │
│ - Creates ParentChild relationship                     │
│ - Returns: 201 Created                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. LOG CYCLE FOR CHILD                                 │
├─────────────────────────────────────────────────────────┤
│ POST /api/parents/children/{id}/cycle-logs             │
│ - Verifies parent-child relationship                   │
│ - Creates CycleLog with child's user_id               │
│ - Creates Notification for child                       │
│ - Returns: 201 Created                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. VERIFICATION                                         │
├─────────────────────────────────────────────────────────┤
│ Database: Child and cycle records present              │
│ Frontend: Data appears in monitoring                   │
│ Child Account: Cycle and notification visible          │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Checklist

- [ ] Backend starts without errors
- [ ] Health check returns 200
- [ ] Parent can login
- [ ] Child can be added
- [ ] Child appears in database
- [ ] Cycle can be logged
- [ ] Cycle appears in database
- [ ] Notification appears in database
- [ ] Data visible in frontend
- [ ] No 404 errors
- [ ] Response times < 500ms

---

**Ready to Test!** ✅

