# Testing Guide - Cycle Log Child Association Fix

## Prerequisites
- Backend running on `http://localhost:5001`
- Frontend running on `http://localhost:3000`
- Parent account with at least one child created
- Browser dev tools open (for monitoring requests)

---

## Test Case 1: Verify Cycle Log Created for Child (Not Parent)

### Setup
1. Log in as **PARENT**
2. Navigate to parent dashboard
3. Select a child from the children list
4. Click on "Log Cycle" tab

### Actions
1. Fill in the cycle details:
   - **Start Date:** Any date in the past (e.g., 2025-10-20)
   - **End Date:** 5 days later (e.g., 2025-10-25)
   - **Cycle Length:** 28
   - **Period Length:** 5
   - **Symptoms:** cramps, bloating
   - **Notes:** Test cycle from parent dashboard

2. Click "Log Cycle" button

### Expected Results

**Immediate (Parent View):**
- ✅ Success notification appears: "Cycle logged successfully for [ChildName]!"
- ✅ Form clears
- ✅ No errors displayed

**Browser Network Tab:**
- ✅ POST request to `/api/parents/children/{childId}/cycle-logs`
- ✅ Response: `201 Created`
- ✅ Response body: `{"message": "Cycle log created successfully for child", "id": 123}`

**Child Monitoring Tab (Parent View):**
- ✅ Cycle appears in child's cycle history
- ✅ Cycle details match what was logged

### Verification Steps

**From Parent Account:**
1. Click "Monitor" tab for the same child
2. Look for the logged cycle in the cycle logs section
3. Verify start date, end date, symptoms match

**From Child Account:**
1. Log out as parent
2. Log in as the **CHILD**
3. Navigate to dashboard
4. Go to "Cycle" or "Health" section
5. ✅ The cycle logged by parent should appear here
6. ✅ Check notifications - should have received prediction about next cycle

---

## Test Case 2: Verify Notifications Sent to Child

### Setup
1. Complete Test Case 1
2. Still logged in as parent

### Actions
1. Log out as parent
2. Log in as the **CHILD**
3. Navigate to notifications section

### Expected Results
- ✅ Child receives notification: "Your next period is predicted to start on [date]"
- ✅ Notification type is "cycle"
- ✅ Prediction date = start_date + cycle_length (28 days)

**Example:**
- Logged cycle start: Oct 20, 2025
- Cycle length: 28 days
- Expected next period: Nov 17, 2025
- Notification: "Your next period is predicted to start on 2025-11-17"

---

## Test Case 3: Verify Parent-Child Relationship Validation

### Setup
1. Have two parent accounts created
2. Parent A has child C
3. Parent B does NOT have child C

### Actions (Do NOT actually perform this if not testing security)
1. Log in as Parent B
2. Try to make a request to:
   ```
   POST /api/parents/children/{C's_adolescent_id}/cycle-logs
   ```

### Expected Results
- ✅ Error response: `404 Not Found`
- ✅ Error message: "Child not found or not associated with this parent"
- ❌ No cycle log created

---

## Test Case 4: Verify Data Persistence

### Setup
1. Logged in as child account
2. View the cycle logged in Test Case 1

### Actions
1. Refresh the page
2. Navigate away and back to cycle logs
3. Check cycle calendar view

### Expected Results
- ✅ Cycle still appears after refresh
- ✅ Cycle appears in calendar view
- ✅ All details (start, end, symptoms) are preserved

---

## Test Case 5: Verify API Error Handling

### Test 5A: Missing Required Field

**Actions:**
- Send POST to `/api/parents/children/{id}/cycle-logs`
- Without `start_date` field

**Expected Result:**
```json
{
  "message": "Start date is required"
}
```
**HTTP Status:** 400 Bad Request

### Test 5B: Invalid Date Format

**Actions:**
- Send POST with `start_date: "not-a-date"`

**Expected Result:**
```json
{
  "message": "Invalid date format: ..."
}
```
**HTTP Status:** 400 Bad Request

### Test 5C: Not a Parent Account

**Actions:**
1. Create/use an adolescent account
2. Try to POST to `/api/parents/children/{id}/cycle-logs`

**Expected Result:**
```json
{
  "message": "Only parent accounts can access this endpoint"
}
```
**HTTP Status:** 403 Forbidden

---

## Test Case 6: Verify Monitoring Dashboard Shows Child's Data

### Setup
1. Log in as parent
2. Select a child
3. Click "Monitor" tab

### Expected Results
**Cycle Section Should Show:**
- ✅ The cycle logged by parent
- ✅ Cycle statistics calculated correctly
- ✅ Next period prediction displayed
- ✅ Latest period date shown

**Sample Data:**
```
Latest Period: Oct 20, 2025
Next Period: Nov 17, 2025
Average Cycle: 28 days
Average Period: 5 days
Total Logs: 1
```

---

## Debugging Checklist

If tests fail, check the following:

### Backend Issues
- [ ] Verify parent route handler exists at `/api/parents/children/<id>/cycle-logs`
- [ ] Check console for Python errors
- [ ] Verify JWT token is valid
- [ ] Check database for created CycleLog records
- [ ] Verify `CycleLog.user_id` matches child's user ID (not parent's)

### Frontend Issues
- [ ] Check browser console for JavaScript errors
- [ ] Verify fetch URL includes child ID: `/api/parents/children/{childId}/cycle-logs`
- [ ] Check that token is being sent in Authorization header
- [ ] Verify response status code (should be 201)

### Database Verification
```sql
-- Check that cycle log is associated with child
SELECT cl.id, cl.user_id, u.name, u.user_type 
FROM cycle_logs cl
JOIN users u ON cl.user_id = u.id
ORDER BY cl.created_at DESC LIMIT 5;

-- Should show:
-- id | user_id | name          | user_type
-- 42 | 10      | Emma Teen     | adolescent   ✅ (NOT parent)
```

---

## Success Criteria

All of the following must be true:

✅ Cycle log created successfully  
✅ Cycle associated with **child's user ID** (not parent's)  
✅ Cycle appears in child's account when they log in  
✅ Child receives notification about next cycle  
✅ Cycle appears in parent's monitoring view  
✅ All data persists after refresh  
✅ Error handling works correctly  
✅ Parent-child relationship validation works  

---

## Performance Expectations

- Response time: < 500ms
- No console errors
- No database connection issues
- Notification created immediately after cycle log

---

## Regression Testing

After fix, verify these still work:

1. **Adolescent can still log their own cycles**
   - User logs in as adolescent
   - Logs cycle via personal dashboard
   - Cycle appears in their account ✅

2. **Cycle stats still calculate correctly**
   - View cycle statistics
   - Average cycle/period calculated
   - Predictions accurate ✅

3. **Calendar view still works**
   - View cycle calendar
   - Period days highlighted correctly
   - Fertility window shown ✅

4. **Notifications still sent to correct user**
   - Adolescent logs cycle
   - Adolescent receives notification ✅

