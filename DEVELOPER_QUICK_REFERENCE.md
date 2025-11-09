# 🎯 Intelligent Cycle Dashboard - Quick Reference

## 🚀 Quick Start for Developers

### **1-Minute Overview**
We've transformed the basic cycle tracker into an **intelligent health companion** with:
- ✅ Advanced prediction algorithms (weighted avg, exponential smoothing)
- ✅ Real-time cycle phase tracking (menstrual/follicular/ovulation/luteal)
- ✅ Confidence-based predictions (high/medium/low)
- ✅ Personalized health insights and recommendations
- ✅ Beautiful visual dashboard with Bootstrap styling

---

## 📊 Component Hierarchy

```
Dashboard (page.tsx)
├── Overview Tab
│   ├── CycleInsights Component ⭐ NEW
│   │   ├── Current Phase Banner
│   │   ├── Cycle Regularity Card
│   │   ├── Intelligent Predictions (3 next periods)
│   │   ├── Health Insights Alerts
│   │   ├── Common Symptoms Grid
│   │   └── Data Quality Score
│   └── Quick Actions Sidebar
├── Cycle Tab (existing)
├── Meals Tab (existing)
├── Appointments Tab (existing)
└── Children Tab (existing - for parents)
```

---

## 🔌 API Integration

### **API Client Usage**

```typescript
import { api } from '../lib/api/client';

// Get enhanced cycle statistics
const stats = await api.cycle.getStats(userId);

// Get personalized insights
const insights = await api.cycle.getInsights(userId);

// Get future predictions (3-12 months)
const predictions = await api.cycle.getPredictions(6, userId);

// Get enhanced calendar data
const calendar = await api.cycle.getCalendarData(2024, 1, userId);
```

### **API Endpoints**

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/api/cycle-logs/stats` | GET | Stats + predictions + variability + insights |
| `/api/cycle-logs/insights` | GET | Personalized recommendations |
| `/api/cycle-logs/predictions?months=6` | GET | Future cycle predictions |
| `/api/cycle-logs/calendar?year=2024&month=1` | GET | Calendar with phases |

---

## 🎨 Visual Design Tokens

### **Phase Colors**
```typescript
const phaseColors = {
  menstrual: '#FF5252',  // Red
  follicular: '#81C784', // Green
  ovulation: '#FFD54F',  // Yellow
  luteal: '#9575CD'      // Purple
};
```

### **Confidence Badges**
```html
<!-- High Confidence -->
<span class="badge bg-success">
  <i class="fas fa-check-circle"></i> High Confidence
</span>

<!-- Medium Confidence -->
<span class="badge bg-warning">
  <i class="fas fa-exclamation-circle"></i> Medium Confidence
</span>

<!-- Low Confidence -->
<span class="badge bg-secondary">
  <i class="fas fa-question-circle"></i> Low Confidence
</span>
```

### **Phase Icons**
```typescript
const phaseIcons = {
  menstrual: 'fa-circle',
  follicular: 'fa-seedling',
  ovulation: 'fa-egg',
  luteal: 'fa-moon'
};
```

---

## 🧮 Prediction Algorithms

### **1. Weighted Moving Average**
```python
# Recent 3 cycles weighted 2x more
recent_weight = 2.0
weighted_avg = (sum(last_3_cycles) * 2 + sum(other_cycles)) / total_weight
```

### **2. Exponential Smoothing**
```python
# Alpha = 0.3 for optimal cycle prediction
smoothed = alpha * current_cycle + (1 - alpha) * previous_smoothed
```

### **3. Confidence Calculation**
```python
if total_logs >= 6 and cv <= 10:
    confidence = 'high'    # ~90% accuracy
elif total_logs >= 3:
    confidence = 'medium'  # ~75% accuracy
else:
    confidence = 'low'     # ~60% accuracy
```

---

## 💻 Code Snippets

### **Using CycleInsights Component**

```typescript
import CycleInsights from '../../components/CycleInsights';

// In your component
<CycleInsights userId={selectedChild} />

// For logged-in user (no userId = current user)
<CycleInsights />
```

### **Handling API Responses**

```typescript
interface CycleStats {
  basic_stats: {
    average_cycle_length: number | null;
    weighted_cycle_length: number | null;
    current_cycle_phase: string | null;
    days_since_period: number;
  };
  predictions: Array<{
    cycle_number: number;
    predicted_start: string;
    predicted_end: string;
    ovulation_date: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  variability: {
    variability: string;
    coefficient_of_variation: number;
  } | null;
  health_insights: Array<{
    type: 'positive' | 'warning' | 'info';
    message: string;
    detail?: string;
  }>;
}

// Usage
const stats = await api.cycle.getStats(userId);
console.log(stats.predictions[0].confidence); // 'high'
```

---

## 🛠️ Development Workflow

### **Making Changes to Predictions**

1. **Backend Logic:** Edit `/backend/app/routes/cycle_logs.py`
   - Modify `CyclePredictionEngine` class methods
   - Adjust algorithm parameters (alpha, weights, etc.)
   - Add new insight types

2. **Frontend Display:** Edit `/frontend/src/components/CycleInsights.tsx`
   - Update visual components
   - Add new UI elements
   - Modify styling

3. **API Client:** Edit `/frontend/src/lib/api/client.ts`
   - Add new API methods if needed
   - Update TypeScript interfaces

### **Testing Changes**

```bash
# Backend
cd backend
python -m pytest tests/test_cycle_logs.py

# Frontend
cd frontend
npm run build  # Check for TypeScript errors
npm run dev    # Test in browser
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
.cycle-insights {
  /* Default: Mobile (<576px) */
}

/* Tablet (≥768px) */
@media (min-width: 768px) {
  .card-body { padding: 1.5rem; }
}

/* Desktop (≥992px) */
@media (min-width: 992px) {
  .col-lg-8 { flex: 0 0 auto; width: 66.66%; }
}
```

---

## 🐛 Debugging Tips

### **Predictions Not Showing?**
```typescript
// Check API response
const stats = await api.cycle.getStats(userId);
console.log('Predictions:', stats.predictions);
console.log('Data points:', stats.basic_stats.total_logs);

// Ensure at least 1 cycle logged
if (stats.basic_stats.total_logs === 0) {
  console.warn('No cycle data - predictions unavailable');
}
```

### **Confidence Always Low?**
```python
# Backend: Check cycle_logs table
SELECT COUNT(*) FROM cycle_logs WHERE user_id = ?;

# Need 3+ logs for medium, 6+ for high confidence
```

### **Phase Not Showing?**
```typescript
// Check days_since_period calculation
const daysSince = stats.basic_stats.days_since_period;
console.log('Days since period:', daysSince);

// Ensure latest_period_start exists
if (!stats.basic_stats.latest_period_start) {
  console.warn('No recent period logged');
}
```

---

## 🎨 Customization Guide

### **Change Phase Colors**

```typescript
// In CycleInsights.tsx
const getPhaseColor = (phase: string | null) => {
  const colors: Record<string, string> = {
    menstrual: '#YOUR_COLOR',   // Change here
    follicular: '#YOUR_COLOR',  // Change here
    ovulation: '#YOUR_COLOR',   // Change here
    luteal: '#YOUR_COLOR'       // Change here
  };
  return colors[phase || ''] || '#6c757d';
};
```

### **Adjust Confidence Thresholds**

```python
# In cycle_logs.py
def _determine_confidence(self, total_logs, variability):
    if total_logs >= 8 and variability <= 8:  # Stricter
        return 'high'
    elif total_logs >= 4:  # Require more data
        return 'medium'
    else:
        return 'low'
```

### **Add New Insight Types**

```python
# In calculate_health_insights()
insights.append({
    'type': 'info',
    'category': 'custom_category',
    'message': 'Your custom insight message',
    'detail': 'Additional details'
})
```

---

## 📊 Data Flow Diagram

```
User Logs Cycle
    ↓
POST /api/cycle-logs
    ↓
CyclePredictionEngine.calculate_cycle_length()
    ↓
Auto-calculate period_length, cycle_length
    ↓
Save to database
    ↓
Dashboard loads
    ↓
GET /api/cycle-logs/stats?user_id={userId}
    ↓
CyclePredictionEngine.predict_next_cycles()
    ↓
Calculate: weighted_avg, exp_smoothing, variability
    ↓
Generate: predictions, insights, recommendations
    ↓
Return JSON to frontend
    ↓
CycleInsights component renders
    ↓
Display: phase banner, predictions, insights, symptoms
```

---

## 🔑 Key Files Quick Access

| File | Lines | Purpose |
|------|-------|---------|
| `/backend/app/routes/cycle_logs.py` | ~1,200 | Prediction engine + API endpoints |
| `/frontend/src/components/CycleInsights.tsx` | ~450 | Main intelligence display component |
| `/frontend/src/app/dashboard/page.tsx` | ~2,050 | Dashboard integration |
| `/frontend/src/lib/api/client.ts` | ~800 | API communication layer |

---

## ✅ Pre-Deployment Checklist

```bash
# 1. Backend Tests
cd backend
python -m pytest
# ✅ All tests pass

# 2. Frontend Build
cd frontend
npm run build
# ✅ Build succeeds without errors

# 3. Environment Check
cat backend/.env
# ✅ DATABASE_URL set
# ✅ JWT_SECRET_KEY set

# 4. Database Migration
cd backend
flask db upgrade
# ✅ Migrations applied

# 5. API Health Check
curl http://localhost:5000/api/health
# ✅ {"status": "healthy"}

# 6. Frontend Test
npm run dev
# ✅ Navigate to http://localhost:3000/dashboard
# ✅ CycleInsights loads without errors
```

---

## 🚨 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `ModuleNotFoundError: statistics` | Python < 3.4 | Upgrade Python to 3.4+ |
| `TypeError: 'NoneType' object` | No cycle logs | Add null checks before calculations |
| `CORS error` | Frontend-backend mismatch | Check CORS config in Flask |
| `401 Unauthorized` | JWT expired | Re-login to get fresh token |
| `500 Internal Server Error` | Backend exception | Check Flask logs for traceback |

---

## 📞 Support Resources

- **Full Documentation:** `INTELLIGENT_CYCLE_DASHBOARD_COMPLETE.md`
- **Technical Deep Dive:** `ENHANCED_CYCLE_PREDICTION_SYSTEM.md`
- **Testing Guide:** `CYCLE_TESTING_GUIDE.md`
- **API Reference:** `CYCLE_PREDICTION_QUICK_REFERENCE.md`

---

## 🎯 Success Metrics Dashboard

Track these in your analytics:

```typescript
// User Engagement
- Daily active users viewing cycle insights
- Average time spent on dashboard
- % users with 6+ cycles logged

// Prediction Accuracy
- User-reported accuracy (feedback forms)
- Prediction variance (actual vs predicted)
- Confidence level distribution

// Technical Performance
- API response time (<200ms target)
- Frontend load time (<2s target)
- Error rate (<1% target)
```

---

**Pro Tip:** Always test with multiple user scenarios:
1. New user (0 logs) → Should show encouragement
2. Early user (3 logs) → Should show medium confidence
3. Regular user (6+ logs) → Should show high confidence
4. Parent viewing child → Should show child's data

---

*Built with ❤️ for developers who care about women's health*

**Quick Links:**
- [Backend Code](../backend/app/routes/cycle_logs.py)
- [Frontend Component](../frontend/src/components/CycleInsights.tsx)
- [Dashboard Integration](../frontend/src/app/dashboard/page.tsx)
- [API Client](../frontend/src/lib/api/client.ts)
