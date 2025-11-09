# 🚀 Cycle Prediction System - Quick Reference

## 📡 API Endpoints

### 1. Get Enhanced Statistics
```http
GET /api/cycle-logs/stats?user_id={optional}
Authorization: Bearer {token}
```

**Response Fields:**
- `basic_stats`: Average cycles, current phase, days since period
- `predictions`: Array of next 3 cycle predictions with confidence
- `variability`: Regularity classification and statistics
- `symptom_analysis`: Common symptoms and patterns
- `health_insights`: Automated health recommendations

---

### 2. Get Personalized Insights 🆕
```http
GET /api/cycle-logs/insights?user_id={optional}
Authorization: Bearer {token}
```

**Response Fields:**
- `insights`: Health observations (positive/warning/info)
- `recommendations`: Prioritized action items with tips
- `cycle_characteristics`: Detailed cycle analysis
- `educational_tips`: Learning content
- `data_quality_score`: 0-100 score

---

### 3. Get Future Predictions 🆕
```http
GET /api/cycle-logs/predictions?months=3&user_id={optional}
Authorization: Bearer {token}
```

**Query Parameters:**
- `months`: 1-12 (default: 3)
- `user_id`: For parent viewing child

**Response Fields:**
- `predictions`: Detailed predictions array
- `grouped_by_month`: Predictions organized by month
- `planning_tips`: Practical advice

---

### 4. Enhanced Calendar
```http
GET /api/cycle-logs/calendar?year=2025&month=11&user_id={optional}
Authorization: Bearer {token}
```

**NEW Day Object Fields:**
- `phase`: menstrual/follicular/ovulation/luteal
- `cycle_day`: Day number in current cycle
- `confidence`: high/medium/low (for predictions)
- `is_predicted`: Boolean flag
- `flow_intensity`: light/medium/heavy

---

## 🎨 Confidence Level Guide

| Level | Badge Color | Border | Icon | Requirements |
|-------|-------------|--------|------|--------------|
| High | 🟢 Green | Solid | ✓ | 6+ logs, regular |
| Medium | 🟡 Yellow | Dashed | ~ | 3-5 logs |
| Low | 🟠 Orange | Dotted | ? | <3 logs |

---

## 🔄 Cycle Phase Colors

```css
.menstrual { background: #FF5252; } /* Red */
.follicular { background: #81C784; } /* Green */
.ovulation { background: #FFD54F; } /* Yellow */
.luteal { background: #9575CD; } /* Purple */
```

---

## 📊 Data Quality Scoring

```javascript
score = (total_logs / 6) * 100  // Cap at 100%

// Thresholds
excellent: >= 100 (6+ logs)
good: >= 50 (3-5 logs)
poor: < 50 (<3 logs)
```

---

## 🧮 Prediction Algorithm Summary

```python
# 1. Weighted Average (recent cycles = higher weight)
weights = [2^0, 2^1, 2^2, ..., 2^n]
weighted_avg = sum(cycle_length[i] * weight[i]) / sum(weights)

# 2. Exponential Smoothing (alpha = 0.3)
smoothed = alpha * current + (1-alpha) * previous

# 3. Confidence Calculation
if logs >= 6 and variability <= 10%:
    confidence = "high"
elif logs >= 3 and variability <= 20%:
    confidence = "medium"
else:
    confidence = "low"

# 4. Next Period Prediction
next_period = last_period_start + weighted_avg_cycle_length

# 5. Ovulation Date
ovulation = next_period_start - 14 days

# 6. Fertile Window
fertile_start = ovulation - 5 days
fertile_end = ovulation + 1 day
```

---

## 🎯 Frontend Integration Examples

### React Component - Stats Display
```jsx
function CycleStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/cycle-logs/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setStats(data));
  }, []);

  return (
    <div>
      <h2>Your Cycle</h2>
      <p>Average: {stats.basic_stats.average_cycle_length} days</p>
      <p>Phase: {stats.basic_stats.current_cycle_phase}</p>
      <p>Regularity: {stats.variability.variability}</p>
      
      <h3>Next Periods:</h3>
      {stats.predictions.map(pred => (
        <div key={pred.cycle_number} 
             className={`prediction-${pred.confidence}`}>
          <span>{formatDate(pred.predicted_start)}</span>
          <ConfidenceBadge level={pred.confidence} />
        </div>
      ))}
    </div>
  );
}
```

### Calendar Day Rendering
```jsx
function CalendarDay({ day }) {
  const getClassName = () => {
    let classes = ['calendar-day'];
    if (day.is_today) classes.push('today');
    if (day.phase) classes.push(`phase-${day.phase}`);
    if (day.is_predicted) classes.push('predicted');
    return classes.join(' ');
  };

  return (
    <div className={getClassName()}>
      <span className="day-number">{day.day_of_month}</span>
      {day.cycle_day && (
        <span className="cycle-day">Day {day.cycle_day}</span>
      )}
      {day.is_ovulation_day && <span className="icon">🥚</span>}
      {day.is_fertility_day && <span className="icon">🌸</span>}
      {day.is_period_day && (
        <span className={`flow-${day.flow_intensity}`}>🔴</span>
      )}
      {day.confidence && (
        <ConfidenceBadge level={day.confidence} />
      )}
    </div>
  );
}
```

### Insights Display
```jsx
function InsightsPanel() {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    fetch('/api/cycle-logs/insights', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setInsights(data));
  }, []);

  return (
    <div className="insights-panel">
      <h2>Your Health Insights</h2>
      
      {/* Health Insights */}
      {insights.insights.map((insight, i) => (
        <div key={i} className={`insight-${insight.type}`}>
          <h3>{insight.category}</h3>
          <p>{insight.message}</p>
          <small>{insight.detail}</small>
        </div>
      ))}

      {/* Recommendations */}
      <h2>Recommendations</h2>
      {insights.recommendations
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .map((rec, i) => (
          <div key={i} className={`recommendation priority-${rec.priority}`}>
            <h3>{rec.title}</h3>
            <p>{rec.message}</p>
            {rec.tips && (
              <ul>
                {rec.tips.map((tip, j) => (
                  <li key={j}>{tip}</li>
                ))}
              </ul>
            )}
          </div>
        ))}

      {/* Data Quality Score */}
      <div className="data-quality">
        <h3>Data Quality: {insights.data_quality_score}%</h3>
        <ProgressBar value={insights.data_quality_score} />
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Commands

### Test Basic Stats
```bash
curl -X GET "http://localhost:5000/api/cycle-logs/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Insights
```bash
curl -X GET "http://localhost:5000/api/cycle-logs/insights" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Predictions
```bash
curl -X GET "http://localhost:5000/api/cycle-logs/predictions?months=6" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Calendar
```bash
curl -X GET "http://localhost:5000/api/cycle-logs/calendar?year=2025&month=11" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Parent Viewing Child
```bash
curl -X GET "http://localhost:5000/api/cycle-logs/stats?user_id=55" \
  -H "Authorization: Bearer PARENT_TOKEN"
```

---

## 📱 Mobile UI Considerations

### Confidence Indicators
```
High:   ✓ Solid circle, green
Medium: ~ Dashed circle, yellow  
Low:    ? Dotted circle, orange
```

### Phase Icons
```
Menstrual:  🔴 Red dot
Follicular: 🌱 Growing plant
Ovulation:  🥚 Egg
Luteal:     🌙 Moon
```

### Flow Intensity
```
Light:  ▫️ Small dot
Medium: 🔸 Medium dot
Heavy:  🔴 Large dot
```

---

## ⚠️ Important Notes

1. **Always check confidence level** before showing predictions
2. **Variability matters** - irregular cycles need different UX
3. **Educate users** - show why predictions may be inaccurate
4. **Encourage logging** - more data = better predictions
5. **Phase awareness** - adjust UI/UX based on current phase

---

## 🔑 Key Metrics to Display

### Dashboard Summary
```
✅ Average Cycle: 28.5 days
✅ Regularity: Very Regular (CV: 3.2%)
✅ Data Quality: 100% (6 logs)
✅ Next Period: Dec 2 (High Confidence)
✅ Current Phase: Follicular (Day 8)
```

### Planning View
```
November:   2 periods predicted
December:   2 periods predicted
January:    2 periods predicted

📅 Vacation dates safe: Dec 10-20
⚠️ Avoid scheduling: Dec 2-7, Dec 31-Jan 4
```

---

## 🎯 Quick Win Features

1. **Next Period Countdown**: "5 days until next period"
2. **Phase-Based Tips**: Daily rotating tips based on phase
3. **Symptom Predictions**: "Cramps likely in 2 days"
4. **Confidence Badge**: Always visible on predictions
5. **Data Quality Progress**: "Log 2 more cycles for best accuracy"

---

## 📚 Additional Resources

- Full Documentation: `ENHANCED_CYCLE_PREDICTION_SYSTEM.md`
- API Schema: Check response examples in full docs
- Algorithm Details: See prediction engine section

---

**Last Updated**: November 8, 2025
**Version**: 2.0
