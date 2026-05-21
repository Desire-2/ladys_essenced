# Lady's Essence: Complete Cycle Tracking Codebase Analysis

## Overview
This document maps ALL cycle-related functionality in the Lady's Essence backend, including models, API endpoints, prediction algorithms, and services.

---

## 1. DATABASE MODELS & SCHEMA

### 1.1 CycleLog Model
**Location**: [backend/app/models/__init__.py](backend/app/models/__init__.py#L175-L220)

**Database Table**: `cycle_logs`

**Core Fields**:
- `id` (Integer, Primary Key)
- `user_id` (Integer, Foreign Key to users.id)
- `start_date` (DateTime, NOT NULL)
- `end_date` (DateTime, nullable)
- `cycle_length` (Integer) - days since last cycle start
- `period_length` (Integer) - duration of menstruation
- `flow_intensity` (String) - 'light', 'medium', 'heavy'
- `symptoms` (Text) - health observations
- `notes` (Text) - user notes

**Enhanced Tracking Fields** (for better ML predictions):
- `mood` (String) - 'very_good', 'good', 'neutral', 'low', 'very_low'
- `energy_level` (String) - 'high', 'moderate', 'low', 'very_low'
- `sleep_quality` (String) - 'excellent', 'good', 'fair', 'poor'
- `stress_level` (String) - 'low', 'moderate', 'high', 'very_high'
- `exercise_activities` (Text) - JSON string of activities

**Metadata**:
- `created_at` (DateTime)
- `updated_at` (DateTime)

**Key Methods**:
- `to_dict()` - Serializes to JSON with ISO format timestamps

---

### 1.2 InsightCache Model
**Location**: [backend/app/models/insight_cache.py](backend/app/models/insight_cache.py)

**Purpose**: Caches AI-generated health insights to reduce API costs and improve performance

**Fields**:
- `id` (Integer, Primary Key)
- `user_id` (Integer, Foreign Key)
- `language` (String) - 'kinyarwanda' (default) or 'english'
- `insight_data` (Text) - JSON string of cached insights
- `created_at` (DateTime)
- `expires_at` (DateTime) - Cache expiration time
- `is_valid` (Boolean)

**Key Methods**:
- `get_valid_cache(user_id, language)` - Retrieves non-expired cache entries
- `is_expired()` - Checks if cache entry has expired
- `cleanup_expired()` - Removes stale cache entries
- Default cache duration: 6 hours

---

### 1.3 PeriodLog Model
**Inferred from**: [backend/app/routes/period_logs.py](backend/app/routes/period_logs.py#L8)

**Purpose**: Enhanced detailed menstrual tracking alongside CycleLog

**Note**: Used by `PeriodAnalyticsEngine` for combining period + cycle analysis

---

## 2. DATABASE MIGRATIONS

### 2.1 Enhanced Cycle and Session Fields
**File**: [backend/migrations/versions/3b50b6c140f5_add_enhanced_cycle_and_session_fields.py](backend/migrations/versions/3b50b6c140f5_add_enhanced_cycle_and_session_fields.py)
- Adds session management fields to users table
- Revision: 3b50b6c140f5

### 2.2 Cycle Info Fields
**File**: [backend/migrations/versions/f715969f4d42_add_cycle_info_fields_to_users_table.py](backend/migrations/versions/f715969f4d42_add_cycle_info_fields_to_users_table.py)
- Placeholder for future cycle info fields on users table
- Revision: f715969f4d42

### 2.3 Insight Cache Table Creation
**File**: [backend/migrations/versions/add_insight_cache.py](backend/migrations/versions/add_insight_cache.py)
- Creates the `insight_cache` table for caching AI insights

---

## 3. CORE PREDICTION ENGINE

### 3.1 CyclePredictionEngine Class
**Location**: [backend/app/routes/cycle_logs.py](backend/app/routes/cycle_logs.py#L21-L2000+)

**Purpose**: Advanced Machine Learning Cycle Prediction with 12 sophisticated algorithms

**Key Design Features**:
- Adaptive Weighted Moving Average
- Exponential Smoothing with trend detection
- Outlier Detection and Filtering
- Trend Analysis for evolving patterns
- Multi-factor Confidence Scoring
- Pattern Recognition for irregular cycles
- Machine Learning Pattern Recognition
- Adaptive Learning Models that improve over time
- Personalized Prediction Algorithms per user
- Anomaly Detection for health concerns
- Feedback Loop Learning from prediction accuracy
- Seasonal & Lifestyle Pattern Recognition

---

### 3.2 Core Prediction Methods

#### extract_cycle_lengths_robust()
**Lines**: 39-77
**Purpose**: Extract cycle lengths with improved accuracy and outlier handling
**Returns**: List of cycle length dictionaries with reliability scores
**Validation**: Filters to 15-60 day range (reasonable cycles)
**Reliability Levels**: 'high', 'medium', 'low', 'outlier'

#### detect_outliers()
**Lines**: 79-108
**Method**: Interquartile Range (IQR)
**Returns**: Filtered data with outlier flags
**Q1/Q3**: Quantile-based bounds
**Threshold**: 1.5 × IQR

#### analyze_trend()
**Lines**: 109-152
**Algorithm**: Linear regression
**Returns**: {trend, direction, rate, confidence}
**Trend Types**: 'stable', 'lengthening', 'shortening', 'insufficient_data'
**Threshold**: < 0.1 day change = stable

#### calculate_adaptive_weighted_average()
**Lines**: 153-197
**Purpose**: Optimized weighted average for large datasets
**Weights**:
- Recency weight (exponential decay)
- Reliability weight (high/medium/low/outlier)
- Combined: recency_weight × reliability_weight
- Recency factor: 0.7 (default, configurable)

#### calculate_enhanced_confidence()
**Lines**: 198-274
**5-Factor Confidence Scoring**:
1. **Volume Score**: min(1.0, data_points / 12) - more cycles = higher confidence
2. **Consistency Score**: Based on coefficient of variation (CV)
3. **Recency Score**: Based on 90-day window
4. **Outlier Ratio**: Percentage of outlier cycles
5. **Trend Stability**: Whether trend is stable vs changing

**Weighted Combination**: 0.3×volume + 0.25×consistency + 0.15×recency + 0.15×outliers + 0.15×trend

**Confidence Levels**:
- 'very_high': >= 0.8
- 'high': >= 0.65
- 'medium': >= 0.45
- 'low': >= 0.25
- 'very_low': < 0.25

---

### 3.3 Machine Learning Pattern Recognition

#### ml_pattern_recognition()
**Lines**: 275-318
**Input**: cycle_data (List[Dict]), optional user_id
**Output**: {patterns, confidence, recommendations, user_profile}

**Sub-processes**:
1. Feature extraction
2. Pattern identification via clustering
3. Seasonal pattern detection
4. Lifestyle correlation analysis
5. Pattern confidence calculation

---

#### _extract_ml_features()
**Lines**: 319-430
**Returns**: Dict with 15+ ML features

**Statistical Features**:
- `length_mean`, `length_std`, `length_median`, `length_range`
- `coefficient_variation` (CV)

**Trend Features**:
- `trend_slope` (linear regression)
- `trend_acceleration` (second derivative)

**Frequency Domain**:
- `dominant_frequency` (via autocorrelation)
- `frequency_stability`

**Time-based**:
- `data_span_days`
- `average_gap_days`

**Regularity**:
- `regularity_score` (0-100)
- `predictability_index` (0-1)

---

#### _identify_cycle_patterns()
**Lines**: 454-514
**Pattern Types Detected**:

1. **Ultra-Regular**
   - CV < 3%, regularity > 90%
   - Characteristic: 'very_predictable'

2. **Lengthening-Progressive**
   - Slope > 0.1, acceleration > 0
   - Characteristic: 'progressive_change', 'increasing_length'

3. **Shortening-Progressive**
   - Slope < -0.1, acceleration < 0
   - Characteristic: 'progressive_change', 'decreasing_length'

4. **Cyclical-Variation**
   - Seasonal-like patterns
   - Dominant frequency > 0.8, stability > 0.7

5. **Chaotic-Irregular**
   - CV > 20%, predictability < 0.3
   - Characteristic: 'high_variability', 'lifestyle_factors'

---

### 3.4 Adaptive Learning & Ensemble Methods

#### adaptive_learning_prediction()
**Lines**: 732-804
**Purpose**: Ensemble prediction that improves over time
**Returns**: {prediction, confidence, model_contributions, learning_status}

**Ensemble Models** (4-model combination):

1. **Weighted Moving Average (WMA)**
   - Weight: historical WMA accuracy (default 0.7)

2. **Exponential Smoothing**
   - Alpha: 0.3 (default)
   - Weight: historical ES accuracy (default 0.6)

3. **Trend-based Prediction**
   - Base length + (trend_rate × 2)
   - Weight: historical trend accuracy (default 0.5)

4. **Seasonal-adjusted Prediction**
   - Applies seasonal factors by month
   - Weight: historical seasonal accuracy (default 0.4)

**Combination**: Weighted ensemble using model accuracy history

---

#### _combine_ensemble_predictions()
**Lines**: 846-865
**Algorithm**: 
```
For each model:
  weight = model_accuracy × model_confidence
  weighted_sum += prediction × weight
  total_weight += weight

ensemble_prediction = weighted_sum / total_weight
```

---

#### _calculate_adaptive_confidence()
**Lines**: 866-930
**3-Factor Confidence**:
1. Model agreement (std deviation of predictions)
2. Historical accuracy (correct/total predictions)
3. Data sufficiency (cycles / 12)

**Weights**: 0.4×agreement + 0.4×accuracy + 0.2×sufficiency

---

### 3.5 Anomaly Detection

#### anomaly_detection()
**Lines**: 950-1037
**Purpose**: Identifies health concerns through unusual patterns
**Returns**: {anomalies_detected, anomalies[], risk_score, recommendations}

**5-Type Anomaly Detection**:

1. **Statistical Outliers** (Z-score method)
   - Detects cycles far from mean

2. **Trend Anomalies**
   - Sudden changes in established patterns

3. **Pattern Disruptions**
   - Breaking of identified patterns

4. **Health-based Anomalies**
   - Cycles too short (<21 days)
   - Cycles too long (>35 days)
   - Missing periods

5. **Current Cycle Anomalies**
   - Comparison to historical length

**Risk Scoring**: Aggregates severity of all detected anomalies

---

### 3.6 Prediction Generation

#### predict_next_cycles()
**Lines**: 1294-1307
**Purpose**: Generate multi-cycle predictions
**Parameters**: logs, num_predictions (default 3), optional user_id
**Returns**: List of predicted cycle start dates

**Fallback**: If insufficient data, uses default prediction algorithm

---

## 4. API ROUTES & ENDPOINTS

### 4.1 Cycle Logs Routes
**Blueprint Location**: [backend/app/routes/cycle_logs.py](backend/app/routes/cycle_logs.py#L2078-L3818)

#### GET /api/cycle-logs
**Line**: 2078
**Purpose**: Retrieve all cycle logs for authenticated user
**Auth**: JWT required
**Query Parameters**: Pagination (limit, offset)
**Returns**: List of cycle log objects

#### POST /api/cycle-logs
**Line**: 2223
**Purpose**: Create new cycle log entry
**Auth**: JWT required
**Body**: 
```json
{
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "cycle_length": 28,
  "period_length": 5,
  "flow_intensity": "light|medium|heavy",
  "symptoms": "text",
  "mood": "string",
  "energy_level": "string",
  "sleep_quality": "string",
  "stress_level": "string"
}
```

#### GET /api/cycle-logs/{log_id}
**Line**: 2171
**Purpose**: Retrieve specific cycle log
**Auth**: JWT required

#### PUT /api/cycle-logs/{log_id}
**Line**: 2389
**Purpose**: Update cycle log
**Auth**: JWT required

#### DELETE /api/cycle-logs/{log_id}
**Line**: 2476
**Purpose**: Delete cycle log
**Auth**: JWT required

#### GET /api/cycle-stats
**Line**: 2512
**Purpose**: Comprehensive cycle statistics
**Auth**: JWT required
**Returns**: Aggregated cycle metrics

#### GET /api/cycle-insights
**Line**: 3012
**Purpose**: AI-powered cycle insights and predictions
**Auth**: JWT required
**Returns**: 
```json
{
  "averageCycleLength": 28.5,
  "averagePeriodLength": 5.2,
  "cycleVariability": 2.1,
  "nextPeriodPrediction": "ISO date",
  "fertilityWindow": {"start": "ISO date", "end": "ISO date"},
  "cyclePhase": "menstrual|follicular|ovulation|luteal",
  "cycleDay": 8,
  "totalCycles": 12,
  "confidence": "very_high|high|medium|low|very_low"
}
```

#### GET /api/cycle-predictions
**Line**: 3238
**Purpose**: Next cycle predictions (default 3 cycles)
**Auth**: JWT required
**Returns**: Array of predicted cycle start dates with confidence

#### GET /api/ml-insights
**Line**: 3318
**Purpose**: Machine learning pattern analysis
**Auth**: JWT required
**Returns**: 
```json
{
  "patterns": {
    "cycle_patterns": [...],
    "seasonal_patterns": {...},
    "lifestyle_patterns": {...}
  },
  "confidence": "high|medium|low",
  "recommendations": [...],
  "user_profile": {...}
}
```

#### GET /api/pattern-analysis
**Line**: 3466
**Purpose**: Detailed pattern analysis
**Auth**: JWT required

#### GET /api/adaptive-learning-status
**Line**: 3517
**Purpose**: Learning progress and improvement potential
**Auth**: JWT required
**Returns**: Learning status, improvement suggestions

#### GET /api/anomaly-detection
**Line**: 3539
**Purpose**: Anomaly detection results
**Auth**: JWT required
**Returns**: Detected anomalies, risk score, recommendations

#### GET /api/confidence-metrics
**Line**: 3580
**Purpose**: Confidence scoring breakdown
**Auth**: JWT required

#### GET /api/fertile-window
**Line**: 3725
**Purpose**: Fertility window prediction
**Auth**: JWT required
**Returns**: Ovulation date, fertile window dates

#### GET /api/health-summary
**Line**: 3818
**Purpose**: Overall health summary with cycle data
**Auth**: JWT required

---

### 4.2 Enhanced Analytics Routes
**Blueprint Location**: [backend/app/routes/analytics_enhanced.py](backend/app/routes/analytics_enhanced.py)

#### GET /api/analytics/dashboard
**Line**: 15
**Purpose**: Comprehensive dashboard analytics
**Auth**: JWT required
**Returns**:
```json
{
  "cycleMetrics": {...},
  "nutritionMetrics": {...},
  "mentalHealthMetrics": {...},
  "appointmentMetrics": {...}
}
```

**Helper Function**: `calculate_cycle_metrics()` (Line 153)
- Calculates: average length, period length, variability
- Next period prediction
- Fertility window
- Current phase and cycle day

**Helper Function**: `determine_cycle_phase()` (Line 297)
- Returns: 'menstrual', 'follicular', 'ovulation', 'luteal'
- Based on cycle day and average length

**Helper Function**: `generate_cycle_insights()` (Line 324)
- AI-powered insights generation

#### GET /api/analytics/cycle-insights
**Line**: 74
**Purpose**: Cycle-specific insights with date range filtering
**Auth**: JWT required
**Query Params**: start_date, end_date (ISO format)

---

### 4.3 Parent-Child Cycle Management Routes
**Blueprint Location**: [backend/app/routes/parents.py](backend/app/routes/parents.py)

#### GET /api/parents/children/{adolescent_id}/cycle-logs
**Line**: 266
**Purpose**: Parent retrieves child's cycle logs
**Auth**: JWT required (parent account)
**Security Checks**:
1. Verify user is parent (user_type == 'parent')
2. Verify parent-child relationship exists in ParentChild table
3. Check child's allow_parent_access flag
4. Use child's user_id (NOT parent's) for queries

#### POST /api/parents/children/{adolescent_id}/cycle-logs
**Line**: 326
**Purpose**: Parent creates/logs cycle for child
**Auth**: JWT required (parent account)
**Behavior**:
- Creates CycleLog entry for child (uses child's user_id)
- If cycle_length provided, predicts next cycle
- Creates notification for child

---

### 4.4 Period Analytics Routes
**Blueprint Location**: [backend/app/routes/period_logs.py](backend/app/routes/period_logs.py)

**Class**: `PeriodAnalyticsEngine`

**Methods**:
- `calculate_period_patterns(period_logs)` - Analyzes patterns across periods
- `generate_period_insights(period_logs, cycle_logs=None)` - Generates combined insights

---

### 4.5 AI Insights Service Routes
**Blueprint Location**: [backend/app/routes/insights.py](backend/app/routes/insights.py)

#### POST /api/insights/generate
**Line**: 14
**Purpose**: Generate AI health insights in Kinyarwanda or English
**Auth**: JWT required
**Body**:
```json
{
  "user_id": "optional - target user",
  "language": "kinyarwanda|english"
}
```
**Authorization Rules**:
- Parents can generate for their children
- Health providers can generate for patients
- Admins can generate for any user
- Adolescents can only generate for themselves

**Caching**: Results cached for 6 hours via InsightCache model

---

### 4.6 USSD Cycle Tracking Routes
**Blueprint Location**: [backend/app/routes/ussd.py](backend/app/routes/ussd.py)

#### handle_cycle_tracking(user, input_list)
**Line**: 658
**Purpose**: USSD interface for cycle tracking via SMS
**Input**: User object, menu input list

#### get_cycle_status(user)
**Line**: 1202
**Purpose**: Current cycle status over USSD

#### get_cycle_history(user)
**Line**: 1226
**Purpose**: Historical cycle data via SMS

#### get_cycle_predictions(user, month_offset=0)
**Line**: 1240
**Purpose**: Predictions accessible via USSD

---

## 5. AI/INSIGHT GENERATION SERVICE

### 5.1 KinyarwandaInsightService
**Location**: [backend/app/services/kinyarwanda_insight_service.py](backend/app/services/kinyarwanda_insight_service.py)

**Class**: `KinyarwandaInsightService`

**Purpose**: Generate AI health insights using Gemini 2.0 Flash API

**Supported Languages**: 
- Kinyarwanda (primary)
- English

**Caching**: 6-hour cache via InsightCache model

**Key Methods**:

#### generate_insight(user_id, language='kinyarwanda')
**Purpose**: Generate AI insights for user
**Process**:
1. Check InsightCache for valid (non-expired) entry
2. Fetch user's health data (cycle logs, meal logs, symptoms)
3. Call Gemini 2.0 Flash API with health data
4. Cache results for 6 hours
5. Return insights

**Data Fetched**:
- Cycle logs (last 12 months)
- Meal logs
- Appointment history
- User profile data

#### _fetch_user_data(user_id)
**Purpose**: Aggregate user health data for analysis

#### _get_advanced_cycle_analysis(user_id, cycle_logs)
**Purpose**: Detailed cycle analysis for insights

#### _get_cached_insight(user_id, language)
**Purpose**: Retrieve cached insights if not expired

---

## 6. UTILITY FUNCTIONS

### 6.1 Query Optimization
**Location**: [backend/app/utils/query_optimizer.py](backend/app/utils/query_optimizer.py)

#### optimize_cycle_log_query(query, include_user=False)
**Line**: 83
**Purpose**: Optimize CycleLog queries to reduce N+1 problems
**Method**: Eager loading of relationships
**Returns**: Optimized SQLAlchemy query object

---

## 7. ALGORITHM SUMMARY

### 7.1 Weighted Moving Average (WMA)
- **Recency Bias**: Exponential decay (recency_factor = 0.7)
- **Reliability Weights**: 
  - high = 1.0
  - medium = 0.8
  - low = 0.5
  - outlier = 0.1
- **Formula**: Σ(value × weight) / Σ(weights)

### 7.2 Exponential Smoothing
- **Alpha**: 0.3 (smoothing factor)
- **Purpose**: Smooth trend while preserving recent data

### 7.3 Linear Regression Trend
- **Slope Calculation**: (Σ(x-x̄)(y-ȳ)) / Σ(x-x̄)²
- **Threshold**: |slope| < 0.1 = stable
- **Acceleration**: Second derivative of slope

### 7.4 IQR Outlier Detection
- **Q1, Q3**: Quartile calculations
- **IQR**: Q3 - Q1
- **Bounds**: [Q1 - 1.5×IQR, Q3 + 1.5×IQR]

### 7.5 Anomaly Detection Multi-Method
- Statistical outliers (Z-score)
- Trend anomalies (sudden changes)
- Pattern disruptions (breaking established patterns)
- Health-based (cycle length bounds)
- Current cycle anomalies (comparison to history)

### 7.6 Ensemble Prediction
- **Models**: 4-model combination (WMA, ES, Trend, Seasonal)
- **Weighting**: Historical accuracy + confidence scores
- **Fallback**: Simple average if insufficient data

---

## 8. DATA VALIDATION & CONSTRAINTS

### Cycle Length
- **Valid Range**: 15-60 days (filtered from calculations)
- **Normal Range**: 21-35 days (WHO)

### Period Length
- **Typical**: 3-7 days
- **Calculation**: end_date - start_date

### Flow Intensity
- Valid Values: 'light', 'medium', 'heavy'

### Mood/Energy/Sleep/Stress
- Predefined categorical values

### Confidence Levels
- 'very_high', 'high', 'medium', 'low', 'very_low'

### Cycle Phases
- 'menstrual' (days 0-5)
- 'follicular' (days 6-14)
- 'ovulation' (days 15-17)
- 'luteal' (days 18-28)

---

## 9. AUTHORIZATION & SECURITY

### Parent-Child Relationship Validation
**Pattern** (from copilot-instructions.md):

```python
@jwt_required()
def endpoint(adolescent_id):
    # 1. Verify user is parent
    user = User.query.get(get_jwt_identity())
    if user.user_type != 'parent':
        return error, 403
    
    # 2. Get parent record
    parent = Parent.query.filter_by(user_id=user.id).first()
    
    # 3. VERIFY PARENT-CHILD RELATIONSHIP
    relation = ParentChild.query.filter_by(
        parent_id=parent.id,
        adolescent_id=adolescent_id
    ).first()
    if not relation:
        return error, 404
    
    # 4. Check allow_parent_access flag
    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)
    if not child_user.allow_parent_access:
        return error, 403
    
    # 5. Use CHILD'S user_id for queries (NOT parent's)
    child_user_id = adolescent.user_id
```

### JWT Token Requirements
- **Storage**: localStorage key = 'access_token'
- **Format**: Bearer {token}
- **Refresh**: Auto-refresh on 401 response
- **Logout**: Clear access_token, refresh_token, accessed_child_id

---

## 10. PERFORMANCE CONSIDERATIONS

1. **InsightCache**: Reduces Gemini API calls by caching 6 hours
2. **Query Optimization**: optimize_cycle_log_query() reduces N+1 queries
3. **Adaptive Weights**: Learning improves prediction accuracy over time
4. **Lazy Loading**: Relationships loaded on-demand
5. **Batch Analytics**: Group calculations for dashboard queries
6. **Filtering**: IQR outlier detection prevents anomalies from skewing averages

---

## 11. DEPENDENCIES

### Backend Libraries
- `Flask` - Web framework
- `SQLAlchemy` - ORM
- `Flask-JWT-Extended` - Authentication
- `NumPy` - ML features, statistical analysis
- `statistics` - Python built-in for statistical calculations

### External APIs
- `Google Gemini 2.0 Flash API` - AI insights generation

### Database
- `PostgreSQL` or `SQLite` - Primary storage

---

## 12. FILE DIRECTORY SUMMARY

```
backend/
├── app/
│   ├── models/
│   │   ├── __init__.py              # CycleLog model (L175)
│   │   ├── insight_cache.py         # InsightCache model
│   │   └── notification.py          # Notification system
│   ├── routes/
│   │   ├── cycle_logs.py            # CyclePredictionEngine (L21)
│   │   │                            # API endpoints (L2078+)
│   │   ├── analytics_enhanced.py    # Dashboard analytics
│   │   ├── parents.py               # Parent-child routes
│   │   ├── period_logs.py           # Period analytics
│   │   ├── insights.py              # AI insights endpoint
│   │   ├── ussd.py                  # SMS cycle tracking
│   │   ├── appointments.py          # Appointment management
│   │   └── [other routes]
│   ├── services/
│   │   └── kinyarwanda_insight_service.py # AI insight generation
│   └── utils/
│       └── query_optimizer.py       # Cycle query optimization
├── migrations/
│   └── versions/
│       ├── 3b50b6c140f5_*.py        # Enhanced cycle fields
│       ├── f715969f4d42_*.py        # Cycle info fields
│       └── add_insight_cache.py     # Cache table
└── requirements.txt
```

---

## 13. KEY TAKEAWAYS

### Prediction Algorithm Hierarchy
1. **Ensemble Method** (primary) - 4 models with adaptive weights
2. **Weighted Moving Average** - Handles large datasets
3. **Exponential Smoothing** - Smooth trend following
4. **Trend Analysis** - Linear regression with acceleration
5. **Seasonal Adjustment** - Monthly pattern recognition
6. **Fallback** - Simple average when insufficient data

### Machine Learning Capabilities
- Pattern recognition with 5 pattern types
- Feature extraction (15+ features)
- Adaptive learning from prediction accuracy
- Seasonal and lifestyle correlation analysis
- User-specific cycle profiles
- Predictability scoring

### Anomaly Detection
- Multi-method approach (5 detection types)
- Risk scoring for severity assessment
- Health recommendations based on anomalies
- Distinguishes temporary vs persistent anomalies

### Performance Features
- 6-hour AI insight caching
- Query optimization to prevent N+1 problems
- Adaptive weighting improves over time
- Batch analytics for dashboard queries

### Security
- JWT token-based authentication
- Parent-child relationship validation
- Role-based access control (parent, adolescent, admin, health_provider)
- Allow_parent_access privacy flag

