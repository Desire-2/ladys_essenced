# 🧪 Cycle Prediction System - Testing Guide

## 🎯 Quick Start Testing

### Prerequisites
```bash
# Make sure backend is running
cd /home/desire/My_Project/ladys_essenced/backend
python3 run.py

# Get authentication token
TOKEN="your_jwt_token_here"
```

---

## 📋 Test Scenarios

### Scenario 1: User with No Data
**Expected**: Low confidence, encouragement to log more

```bash
# Login as a new user or user with <3 logs
curl -X GET "http://localhost:5000/api/cycle-logs/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "basic_stats": {
    "total_logs": 1,
    "data_points": 0
  },
  "predictions": [],
  "variability": null,
  "health_insights": [
    {
      "type": "info",
      "category": "data_quality",
      "message": "Log more cycles for more accurate predictions and insights.",
      "detail": "Current logs: 1, recommended: 6+"
    }
  ],
  "recommendation": "Log at least 6 cycles for highly accurate predictions"
}
```

---

### Scenario 2: User with Regular Cycles (6+ logs)
**Expected**: High confidence, detailed predictions

```bash
curl -X GET "http://localhost:5000/api/cycle-logs/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "basic_stats": {
    "average_cycle_length": 28.5,
    "weighted_cycle_length": 29.2,
    "total_logs": 6,
    "current_cycle_phase": "follicular"
  },
  "predictions": [
    {
      "cycle_number": 1,
      "confidence": "high",
      "predicted_cycle_length": 29.2
    }
  ],
  "variability": {
    "variability": "very_regular",
    "coefficient_of_variation": 3.2
  },
  "health_insights": [
    {
      "type": "positive",
      "category": "cycle_regularity",
      "message": "Your cycles are very regular..."
    }
  ]
}
```

---

### Scenario 3: Get Personalized Insights

```bash
curl -X GET "http://localhost:5000/api/cycle-logs/insights" \
  -H "Authorization: Bearer $TOKEN"
```

**Check for:**
- ✅ Health insights array with observations
- ✅ Recommendations sorted by priority
- ✅ Educational tips
- ✅ Data quality score (0-100)
- ✅ Cycle characteristics

---

### Scenario 4: Get Future Predictions

```bash
# Get 6 months of predictions
curl -X GET "http://localhost:5000/api/cycle-logs/predictions?months=6" \
  -H "Authorization: Bearer $TOKEN"
```

**Check for:**
- ✅ Predictions array with 6 cycles
- ✅ Each prediction has confidence level
- ✅ Grouped by month
- ✅ Planning tips included

---

### Scenario 5: Enhanced Calendar View

```bash
# Get November 2025 calendar
curl -X GET "http://localhost:5000/api/cycle-logs/calendar?year=2025&month=11" \
  -H "Authorization: Bearer $TOKEN"
```

**Check each day object for:**
- ✅ `phase` field (menstrual/follicular/ovulation/luteal)
- ✅ `cycle_day` number
- ✅ `confidence` on predicted days
- ✅ `is_predicted` boolean
- ✅ `flow_intensity` on period days
- ✅ Accurate ovulation and fertile window marking

---

### Scenario 6: Parent Viewing Child Data

```bash
# Parent token viewing child user_id=55
curl -X GET "http://localhost:5000/api/cycle-logs/stats?user_id=55" \
  -H "Authorization: Bearer $PARENT_TOKEN"
```

**Check for:**
- ✅ Same rich data as personal view
- ✅ Access control verified
- ✅ All features work with user_id parameter

---

### Scenario 7: Create Cycle Log with Auto-Calculation

```bash
curl -X POST "http://localhost:5000/api/cycle-logs/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-11-03T00:00:00",
    "end_date": "2025-11-07T00:00:00",
    "symptoms": ["cramps", "bloating"],
    "flow_intensity": "medium"
  }'
```

**Expected Response:**
```json
{
  "message": "Cycle log created successfully",
  "id": 123,
  "calculated_cycle_length": 29,
  "calculated_period_length": 5,
  "prediction": {
    "predicted_start": "2025-12-02T00:00:00",
    "confidence": "medium"
  },
  "data_quality": {
    "total_logs": 4,
    "has_enough_data": false,
    "recommendation": "Log at least 6 cycles for best predictions"
  }
}
```

---

## 🔍 Detailed Feature Testing

### Test 1: Weighted Average Calculation

**Setup**: Create 6 logs with cycle lengths [28, 27, 29, 28, 30, 29]

**Test**:
```bash
curl -X GET "http://localhost:5000/api/cycle-logs/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.basic_stats.weighted_cycle_length'
```

**Expected**: Should be closer to recent cycles (29-30) than simple average (28.5)

**Manual Calculation**:
```python
cycles = [28, 27, 29, 28, 30, 29]
weights = [1, 2, 4, 8, 16, 32]  # Exponential
weighted_avg = sum(c*w for c,w in zip(cycles, weights)) / sum(weights)
# Result: ~29.05 (more weight on recent 30 and 29)
```

---

### Test 2: Variability Classification

**Test Regular Cycles**: CV < 10%
```bash
# Cycles: [28, 28, 29, 28, 29, 28] (very consistent)
curl -X GET ".../stats" | jq '.variability.variability'
# Expected: "very_regular" or "regular"
```

**Test Irregular Cycles**: CV > 20%
```bash
# Cycles: [25, 32, 27, 35, 23, 31] (inconsistent)
curl -X GET ".../stats" | jq '.variability.variability'
# Expected: "irregular"
```

---

### Test 3: Confidence Level Logic

**High Confidence Test**:
```
Requirements:
✅ 6+ logs
✅ Variability: "very_regular" or "regular"
Expected: confidence = "high"
```

**Medium Confidence Test**:
```
Requirements:
✅ 3-5 logs
✅ Variability: not "irregular"
Expected: confidence = "medium"
```

**Low Confidence Test**:
```
Requirements:
❌ <3 logs OR
❌ Variability: "irregular"
Expected: confidence = "low"
```

---

### Test 4: Phase Determination

**Test Current Phase**:
```bash
curl -X GET "http://localhost:5000/api/cycle-logs/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.basic_stats.current_cycle_phase'
```

**Expected Logic**:
```
Days Since Period | Phase
0-5              | menstrual
6-13             | follicular
14-16            | ovulation
17-28            | luteal
```

---

### Test 5: Ovulation Calculation

**Formula**: Ovulation = Next Period Start - 14 days

**Test**:
```bash
# Check calendar for ovulation day
curl -X GET ".../calendar?year=2025&month=11" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.days[] | select(.is_ovulation_day == true)'
```

**Verify**:
- Ovulation should be ~14 days before next period
- Should NOT be on period days
- Should be in correct phase

---

### Test 6: Fertile Window

**Formula**: 5 days before ovulation to 1 day after

**Test**:
```bash
# Get all fertile days
curl -X GET ".../calendar?year=2025&month=11" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.days[] | select(.is_fertility_day == true) | .date'
```

**Verify**:
- Should be 6 consecutive days total
- Should include ovulation day ±1
- Should NOT be on period days

---

### Test 7: Health Insights Generation

**Test Irregular Cycle Warning**:
```bash
# User with CV > 20%
curl -X GET "http://localhost:5000/api/cycle-logs/insights" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.insights[] | select(.category == "cycle_regularity")'
```

**Expected**:
```json
{
  "type": "warning",
  "category": "cycle_regularity",
  "message": "Your cycles show high variability. Consider consulting a healthcare provider."
}
```

---

### Test 8: Symptom Pattern Analysis

**Setup**: Create logs with symptoms "cramps, bloating, headache"

**Test**:
```bash
curl -X GET ".../insights" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.symptom_patterns.common_symptoms'
```

**Expected**: Top 5 most frequent symptoms with counts

---

### Test 9: Phase-Specific Recommendations

**Test**:
```bash
curl -X GET ".../insights" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.recommendations[] | select(.category == "current_phase")'
```

**Expected**: Recommendations matching current cycle phase

---

### Test 10: Long-term Predictions

**Test**:
```bash
# Request 12 months of predictions
curl -X GET ".../predictions?months=12" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.total_predictions'
```

**Expected**: 12 predictions, confidence decreases for distant future

---

## 🐛 Error Handling Tests

### Test 1: Invalid Token
```bash
curl -X GET "http://localhost:5000/api/cycle-logs/stats" \
  -H "Authorization: Bearer invalid_token"
```
**Expected**: 401 Unauthorized

---

### Test 2: Parent Accessing Non-Child
```bash
curl -X GET "http://localhost:5000/api/cycle-logs/stats?user_id=999" \
  -H "Authorization: Bearer $PARENT_TOKEN"
```
**Expected**: 403 Forbidden

---

### Test 3: Invalid Date Format
```bash
curl -X POST "http://localhost:5000/api/cycle-logs/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"start_date": "invalid-date"}'
```
**Expected**: 400 Bad Request

---

### Test 4: Missing Required Fields
```bash
curl -X POST "http://localhost:5000/api/cycle-logs/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected**: 400 Bad Request, "Start date is required"

---

## 📊 Performance Tests

### Test 1: Large Dataset
```bash
# User with 50+ cycle logs
time curl -X GET "http://localhost:5000/api/cycle-logs/stats" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected**: Response < 500ms

---

### Test 2: Calendar Generation
```bash
# Full month calendar with predictions
time curl -X GET ".../calendar?year=2025&month=11" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected**: Response < 1 second

---

### Test 3: Multiple Predictions
```bash
# 12 months of predictions
time curl -X GET ".../predictions?months=12" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected**: Response < 1 second

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Simple average vs weighted average shows difference
- [ ] Confidence levels accurate (high/medium/low)
- [ ] Variability classification correct
- [ ] Phase determination accurate
- [ ] Ovulation calculation correct (14 days before next period)
- [ ] Fertile window correct (6 days)
- [ ] Predictions extend to requested months
- [ ] Health insights relevant and helpful
- [ ] Symptom analysis identifies patterns
- [ ] Recommendations prioritized correctly
- [ ] Auto-calculation works on log creation
- [ ] Parent-child access control works
- [ ] Error handling graceful
- [ ] Performance acceptable
- [ ] No breaking changes to existing endpoints

---

## 🎨 Visual Verification

When integrated with frontend, verify:

1. **Confidence Badges**
   - High = Green solid
   - Medium = Yellow dashed
   - Low = Orange dotted

2. **Phase Colors**
   - Menstrual = Red
   - Follicular = Green
   - Ovulation = Yellow
   - Luteal = Purple

3. **Calendar Features**
   - Cycle day numbers visible
   - Predicted days marked differently
   - Ovulation icon displayed
   - Fertile days highlighted

4. **Insights Panel**
   - Insights categorized
   - Recommendations prioritized
   - Educational tips displayed
   - Data quality score visible

---

## 📝 Test Report Template

```markdown
# Test Report: Cycle Prediction Enhancement

**Date**: YYYY-MM-DD
**Tester**: Name
**Environment**: Development/Staging/Production

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Weighted Average | ✅ Pass | Correctly weights recent cycles |
| Confidence Levels | ✅ Pass | Accurate classification |
| Variability | ✅ Pass | CV calculation correct |
| Ovulation | ✅ Pass | 14 days before period |
| Fertile Window | ✅ Pass | 6 days correctly marked |
| Predictions | ✅ Pass | 12 months generated |
| Insights | ✅ Pass | Relevant and helpful |
| Auto-Calc | ✅ Pass | Cycle/period length auto-set |
| Parent Access | ✅ Pass | Access control working |
| Error Handling | ✅ Pass | Graceful failures |

## Issues Found
- None / List issues

## Recommendations
- Deploy to production
- Monitor metrics
- Gather user feedback

**Overall Status**: ✅ READY / ⚠️ NEEDS WORK / ❌ NOT READY
```

---

## 🚀 Production Deployment Tests

Before deploying to production:

1. **Load Test**: 100+ concurrent requests
2. **Data Migration**: Verify existing data not affected
3. **Backward Compatibility**: Old clients still work
4. **Security Audit**: JWT, parent-child access
5. **Performance Baseline**: Establish metrics
6. **User Acceptance**: Beta test with real users

---

**Happy Testing!** 🎉

If you find any issues, check:
1. Backend logs
2. Database state
3. JWT token validity
4. Parent-child relationships
5. Cycle log data quality
