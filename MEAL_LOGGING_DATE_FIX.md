# Meal Logging Date Format Fix

## Issue
When logging meals, the backend returned error:
```
Invalid date format: Invalid isoformat string: '10:46'
```

## Root Cause
The `meal_logs.py` endpoint was only accepting **full ISO datetime format** (e.g., `2025-11-06T10:46:00`) but the frontend was sending only **time format** (e.g., `10:46`).

The endpoint tried to parse `'10:46'` with `datetime.fromisoformat()` which expects a complete datetime string, causing the error.

## Solution
Updated both CREATE and UPDATE endpoints in `/backend/app/routes/meal_logs.py` to handle multiple date/time formats:

### Supported Formats (in order of priority):

1. **Full ISO DateTime** (Preferred)
   ```
   2025-11-06T10:46:00
   2025-11-06T10:46:00+00:00
   2025-11-06T10:46:00Z
   ```

2. **Time Only (HH:MM:SS)**
   ```
   10:46:30
   ```
   → Uses today's date + provided time

3. **Time Only (HH:MM)**
   ```
   10:46
   ```
   → Uses today's date + provided time

### How It Works

```python
# The endpoint now tries to parse in this order:

1. Try full ISO datetime format
   meal_time = datetime.fromisoformat(meal_time_str)
   
2. If that fails, try HH:MM:SS format
   time_obj = datetime.strptime(meal_time_str, '%H:%M:%S').time()
   meal_time = datetime.combine(today, time_obj)
   
3. If that fails, try HH:MM format
   time_obj = datetime.strptime(meal_time_str, '%H:%M').time()
   meal_time = datetime.combine(today, time_obj)
   
4. If all fail, return error with clear message
```

## Files Changed
- `/backend/app/routes/meal_logs.py`
  - `create_meal_log()` function (POST endpoint)
  - `update_meal_log()` function (PUT endpoint)

## Testing

### Test 1: Send Time Only (Original Issue)
```bash
curl -X POST http://localhost:5001/api/meal-logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meal_type": "breakfast",
    "meal_time": "10:46",
    "description": "Oatmeal with berries",
    "calories": 350,
    "protein": 12,
    "carbs": 55,
    "fat": 8
  }'
```

Expected Response:
```json
{
  "message": "Meal log created successfully",
  "id": 1
}
```

### Test 2: Send Full ISO DateTime
```bash
curl -X POST http://localhost:5001/api/meal-logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meal_type": "lunch",
    "meal_time": "2025-11-06T12:30:00",
    "description": "Chicken salad",
    "calories": 450
  }'
```

### Test 3: Update with Time Only
```bash
curl -X PUT http://localhost:5001/api/meal-logs/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meal_time": "11:00"
  }'
```

## Backend Restart Required

Kill the existing backend process and restart:

```bash
pkill -f "python.*run.py"
cd /home/desire/My_Project/ladys_essenced/backend
python run.py
```

Wait for output:
```
Running on http://localhost:5001
```

## Frontend Compatibility

The fix is **backward compatible**:
- Existing code sending full ISO datetime will continue to work
- New code can send just the time (HH:MM or HH:MM:SS)
- The API intelligently detects the format and handles it appropriately

## Error Messages

If an unsupported format is sent, the error message clearly explains acceptable formats:

```json
{
  "message": "Invalid date format: Invalid time format: '25:99'. Expected ISO datetime (2025-11-06T10:46:00) or time format (10:46 or 10:46:30)"
}
```

## Summary

✅ **Before**: Only full ISO datetime accepted → `'10:46'` → Error  
✅ **After**: Multiple formats accepted → `'10:46'` or `'2025-11-06T10:46:00'` → Works!

