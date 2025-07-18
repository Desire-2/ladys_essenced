# Enhanced Health Provider Availability System

## Overview

This document describes the enhanced health provider availability system that has been implemented to improve appointment scheduling in the Lady's Essence application. The system provides real-time availability checking, intelligent slot finding, and comprehensive availability summaries.

## Key Features

### 1. Real-time Availability Checking
- Providers can set detailed weekly schedules with specific hours
- System checks for conflicting appointments in real-time
- Availability is calculated based on 30-minute time slots

### 2. Intelligent Next Available Slot Finding
- Automatically finds the next available appointment slot for any provider
- Looks ahead up to 14 days (configurable)
- Considers provider's weekly schedule and existing appointments
- Returns formatted availability information for easy display

### 3. Comprehensive Availability Summaries
- Weekly schedule patterns for each provider
- Day-by-day availability for the next 7 days
- Slot availability percentages
- Visual indicators for availability status

### 4. Enhanced User Experience
- Color-coded availability status
- Smart suggestions based on availability
- Real-time availability updates
- Detailed provider information display

## Technical Implementation

### Backend Enhancements

#### New API Endpoints

1. **Get Next Available Slot**
   ```
   GET /api/appointments/providers/{provider_id}/next-available
   ```
   - Parameters: `days_ahead` (default: 14), `duration` (default: 30)
   - Returns the next available time slot for the specified provider

2. **Get Availability Summary**
   ```
   GET /api/appointments/providers/{provider_id}/availability-summary
   ```
   - Parameters: `days_ahead` (default: 7)
   - Returns comprehensive availability information for the next period

3. **Enhanced Time Slots**
   ```
   GET /api/appointments/providers/{provider_id}/slots?date={date}
   ```
   - Enhanced to include conflict checking and preference scoring

#### Database Schema

The `HealthProvider` model includes an `availability_hours` field that stores JSON data:

```json
{
  "monday": {
    "day": "monday",
    "start_time": "09:00",
    "end_time": "17:00",
    "is_available": true
  },
  "tuesday": {
    "day": "tuesday",
    "start_time": "09:00",
    "end_time": "17:00",
    "is_available": true
  },
  // ... other days
}
```

### Frontend Enhancements

#### Enhanced `findNextAvailableSlot` Function

The function has been enhanced to:
- Make API calls to get real availability data
- Fall back to intelligent mock logic if API fails
- Parse provider availability hours
- Return formatted, user-friendly text

```typescript
const findNextAvailableSlot = async (provider: any): Promise<string> => {
  try {
    // API call to get real availability
    const response = await appointmentAPI.getNextAvailableSlot(provider.id, 14, 30);
    
    if (response.data.next_available_slot) {
      const slot = response.data.next_available_slot;
      // Format date nicely (Today, Tomorrow, or specific date)
      return formatSlotDate(slot);
    }
  } catch (error) {
    // Fall back to intelligent mock logic
    return fallbackAvailabilityLogic(provider);
  }
}
```

#### New React Hook: `useEnhancedAvailability`

Provides a clean interface for availability operations:
- `getNextAvailableSlot(providerId, daysAhead, duration)`
- `getAvailabilitySummary(providerId, daysAhead)`
- `getTimeSlots(providerId, date)`
- State management for loading and error states

#### New Component: `ProviderAvailabilityDisplay`

A reusable component that displays:
- Next available slot information
- Weekly schedule patterns
- Upcoming availability calendar
- Availability statistics

### UI/UX Improvements

#### Provider Cards Enhancement

Provider cards now display:
- **Next Available Slot**: Real-time next available appointment
- **Color-coded Status**: Green for today, blue for tomorrow, yellow for limited
- **Availability Summary**: Brief overview of weekly availability
- **Enhanced Details**: Expanded information on demand

#### Smart Suggestions

The system provides intelligent recommendations:
- Top-rated available providers
- Optimal appointment dates
- Preferred time slots
- Reasoning for suggestions

## Setup and Configuration

### 1. Database Setup

Ensure the `availability_hours` column exists in the `health_providers` table:

```sql
ALTER TABLE health_providers ADD COLUMN availability_hours TEXT;
```

### 2. Seed Availability Data

Run the availability seeding script to populate providers with realistic schedules:

```bash
cd backend
python seed_provider_availability.py
```

This script creates various schedule patterns:
- **Weekday Standard**: Monday-Friday 9-5
- **Extended Hours**: Monday-Friday 8-6, Saturday 9-2
- **Weekend Available**: Includes weekend hours
- **Part Time**: Morning hours only
- **Flexible Schedule**: Varying daily hours

### 3. Frontend Integration

Import and use the enhanced availability components:

```typescript
import { useEnhancedAvailability } from '../hooks/useEnhancedAvailability';
import ProviderAvailabilityDisplay from '../components/ProviderAvailabilityDisplay';

// In your component
const { getNextAvailableSlot, formatAvailabilityDisplay } = useEnhancedAvailability();
```

### 4. API Integration

Update your appointment API service to include the new endpoints:

```javascript
export const appointmentAPI = {
  // ... existing methods
  getNextAvailableSlot: (providerId, daysAhead = 14, duration = 30) => 
    api.get(`/api/appointments/providers/${providerId}/next-available?days_ahead=${daysAhead}&duration=${duration}`),
  getProviderAvailabilitySummary: (providerId, daysAhead = 7) => 
    api.get(`/api/appointments/providers/${providerId}/availability-summary?days_ahead=${daysAhead}`),
};
```

## Testing

### Automated Testing

Run the comprehensive test suite:

```bash
python test_enhanced_availability.py
```

This tests:
- Provider availability retrieval
- Next available slot finding
- Availability summary generation
- Time slot generation for specific dates

### Manual Testing

1. **Provider Setup**: Ensure providers have availability_hours configured
2. **Availability Display**: Check that next available slots show correctly
3. **Real-time Updates**: Verify availability updates when appointments are booked
4. **Error Handling**: Test with providers that have no availability set

## Performance Considerations

### Caching Strategy

Consider implementing caching for:
- Provider availability summaries (cache for 1 hour)
- Next available slots (cache for 15 minutes)
- Time slot calculations (cache for 30 minutes)

### Database Optimization

- Index the `provider_id` and `appointment_date` columns in the appointments table
- Consider using database views for common availability queries
- Implement pagination for large provider lists

## Future Enhancements

### 1. Advanced Scheduling Features
- Recurring appointment availability
- Buffer time between appointments
- Special availability for emergency appointments
- Holiday and vacation scheduling

### 2. Provider Self-Service
- Provider dashboard for managing availability
- Temporary schedule overrides
- Availability notifications

### 3. Patient Preferences
- Preferred time slot learning
- Provider preference tracking
- Automatic rebooking suggestions

### 4. Integration Features
- Calendar system integration
- SMS/Email availability notifications
- Waitlist management for popular slots

## Troubleshooting

### Common Issues

1. **"No availability found"**
   - Check if provider has `availability_hours` set
   - Verify provider is marked as `is_verified = true`
   - Ensure dates are within the lookup range

2. **Slow availability calculations**
   - Check for missing database indexes
   - Consider implementing caching
   - Optimize query performance

3. **Incorrect time zones**
   - Ensure consistent timezone handling
   - Convert times to user's local timezone
   - Consider daylight saving time changes

### Debug Mode

Enable debug logging in the backend:

```python
import logging
logging.getLogger('availability').setLevel(logging.DEBUG)
```

## Conclusion

The enhanced availability system provides a robust foundation for intelligent appointment scheduling. It balances real-time accuracy with performance optimization, while providing a superior user experience through smart suggestions and comprehensive availability information.

The system is designed to be scalable and extensible, with clear separation of concerns between data management, business logic, and user interface components.
