# Cycle Calendar Backend Connection Guide

## Overview
The Cycle Calendar component is fully connected to the backend API. This document explains the complete flow from frontend to backend.

## Frontend Components

### 1. CycleCalendar Component
**File**: `/frontend/src/components/CycleCalendar.tsx`
- **Type**: Client-side React component with `'use client'` directive
- **Props**:
  - `calendarData`: Calendar data object containing days and stats
  - `currentDate`: Current date being displayed
  - `onNavigateMonth`: Callback for month navigation
  - `onDayClick`: Optional callback for day clicks
  - `showInsights`: Toggle for insights view

### 2. Dashboard Integration
**File**: `/frontend/src/app/dashboard/page.tsx`
- **State**: `calendarData` managed with `useState`
- **Loading Function**: `loadCalendarData(year?, month?)`
- **Trigger**: Loads when `user` is available and `activeTab === 'cycle'`

## API Layer

### Frontend API Call
**File**: `/frontend/src/api/index.js`
```javascript
cycleAPI.getCalendarData: (year, month) => 
  api.get(`/api/cycle-logs/calendar?year=${year}&month=${month}`)
```

## Backend Endpoint

### Authenticated Endpoint
**Route**: `GET /api/cycle-logs/calendar`
**File**: `/backend/app/routes/cycle_logs.py` (line 262)
**Authentication**: JWT Required

#### Query Parameters:
- `year`: Year (defaults to current year)
- `month`: Month (1-12, defaults to current month)

#### Response Format:
```json
{
  "year": 2025,
  "month": 11,
  "month_name": "November",
  "days": [
    {
      "date": "2025-10-26",
      "day_of_month": 26,
      "is_current_month": false,
      "is_today": false,
      "is_period_day": false,
      "is_period_start": false,
      "is_period_end": false,
      "is_ovulation_day": false,
      "is_fertility_day": false,
      "flow_intensity": null,
      "symptoms": [],
      "notes": null
    },
    ...
  ],
  "stats": {
    "total_logs": 5,
    "average_cycle_length": 28,
    "next_predicted_period": "2025-11-15"
  }
}
```

## Data Flow

1. **Dashboard Loads** → User authenticated with JWT token
2. **activeTab === 'cycle'** → Triggers `loadCalendarData()`
3. **Frontend Calls API** → `GET /api/cycle-logs/calendar?year=2025&month=11`
4. **Backend Processes** →
   - Fetches all CycleLog records for authenticated user
   - Calculates average cycle length
   - Builds calendar grid with proper flags
   - Predicts future periods based on average cycle length
5. **Backend Returns** → Calendar data JSON
6. **Frontend Updates State** → Sets `calendarData`
7. **Component Re-renders** → Calendar displays with populated days

## Key Features

### Period Tracking
- Sets `is_period_day`, `is_period_start`, `is_period_end` based on logged cycle start/end dates
- Includes `flow_intensity` and `symptoms` from cycle logs

### Fertility Prediction
- Calculates ovulation day as mid-cycle point
- Marks fertile window ±2 days from ovulation
- Predicts future cycles up to 3 months ahead

### Smart Predictions
- Uses average cycle length to predict future periods
- If no logs exist, defaults to 28-day cycle
- Recalculates predictions when new logs are added

## Test Endpoint

For testing without authentication:
**Route**: `GET /api/cycle-logs/test/calendar`
**Parameters**: `user_id`, `year`, `month`

## Troubleshooting

### Calendar Empty (No Data)
1. Check if user has any cycle logs recorded
2. Verify API is returning data: Check browser DevTools Network tab
3. Verify backend is running on `http://localhost:5001`
4. Check JWT token is valid in localStorage

### Data Not Matching
1. Ensure backend returns correct field names (prefixed with `is_`)
2. Verify cycle logs were created with correct start_date/end_date
3. Check symptoms are properly formatted in backend (comma-separated string)

### Loading Forever
1. Check network request in browser DevTools
2. Verify API endpoint is accessible
3. Check for CORS issues in browser console
4. Ensure JWT token is not expired

## Recent Fixes Applied

1. **SSR Hydration Fix**: Moved style injection to useEffect hook
2. **Grid Layout Fix**: Changed calendar-week from flexbox to CSS Grid
3. **Client-side Marker**: Added `'use client'` directive for proper Next.js handling
4. **Backend Field Names**: Ensured all fields prefixed with `is_` (e.g., `is_period_day`)

## Next Steps

- Add ability to manually predict cycle length
- Implement symptom tracking with custom symptoms
- Add cycle phase indicators with color coding
- Integrate fertility predictions with appointment booking
