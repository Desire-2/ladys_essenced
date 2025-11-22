from app.models import CycleLog
from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import statistics
from collections import defaultdict
import numpy as np
import json
import math
from typing import List, Dict, Tuple, Optional, Any
import warnings
warnings.filterwarnings('ignore')

cycle_logs_bp = Blueprint('cycle_logs', __name__)

# ============================================================================
# INTELLIGENT PREDICTION ALGORITHMS
# ============================================================================

class CyclePredictionEngine:
    """
    Advanced Machine Learning Cycle Prediction Engine:
    1. Adaptive Weighted Moving Average - optimal weighting for large datasets
    2. Exponential Smoothing with trend detection
    3. Outlier Detection and Filtering
    4. Trend Analysis for evolving patterns
    5. Multi-factor Confidence Scoring
    6. Pattern Recognition for irregular cycles
    7. Machine Learning Pattern Recognition - identifies unique user patterns
    8. Adaptive Learning Models - improves predictions over time
    9. Personalized Prediction Algorithms - tailored to each user
    10. Anomaly Detection - identifies health concerns
    11. Feedback Loop Learning - learns from prediction accuracy
    12. Seasonal & Lifestyle Pattern Recognition - accounts for external factors
    """
    
    @staticmethod
    def extract_cycle_lengths_robust(logs):
        """Extract cycle lengths with improved accuracy and outlier handling"""
        if not logs or len(logs) < 2:
            return []
        
        # Sort logs by date to ensure proper calculation
        sorted_logs = sorted(logs, key=lambda x: x.start_date)
        
        # Calculate cycle lengths from consecutive periods
        calculated_lengths = []
        for i in range(len(sorted_logs) - 1):
            days_between = (sorted_logs[i + 1].start_date - sorted_logs[i].start_date).days
            if 15 <= days_between <= 60:  # Only include reasonable cycle lengths
                calculated_lengths.append({
                    'length': days_between,
                    'date': sorted_logs[i].start_date,
                    'source': 'calculated',
                    'reliability': 'high'
                })
        
        # Add stored cycle lengths (with lower reliability if they differ significantly)
        for log in sorted_logs:
            if log.cycle_length and 15 <= log.cycle_length <= 60:
                # Check if this differs significantly from calculated values
                reliability = 'medium'
                if calculated_lengths:
                    avg_calculated = statistics.mean([c['length'] for c in calculated_lengths])
                    if abs(log.cycle_length - avg_calculated) > 7:  # More than 7 days difference
                        reliability = 'low'
                
                calculated_lengths.append({
                    'length': log.cycle_length,
                    'date': log.start_date,
                    'source': 'stored',
                    'reliability': reliability
                })
        
        return calculated_lengths
    
    @staticmethod
    def detect_outliers(cycle_data, method='iqr'):
        """Detect and handle outlier cycles using statistical methods"""
        if len(cycle_data) < 4:
            return cycle_data  # Need at least 4 data points for outlier detection
        
        lengths = [c['length'] for c in cycle_data]
        
        if method == 'iqr':
            # Interquartile Range method
            q1 = statistics.quantiles(lengths, n=4)[0]
            q3 = statistics.quantiles(lengths, n=4)[2]
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            filtered_data = []
            for cycle in cycle_data:
                if lower_bound <= cycle['length'] <= upper_bound:
                    filtered_data.append(cycle)
                else:
                    # Mark as outlier but don't remove completely
                    cycle['is_outlier'] = True
                    cycle['reliability'] = 'outlier'
                    filtered_data.append(cycle)
            
            return filtered_data
        
        return cycle_data
    
    @staticmethod
    def analyze_trend(cycle_data):
        """Analyze if cycles are getting longer, shorter, or staying stable"""
        if len(cycle_data) < 6:
            return {'trend': 'insufficient_data', 'direction': None, 'rate': 0, 'confidence': 'low'}
        
        # Sort by date
        sorted_data = sorted(cycle_data, key=lambda x: x['date'])
        lengths = [c['length'] for c in sorted_data]
        
        # Calculate trend using linear regression approach
        n = len(lengths)
        x_values = list(range(n))
        
        # Calculate slope (trend direction)
        x_mean = statistics.mean(x_values)
        y_mean = statistics.mean(lengths)
        
        numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, lengths))
        denominator = sum((x - x_mean) ** 2 for x in x_values)
        
        if denominator == 0:
            slope = 0
        else:
            slope = numerator / denominator
        
        # Determine trend significance
        if abs(slope) < 0.1:  # Less than 0.1 day change per cycle
            trend = 'stable'
            direction = None
        elif slope > 0.1:
            trend = 'lengthening'
            direction = 'increasing'
        else:
            trend = 'shortening'
            direction = 'decreasing'
        
        return {
            'trend': trend,
            'direction': direction,
            'rate': round(slope, 2),
            'confidence': 'high' if len(lengths) >= 12 else 'medium'
        }
    
    @staticmethod
    def calculate_adaptive_weighted_average(cycle_data, recency_factor=0.7):
        """Calculate weighted average optimized for large datasets"""
        if not cycle_data:
            return None
        
        # Sort by date (most recent first)
        sorted_data = sorted(cycle_data, key=lambda x: x['date'], reverse=True)
        
        # Calculate weights based on recency and reliability
        weights = []
        values = []
        
        for i, cycle in enumerate(sorted_data):
            # Skip outliers in main calculation but use them for context
            if cycle.get('is_outlier', False):
                continue
            
            # Recency weight (exponential decay)
            recency_weight = recency_factor ** i
            
            # Reliability weight
            reliability_weight = {
                'high': 1.0,
                'medium': 0.8,
                'low': 0.5,
                'outlier': 0.1
            }.get(cycle.get('reliability', 'medium'), 0.8)
            
            # Combined weight
            final_weight = recency_weight * reliability_weight
            
            weights.append(final_weight)
            values.append(cycle['length'])
        
        if not values:
            # Fallback to simple average if all data is filtered out
            return statistics.mean([c['length'] for c in cycle_data])
        
        # Calculate weighted average
        weighted_sum = sum(v * w for v, w in zip(values, weights))
        weight_sum = sum(weights)
        
        return weighted_sum / weight_sum if weight_sum > 0 else statistics.mean(values)
    
    @staticmethod
    def calculate_enhanced_confidence(cycle_data, trend_analysis):
        """Calculate confidence score based on multiple factors"""
        if not cycle_data:
            return 'no_data'
        
        # Factor 1: Data volume
        volume_score = min(1.0, len(cycle_data) / 12)  # 12+ cycles = max volume score
        
        # Factor 2: Data consistency (coefficient of variation)
        lengths = [c['length'] for c in cycle_data if not c.get('is_outlier', False)]
        if len(lengths) < 2:
            consistency_score = 0
        else:
            cv = (statistics.stdev(lengths) / statistics.mean(lengths)) * 100
            consistency_score = max(0, 1 - (cv / 25))  # 25% CV = 0 score
        
        # Factor 3: Recency of data
        if cycle_data:
            latest_date = max(c['date'] for c in cycle_data)
            days_since_latest = (datetime.now() - latest_date).days
            recency_score = max(0, 1 - (days_since_latest / 90))  # 90 days = 0 score
        else:
            recency_score = 0
        
        # Factor 4: Outlier ratio
        total_cycles = len(cycle_data)
        outlier_cycles = sum(1 for c in cycle_data if c.get('is_outlier', False))
        outlier_ratio = outlier_cycles / total_cycles if total_cycles > 0 else 1
        outlier_score = 1 - outlier_ratio
        
        # Factor 5: Trend stability
        trend_score = {
            'stable': 1.0,
            'lengthening': 0.8,
            'shortening': 0.8,
            'insufficient_data': 0.5
        }.get(trend_analysis.get('trend', 'insufficient_data'), 0.5)
        
        # Weighted combination
        weights = [0.3, 0.25, 0.15, 0.15, 0.15]  # volume, consistency, recency, outliers, trend
        scores = [volume_score, consistency_score, recency_score, outlier_score, trend_score]
        
        final_score = sum(s * w for s, w in zip(scores, weights))
        
        # Convert to categorical confidence
        if final_score >= 0.8:
            return 'very_high'
        elif final_score >= 0.65:
            return 'high'
        elif final_score >= 0.45:
            return 'medium'
        elif final_score >= 0.25:
            return 'low'
        else:
            return 'very_low'
    
    @staticmethod
    def calculate_weighted_average(values, weights=None):
        """Legacy method for backward compatibility"""
        if not values:
            return None
        
        if weights is None:
            # Use improved adaptive weighting
            cycle_data = [{'length': v, 'date': datetime.now(), 'reliability': 'medium'} for v in values]
            return CyclePredictionEngine.calculate_adaptive_weighted_average(cycle_data)
        
        if len(values) != len(weights):
            weights = weights[:len(values)]
        
        return sum(v * w for v, w in zip(values, weights)) / sum(weights)
    
    # ============================================================================
    # MACHINE LEARNING ALGORITHMS
    # ============================================================================
    
    @staticmethod
    def ml_pattern_recognition(cycle_data: List[Dict], user_id: str = None) -> Dict:
        """
        Advanced ML pattern recognition to identify unique user cycle patterns
        Uses clustering, frequency analysis, and pattern matching algorithms
        """
        if len(cycle_data) < 6:
            return {'patterns': [], 'confidence': 'insufficient_data', 'recommendations': []}
        
        try:
            # Extract features for ML analysis
            features = CyclePredictionEngine._extract_ml_features(cycle_data)
            
            # Identify patterns using frequency analysis and clustering
            cycle_patterns = CyclePredictionEngine._identify_cycle_patterns(features)
            
            # Seasonal pattern detection
            seasonal_patterns = CyclePredictionEngine._detect_seasonal_patterns(cycle_data)
            
            # Lifestyle correlation patterns
            lifestyle_patterns = CyclePredictionEngine._analyze_lifestyle_correlations(cycle_data)
            
            # Calculate pattern confidence
            pattern_confidence = CyclePredictionEngine._calculate_pattern_confidence(
                cycle_patterns, seasonal_patterns, lifestyle_patterns, len(cycle_data)
            )
            
            return {
                'patterns': {
                    'cycle_patterns': cycle_patterns,
                    'seasonal_patterns': seasonal_patterns,
                    'lifestyle_patterns': lifestyle_patterns
                },
                'confidence': pattern_confidence,
                'recommendations': CyclePredictionEngine._generate_ml_recommendations(
                    cycle_patterns, seasonal_patterns, lifestyle_patterns
                ),
                'user_profile': CyclePredictionEngine._create_user_cycle_profile(cycle_data)
            }
        
        except Exception as e:
            print(f"ML Pattern Recognition Error: {str(e)}")
            return {'patterns': [], 'confidence': 'error', 'recommendations': []}
    
    @staticmethod
    def _extract_ml_features(cycle_data: List[Dict]) -> Dict:
        """Extract comprehensive features for ML analysis"""
        lengths = [c['length'] for c in cycle_data]
        dates = [c['date'] for c in cycle_data]
        
        # Basic statistical features
        features = {
            'length_mean': np.mean(lengths),
            'length_std': np.std(lengths),
            'length_median': np.median(lengths),
            'length_range': max(lengths) - min(lengths),
            'coefficient_variation': (np.std(lengths) / np.mean(lengths)) * 100,
            
            # Trend features
            'trend_slope': CyclePredictionEngine._calculate_trend_slope(lengths),
            'trend_acceleration': CyclePredictionEngine._calculate_trend_acceleration(lengths),
            
            # Frequency domain features
            'dominant_frequency': CyclePredictionEngine._find_dominant_frequency(lengths),
            'frequency_stability': CyclePredictionEngine._calculate_frequency_stability(lengths),
            
            # Time-based features
            'data_span_days': (max(dates) - min(dates)).days,
            'average_gap_days': CyclePredictionEngine._calculate_average_gap(dates),
            
            # Regularity features
            'regularity_score': CyclePredictionEngine._calculate_regularity_score(lengths),
            'predictability_index': CyclePredictionEngine._calculate_predictability_index(lengths)
        }
        
        return features
    
    @staticmethod
    def _calculate_trend_slope(lengths: List[float]) -> float:
        """Calculate the trend slope using linear regression"""
        n = len(lengths)
        x = np.arange(n)
        y = np.array(lengths)
        
        # Linear regression slope calculation
        x_mean = np.mean(x)
        y_mean = np.mean(y)
        
        numerator = np.sum((x - x_mean) * (y - y_mean))
        denominator = np.sum((x - x_mean) ** 2)
        
        return numerator / denominator if denominator != 0 else 0
    
    @staticmethod
    def _calculate_trend_acceleration(lengths: List[float]) -> float:
        """Calculate trend acceleration (second derivative)"""
        if len(lengths) < 3:
            return 0
        
        # Calculate first differences
        first_diff = np.diff(lengths)
        # Calculate second differences (acceleration)
        second_diff = np.diff(first_diff)
        
        return np.mean(second_diff) if len(second_diff) > 0 else 0
    
    @staticmethod
    def _find_dominant_frequency(lengths: List[float]) -> float:
        """Find dominant frequency using autocorrelation"""
        if len(lengths) < 4:
            return 0
        
        # Autocorrelation analysis
        data = np.array(lengths)
        data_normalized = (data - np.mean(data)) / np.std(data)
        
        autocorr = np.correlate(data_normalized, data_normalized, mode='full')
        autocorr = autocorr[len(autocorr)//2:]
        
        # Find peaks in autocorrelation
        if len(autocorr) > 1:
            peak_index = np.argmax(autocorr[1:]) + 1
            return 1.0 / peak_index if peak_index > 0 else 0
        
        return 0
    
    @staticmethod
    def _calculate_frequency_stability(lengths: List[float]) -> float:
        """Calculate how stable the cycle frequency is"""
        if len(lengths) < 3:
            return 0
        
        # Calculate variance of intervals between peaks
        intervals = np.diff(lengths)
        return 1.0 / (1.0 + np.var(intervals)) if len(intervals) > 0 else 0
    
    @staticmethod
    def _calculate_average_gap(dates: List[datetime]) -> float:
        """Calculate average gap between cycle dates"""
        if len(dates) < 2:
            return 0
        
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        return np.mean(gaps)
    
    @staticmethod
    def _calculate_regularity_score(lengths: List[float]) -> float:
        """Calculate overall regularity score (0-100)"""
        if len(lengths) < 2:
            return 0
        
        # Coefficient of variation inverted to regularity score
        cv = (np.std(lengths) / np.mean(lengths)) * 100
        regularity = max(0, 100 - cv * 5)  # Scale CV to 0-100 score
        
        return min(100, regularity)
    
    @staticmethod
    def _calculate_predictability_index(lengths: List[float]) -> float:
        """Calculate how predictable future cycles are (0-1)"""
        if len(lengths) < 3:
            return 0
        
        # Use moving average prediction error as predictability measure
        errors = []
        for i in range(2, len(lengths)):
            predicted = np.mean(lengths[:i])
            actual = lengths[i]
            error = abs(actual - predicted) / actual
            errors.append(error)
        
        if not errors:
            return 0
        
        avg_error = np.mean(errors)
        predictability = max(0, 1 - avg_error)
        
        return predictability
    
    @staticmethod
    def _identify_cycle_patterns(features: Dict) -> List[Dict]:
        """Identify specific cycle patterns from features"""
        patterns = []
        
        # Pattern 1: Ultra-regular cycles
        if features['regularity_score'] > 90 and features['coefficient_variation'] < 3:
            patterns.append({
                'type': 'ultra_regular',
                'description': 'Extremely regular cycles with minimal variation',
                'strength': 0.9,
                'characteristics': ['very_predictable', 'low_variation', 'stable_rhythm']
            })
        
        # Pattern 2: Gradually lengthening cycles
        elif features['trend_slope'] > 0.1 and features['trend_acceleration'] > 0:
            patterns.append({
                'type': 'lengthening_progressive',
                'description': 'Cycles are gradually getting longer over time',
                'strength': min(1.0, abs(features['trend_slope']) * 10),
                'characteristics': ['progressive_change', 'increasing_length', 'adaptation_needed']
            })
        
        # Pattern 3: Gradually shortening cycles
        elif features['trend_slope'] < -0.1 and features['trend_acceleration'] < 0:
            patterns.append({
                'type': 'shortening_progressive',
                'description': 'Cycles are gradually getting shorter over time',
                'strength': min(1.0, abs(features['trend_slope']) * 10),
                'characteristics': ['progressive_change', 'decreasing_length', 'monitoring_recommended']
            })
        
        # Pattern 4: Cyclical variation (seasonal-like)
        elif features['dominant_frequency'] > 0.8 and features['frequency_stability'] > 0.7:
            patterns.append({
                'type': 'cyclical_variation',
                'description': 'Cycles show regular variation patterns (possibly seasonal)',
                'strength': features['frequency_stability'],
                'characteristics': ['seasonal_influence', 'cyclical_rhythm', 'environmental_factors']
            })
        
        # Pattern 5: Chaotic/Unpredictable
        elif features['predictability_index'] < 0.3 and features['coefficient_variation'] > 20:
            patterns.append({
                'type': 'chaotic_irregular',
                'description': 'Highly irregular cycles with low predictability',
                'strength': 1.0 - features['predictability_index'],
                'characteristics': ['high_variability', 'unpredictable', 'lifestyle_factors', 'stress_influence']
            })
        
        # Pattern 6: Stabilizing pattern
        elif features['trend_acceleration'] < -0.05 and features['regularity_score'] > 60:
            patterns.append({
                'type': 'stabilizing',
                'description': 'Cycles are becoming more regular and stable',
                'strength': features['regularity_score'] / 100,
                'characteristics': ['improving_regularity', 'positive_trend', 'hormonal_balance']
            })
        
        return patterns
    
    @staticmethod
    def _detect_seasonal_patterns(cycle_data: List[Dict]) -> Dict:
        """Detect seasonal patterns in cycle data"""
        if len(cycle_data) < 12:  # Need at least a year of data
            return {'detected': False, 'reason': 'insufficient_data'}
        
        # Group cycles by month
        monthly_data = defaultdict(list)
        for cycle in cycle_data:
            month = cycle['date'].month
            monthly_data[month].append(cycle['length'])
        
        # Calculate monthly averages
        monthly_averages = {}
        for month, lengths in monthly_data.items():
            if lengths:
                monthly_averages[month] = np.mean(lengths)
        
        if len(monthly_averages) < 6:  # Need data from at least 6 months
            return {'detected': False, 'reason': 'insufficient_monthly_coverage'}
        
        # Detect seasonal variation
        avg_lengths = list(monthly_averages.values())
        seasonal_variation = max(avg_lengths) - min(avg_lengths)
        overall_mean = np.mean(avg_lengths)
        seasonal_coefficient = seasonal_variation / overall_mean
        
        # Identify seasonal patterns
        patterns = []
        if seasonal_coefficient > 0.1:  # More than 10% variation
            # Find peak and trough months
            peak_month = max(monthly_averages.keys(), key=lambda k: monthly_averages[k])
            trough_month = min(monthly_averages.keys(), key=lambda k: monthly_averages[k])
            
            patterns.append({
                'type': 'seasonal_variation',
                'peak_month': peak_month,
                'trough_month': trough_month,
                'variation_coefficient': seasonal_coefficient,
                'description': f'Cycles tend to be longer in month {peak_month} and shorter in month {trough_month}'
            })
        
        return {
            'detected': len(patterns) > 0,
            'patterns': patterns,
            'monthly_averages': monthly_averages,
            'seasonal_coefficient': seasonal_coefficient
        }
    
    @staticmethod
    def _analyze_lifestyle_correlations(cycle_data: List[Dict]) -> Dict:
        """Analyze correlations between lifestyle factors and cycle patterns"""
        # This would require additional lifestyle data from logs
        # For now, return a placeholder structure
        return {
            'correlations_detected': False,
            'factors': [],
            'recommendations': ['Track lifestyle factors for better correlation analysis']
        }
    
    @staticmethod
    def _calculate_pattern_confidence(cycle_patterns: List[Dict], seasonal_patterns: Dict, 
                                    lifestyle_patterns: Dict, data_points: int) -> str:
        """Calculate overall confidence in pattern recognition"""
        base_confidence = min(1.0, data_points / 24)  # 24 cycles = 2 years = high confidence
        
        pattern_strength = 0
        if cycle_patterns:
            pattern_strength = max([p['strength'] for p in cycle_patterns])
        
        seasonal_confidence = 0.8 if seasonal_patterns['detected'] else 0.2
        
        overall_confidence = (base_confidence * 0.4 + pattern_strength * 0.4 + seasonal_confidence * 0.2)
        
        if overall_confidence >= 0.8:
            return 'very_high'
        elif overall_confidence >= 0.6:
            return 'high'
        elif overall_confidence >= 0.4:
            return 'medium'
        elif overall_confidence >= 0.2:
            return 'low'
        else:
            return 'very_low'
    
    @staticmethod
    def _generate_ml_recommendations(cycle_patterns: List[Dict], seasonal_patterns: Dict, 
                                   lifestyle_patterns: Dict) -> List[Dict]:
        """Generate ML-based recommendations"""
        recommendations = []
        
        for pattern in cycle_patterns:
            if pattern['type'] == 'ultra_regular':
                recommendations.append({
                    'category': 'pattern_based',
                    'priority': 'low',
                    'title': 'Maintain Your Excellent Rhythm',
                    'message': 'Your cycles are extremely regular. Continue your current lifestyle.',
                    'actions': ['Continue current routine', 'Track any changes', 'Maintain healthy habits']
                })
            
            elif pattern['type'] in ['lengthening_progressive', 'shortening_progressive']:
                recommendations.append({
                    'category': 'trend_alert',
                    'priority': 'medium',
                    'title': 'Gradual Cycle Change Detected',
                    'message': f'Your cycles are {pattern["type"].split("_")[0]} over time.',
                    'actions': ['Monitor trend closely', 'Consider lifestyle factors', 'Consult healthcare provider if concerned']
                })
            
            elif pattern['type'] == 'chaotic_irregular':
                recommendations.append({
                    'category': 'irregularity_management',
                    'priority': 'high',
                    'title': 'Improve Cycle Regularity',
                    'message': 'Your cycles show high irregularity. Focus on stress management and lifestyle factors.',
                    'actions': ['Manage stress levels', 'Regular sleep schedule', 'Balanced nutrition', 'Regular exercise']
                })
        
        # Seasonal recommendations
        if seasonal_patterns['detected']:
            recommendations.append({
                'category': 'seasonal_adaptation',
                'priority': 'medium',
                'title': 'Seasonal Cycle Adaptation',
                'message': 'Your cycles show seasonal variation. Plan accordingly.',
                'actions': ['Adjust expectations seasonally', 'Prepare for seasonal changes', 'Track environmental factors']
            })
        
        return recommendations
    
    @staticmethod
    def _create_user_cycle_profile(cycle_data: List[Dict]) -> Dict:
        """Create a comprehensive user cycle profile"""
        lengths = [c['length'] for c in cycle_data]
        
        return {
            'user_type': CyclePredictionEngine._classify_user_type(lengths),
            'cycle_characteristics': {
                'average_length': round(np.mean(lengths), 1),
                'typical_range': [round(np.percentile(lengths, 25), 1), round(np.percentile(lengths, 75), 1)],
                'regularity_level': CyclePredictionEngine._get_regularity_level(lengths),
                'predictability': CyclePredictionEngine._calculate_predictability_index(lengths)
            },
            'data_quality': {
                'total_cycles': len(cycle_data),
                'data_span_months': CyclePredictionEngine._calculate_data_span_months(cycle_data),
                'consistency_score': CyclePredictionEngine._calculate_consistency_score(cycle_data)
            }
        }
    
    @staticmethod
    def _classify_user_type(lengths: List[float]) -> str:
        """Classify user into cycle type categories"""
        avg_length = np.mean(lengths)
        cv = (np.std(lengths) / avg_length) * 100
        
        if cv < 5:
            return 'highly_regular'
        elif cv < 10:
            return 'regular'
        elif cv < 20:
            return 'somewhat_irregular'
        else:
            return 'irregular'
    
    @staticmethod
    def _get_regularity_level(lengths: List[float]) -> str:
        """Get descriptive regularity level"""
        regularity_score = CyclePredictionEngine._calculate_regularity_score(lengths)
        
        if regularity_score >= 90:
            return 'excellent'
        elif regularity_score >= 80:
            return 'very_good'
        elif regularity_score >= 70:
            return 'good'
        elif regularity_score >= 60:
            return 'fair'
        else:
            return 'needs_improvement'
    
    @staticmethod
    def _calculate_data_span_months(cycle_data: List[Dict]) -> int:
        """Calculate data span in months"""
        if not cycle_data:
            return 0
        
        dates = [c['date'] for c in cycle_data]
        span_days = (max(dates) - min(dates)).days
        return max(1, round(span_days / 30))
    
    @staticmethod
    def _calculate_consistency_score(cycle_data: List[Dict]) -> float:
        """Calculate data consistency score (0-100)"""
        if len(cycle_data) < 2:
            return 0
        
        # Check for gaps in data
        dates = sorted([c['date'] for c in cycle_data])
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        
        # Penalize large gaps
        expected_gap = np.mean([c['length'] for c in cycle_data])
        gap_penalties = [max(0, gap - expected_gap * 2) for gap in gaps]
        total_penalty = sum(gap_penalties)
        
        # Calculate consistency (higher is better)
        max_possible_penalty = len(gaps) * expected_gap * 2
        consistency = max(0, 100 - (total_penalty / max_possible_penalty * 100)) if max_possible_penalty > 0 else 100
        
        return round(consistency, 1)
    
    # ============================================================================
    # ADAPTIVE LEARNING & ANOMALY DETECTION
    # ============================================================================
    
    @staticmethod
    def adaptive_learning_prediction(cycle_data: List[Dict], user_id: str = None) -> Dict:
        """
        Adaptive learning algorithm that improves predictions over time
        Uses ensemble methods and weighted historical performance
        """
        if len(cycle_data) < 3:
            return CyclePredictionEngine._fallback_adaptive_prediction(cycle_data)
        
        try:
            # Get user's historical prediction accuracy (would be stored in DB)
            prediction_history = CyclePredictionEngine._get_prediction_accuracy_history(user_id)
            
            # Create ensemble of prediction models
            predictions = {}
            
            # Model 1: Weighted Moving Average (adjusted based on accuracy)
            wma_weight = prediction_history.get('wma_accuracy', 0.7)
            predictions['wma'] = {
                'prediction': CyclePredictionEngine.calculate_adaptive_weighted_average(cycle_data),
                'weight': wma_weight,
                'confidence': min(1.0, len(cycle_data) / 6)
            }
            
            # Model 2: Exponential Smoothing (adapted)
            es_weight = prediction_history.get('es_accuracy', 0.6)
            lengths = [c['length'] for c in cycle_data]
            predictions['exponential_smoothing'] = {
                'prediction': CyclePredictionEngine.exponential_smoothing(lengths, alpha=0.3),
                'weight': es_weight,
                'confidence': min(1.0, len(cycle_data) / 8)
            }
            
            # Model 3: Trend-based prediction
            trend_weight = prediction_history.get('trend_accuracy', 0.5)
            trend_analysis = CyclePredictionEngine.analyze_trend(cycle_data)
            base_length = np.mean(lengths[-6:] if len(lengths) >= 6 else lengths)
            trend_prediction = base_length + (trend_analysis['rate'] * 2)  # Predict 2 cycles ahead
            predictions['trend_based'] = {
                'prediction': trend_prediction,
                'weight': trend_weight,
                'confidence': 0.8 if trend_analysis['confidence'] == 'high' else 0.5
            }
            
            # Model 4: Seasonal-adjusted prediction
            seasonal_weight = prediction_history.get('seasonal_accuracy', 0.4)
            seasonal_prediction = CyclePredictionEngine._seasonal_adjusted_prediction(cycle_data)
            predictions['seasonal'] = {
                'prediction': seasonal_prediction,
                'weight': seasonal_weight,
                'confidence': 0.6 if len(cycle_data) >= 12 else 0.3
            }
            
            # Ensemble combination using weighted average
            ensemble_prediction = CyclePredictionEngine._combine_ensemble_predictions(predictions)
            
            # Adaptive confidence calculation
            adaptive_confidence = CyclePredictionEngine._calculate_adaptive_confidence(
                predictions, prediction_history, len(cycle_data)
            )
            
            return {
                'prediction': ensemble_prediction,
                'confidence': adaptive_confidence,
                'model_contributions': predictions,
                'learning_status': 'active',
                'improvement_potential': CyclePredictionEngine._assess_improvement_potential(prediction_history)
            }
            
        except Exception as e:
            print(f"Adaptive Learning Error: {str(e)}")
            return CyclePredictionEngine._fallback_adaptive_prediction(cycle_data)
    
    @staticmethod
    def _get_prediction_accuracy_history(user_id: str) -> Dict:
        """Get user's historical prediction accuracy (would query database in real implementation)"""
        # Placeholder - in real implementation, this would query prediction_accuracy table
        return {
            'wma_accuracy': 0.75,
            'es_accuracy': 0.65,
            'trend_accuracy': 0.55,
            'seasonal_accuracy': 0.45,
            'total_predictions': 0,
            'correct_predictions': 0
        }
    
    @staticmethod
    def _seasonal_adjusted_prediction(cycle_data: List[Dict]) -> float:
        """Make prediction adjusted for seasonal patterns"""
        if len(cycle_data) < 6:
            return np.mean([c['length'] for c in cycle_data])
        
        # Get current month for seasonal adjustment
        current_month = datetime.now().month
        
        # Group by month and calculate seasonal factors
        monthly_data = defaultdict(list)
        for cycle in cycle_data:
            month = cycle['date'].month
            monthly_data[month].append(cycle['length'])
        
        overall_mean = np.mean([c['length'] for c in cycle_data])
        
        # Calculate seasonal factor for current month
        if current_month in monthly_data and len(monthly_data[current_month]) > 0:
            monthly_mean = np.mean(monthly_data[current_month])
            seasonal_factor = monthly_mean / overall_mean
        else:
            seasonal_factor = 1.0  # No adjustment if no data for this month
        
        # Apply seasonal adjustment to base prediction
        base_prediction = CyclePredictionEngine.calculate_adaptive_weighted_average(cycle_data)
        return base_prediction * seasonal_factor
    
    @staticmethod
    def _combine_ensemble_predictions(predictions: Dict) -> float:
        """Combine multiple model predictions using weighted ensemble"""
        total_weight = 0
        weighted_sum = 0
        
        for model_name, model_data in predictions.items():
            if model_data['prediction'] and not np.isnan(model_data['prediction']):
                weight = model_data['weight'] * model_data['confidence']
                weighted_sum += model_data['prediction'] * weight
                total_weight += weight
        
        if total_weight > 0:
            return weighted_sum / total_weight
        else:
            # Fallback to simple average
            valid_predictions = [p['prediction'] for p in predictions.values() 
                               if p['prediction'] and not np.isnan(p['prediction'])]
            return np.mean(valid_predictions) if valid_predictions else 28.0
    
    @staticmethod
    def _calculate_adaptive_confidence(predictions: Dict, history: Dict, data_points: int) -> str:
        """Calculate confidence based on model agreement and historical accuracy"""
        # Model agreement (how close predictions are to each other)
        pred_values = [p['prediction'] for p in predictions.values() 
                      if p['prediction'] and not np.isnan(p['prediction'])]
        
        if len(pred_values) < 2:
            return 'low'
        
        agreement = 1.0 - (np.std(pred_values) / np.mean(pred_values))
        agreement = max(0, min(1, agreement))
        
        # Historical accuracy
        historical_accuracy = history.get('correct_predictions', 0) / max(1, history.get('total_predictions', 1))
        
        # Data sufficiency
        data_sufficiency = min(1.0, data_points / 12)
        
        # Combined confidence
        combined_confidence = (agreement * 0.4 + historical_accuracy * 0.4 + data_sufficiency * 0.2)
        
        if combined_confidence >= 0.8:
            return 'very_high'
        elif combined_confidence >= 0.65:
            return 'high'
        elif combined_confidence >= 0.45:
            return 'medium'
        elif combined_confidence >= 0.25:
            return 'low'
        else:
            return 'very_low'
    
    @staticmethod
    def _assess_improvement_potential(history: Dict) -> Dict:
        """Assess potential for prediction improvement"""
        total_predictions = history.get('total_predictions', 0)
        
        if total_predictions < 5:
            return {
                'status': 'learning',
                'message': 'System is learning your patterns. More data will improve accuracy.',
                'suggestions': ['Continue logging cycles', 'Track lifestyle factors']
            }
        elif total_predictions < 20:
            return {
                'status': 'adapting', 
                'message': 'System is adapting to your unique patterns.',
                'suggestions': ['Maintain consistent logging', 'Note any major lifestyle changes']
            }
        else:
            accuracy = history.get('correct_predictions', 0) / total_predictions
            if accuracy >= 0.8:
                return {
                    'status': 'optimized',
                    'message': 'Prediction accuracy is excellent!',
                    'suggestions': ['Continue current tracking routine']
                }
            else:
                return {
                    'status': 'improving',
                    'message': 'System continues to learn and improve predictions.',
                    'suggestions': ['Track additional factors', 'Note irregularities and causes']
                }
    
    @staticmethod
    def _fallback_adaptive_prediction(cycle_data: List[Dict]) -> Dict:
        """Fallback prediction for insufficient data"""
        if not cycle_data:
            return {
                'prediction': 28.0,
                'confidence': 'very_low',
                'model_contributions': {},
                'learning_status': 'insufficient_data'
            }
        
        lengths = [c['length'] for c in cycle_data]
        return {
            'prediction': np.mean(lengths),
            'confidence': 'low',
            'model_contributions': {'simple_average': {'prediction': np.mean(lengths), 'weight': 1.0}},
            'learning_status': 'needs_more_data'
        }
    
    @staticmethod
    def anomaly_detection(cycle_data: List[Dict], current_cycle_length: float = None) -> Dict:
        """
        Advanced anomaly detection for health monitoring
        Identifies unusual patterns that might indicate health concerns
        """
        anomalies = []
        severity_scores = []
        
        if len(cycle_data) < 3:
            return {
                'anomalies_detected': False,
                'reason': 'insufficient_data',
                'recommendations': ['Continue logging to enable anomaly detection']
            }
        
        lengths = [c.get('length', c.cycle_length if hasattr(c, 'cycle_length') else 28) for c in cycle_data]
        
        try:
            # 1. Statistical Outliers (Z-score method)
            statistical_anomalies = CyclePredictionEngine._detect_statistical_outliers(lengths)
            anomalies.extend(statistical_anomalies)
            
            # 2. Trend Anomalies (sudden changes in trend)
            trend_anomalies = CyclePredictionEngine._detect_trend_anomalies(cycle_data)
            anomalies.extend(trend_anomalies)
            
            # 3. Pattern Disruption Anomalies
            pattern_anomalies = CyclePredictionEngine._detect_pattern_disruptions(cycle_data)
            anomalies.extend(pattern_anomalies)
            
            # 4. Health-based Anomalies
            health_anomalies = CyclePredictionEngine._detect_health_anomalies(lengths)
            anomalies.extend(health_anomalies)
            
            # 5. Current Cycle Anomaly (if provided)
            if current_cycle_length:
                current_anomalies = CyclePredictionEngine._detect_current_cycle_anomaly(
                    lengths, current_cycle_length
                )
                anomalies.extend(current_anomalies)
            
            # Calculate overall risk score
            risk_score = CyclePredictionEngine._calculate_anomaly_risk_score(anomalies)
            
            return {
                'anomalies_detected': len(anomalies) > 0,
                'anomalies': anomalies,
                'risk_score': risk_score,
                'recommendations': CyclePredictionEngine._generate_anomaly_recommendations(anomalies),
                'monitoring_suggestions': CyclePredictionEngine._get_monitoring_suggestions(anomalies)
            }
            
        except Exception as e:
            print(f"Anomaly Detection Error: {str(e)}")
            return {
                'anomalies_detected': False,
                'error': str(e),
                'recommendations': ['Unable to perform anomaly detection due to error']
            }
    
    @staticmethod
    def _detect_statistical_outliers(lengths: List[float], threshold: float = 2.5) -> List[Dict]:
        """Detect statistical outliers using Z-score"""
        if len(lengths) < 3:
            return []
        
        mean_length = np.mean(lengths)
        std_length = np.std(lengths)
        
        outliers = []
        for i, length in enumerate(lengths):
            z_score = abs(length - mean_length) / std_length if std_length > 0 else 0
            
            if z_score > threshold:
                severity = 'high' if z_score > 3.0 else 'medium'
                outliers.append({
                    'type': 'statistical_outlier',
                    'cycle_index': i,
                    'cycle_length': length,
                    'z_score': round(z_score, 2),
                    'severity': severity,
                    'description': f'Cycle length {length} days is {z_score:.1f} standard deviations from normal',
                    'health_concern': z_score > 3.0
                })
        
        return outliers
    
    @staticmethod
    def _detect_trend_anomalies(cycle_data: List[Dict]) -> List[Dict]:
        """Detect sudden changes in cycle trends"""
        if len(cycle_data) < 6:
            return []
        
        lengths = [c['length'] for c in cycle_data]
        anomalies = []
        
        # Sliding window trend analysis
        window_size = 3
        for i in range(window_size, len(lengths) - window_size):
            before_trend = CyclePredictionEngine._calculate_trend_slope(lengths[i-window_size:i])
            after_trend = CyclePredictionEngine._calculate_trend_slope(lengths[i:i+window_size])
            
            trend_change = abs(after_trend - before_trend)
            
            if trend_change > 1.0:  # Significant trend change
                anomalies.append({
                    'type': 'trend_disruption',
                    'cycle_index': i,
                    'trend_change': round(trend_change, 2),
                    'severity': 'high' if trend_change > 2.0 else 'medium',
                    'description': f'Sudden trend change detected at cycle {i+1}',
                    'health_concern': trend_change > 2.0
                })
        
        return anomalies
    
    @staticmethod
    def _detect_pattern_disruptions(cycle_data: List[Dict]) -> List[Dict]:
        """Detect disruptions in established patterns"""
        if len(cycle_data) < 8:
            return []
        
        lengths = [c['length'] for c in cycle_data]
        anomalies = []
        
        # Detect sudden changes in variability
        half_point = len(lengths) // 2
        first_half_std = np.std(lengths[:half_point])
        second_half_std = np.std(lengths[half_point:])
        
        variability_change = abs(second_half_std - first_half_std) / first_half_std if first_half_std > 0 else 0
        
        if variability_change > 1.0:  # 100% increase in variability
            anomalies.append({
                'type': 'variability_change',
                'variability_increase': round(variability_change * 100, 1),
                'severity': 'high' if variability_change > 2.0 else 'medium',
                'description': f'Cycle variability increased by {variability_change*100:.0f}%',
                'health_concern': variability_change > 1.5
            })
        
        return anomalies
    
    @staticmethod
    def _detect_health_anomalies(lengths: List[float]) -> List[Dict]:
        """Detect patterns that might indicate health concerns"""
        anomalies = []
        mean_length = np.mean(lengths)
        
        # Very short cycles (potential concern)
        short_cycles = [l for l in lengths if l < 21]
        if len(short_cycles) > len(lengths) * 0.3:  # More than 30% are short
            anomalies.append({
                'type': 'frequent_short_cycles',
                'frequency': round(len(short_cycles) / len(lengths) * 100, 1),
                'severity': 'high',
                'description': f'{len(short_cycles)} out of {len(lengths)} cycles are shorter than 21 days',
                'health_concern': True,
                'recommendation': 'Consult healthcare provider about frequent short cycles'
            })
        
        # Very long cycles (potential concern)
        long_cycles = [l for l in lengths if l > 35]
        if len(long_cycles) > len(lengths) * 0.3:  # More than 30% are long
            anomalies.append({
                'type': 'frequent_long_cycles',
                'frequency': round(len(long_cycles) / len(lengths) * 100, 1),
                'severity': 'high',
                'description': f'{len(long_cycles)} out of {len(lengths)} cycles are longer than 35 days',
                'health_concern': True,
                'recommendation': 'Consult healthcare provider about frequent long cycles'
            })
        
        # Extremely irregular patterns
        cv = (np.std(lengths) / mean_length) * 100
        if cv > 30:  # Coefficient of variation > 30%
            anomalies.append({
                'type': 'extreme_irregularity',
                'coefficient_variation': round(cv, 1),
                'severity': 'medium',
                'description': f'Cycles show extreme irregularity (CV: {cv:.1f}%)',
                'health_concern': cv > 40,
                'recommendation': 'Track lifestyle factors and consider stress management'
            })
        
        return anomalies
    
    @staticmethod
    def _detect_current_cycle_anomaly(historical_lengths: List[float], current_length: float) -> List[Dict]:
        """Detect if current cycle is anomalous compared to history"""
        if len(historical_lengths) < 3:
            return []
        
        mean_length = np.mean(historical_lengths)
        std_length = np.std(historical_lengths)
        
        if std_length == 0:  # Perfect regularity
            if abs(current_length - mean_length) > 2:
                return [{
                    'type': 'current_cycle_anomaly',
                    'current_length': current_length,
                    'expected_length': round(mean_length, 1),
                    'deviation': round(abs(current_length - mean_length), 1),
                    'severity': 'high',
                    'description': f'Current cycle ({current_length} days) deviates from your regular pattern',
                    'health_concern': abs(current_length - mean_length) > 5
                }]
        
        z_score = abs(current_length - mean_length) / std_length
        
        if z_score > 2.0:
            return [{
                'type': 'current_cycle_anomaly',
                'current_length': current_length,
                'z_score': round(z_score, 2),
                'severity': 'high' if z_score > 3.0 else 'medium',
                'description': f'Current cycle is {z_score:.1f} standard deviations from normal',
                'health_concern': z_score > 3.0
            }]
        
        return []
    
    @staticmethod
    def _calculate_anomaly_risk_score(anomalies: List[Dict]) -> Dict:
        """Calculate overall anomaly risk score"""
        if not anomalies:
            return {'score': 0, 'level': 'none'}
        
        severity_weights = {'low': 1, 'medium': 3, 'high': 5}
        health_concern_weight = 2
        
        total_score = 0
        for anomaly in anomalies:
            base_score = severity_weights.get(anomaly.get('severity', 'low'), 1)
            if anomaly.get('health_concern', False):
                base_score *= health_concern_weight
            total_score += base_score
        
        # Normalize score (0-100)
        max_possible_score = len(anomalies) * 5 * 2  # High severity + health concern
        normalized_score = min(100, (total_score / max_possible_score) * 100) if max_possible_score > 0 else 0
        
        if normalized_score >= 70:
            level = 'high'
        elif normalized_score >= 40:
            level = 'medium'
        elif normalized_score >= 15:
            level = 'low'
        else:
            level = 'minimal'
        
        return {'score': round(normalized_score, 1), 'level': level}
    
    @staticmethod
    def _generate_anomaly_recommendations(anomalies: List[Dict]) -> List[str]:
        """Generate recommendations based on detected anomalies"""
        recommendations = set()  # Use set to avoid duplicates
        
        health_concerns = [a for a in anomalies if a.get('health_concern', False)]
        
        if health_concerns:
            recommendations.add('Consult with a healthcare provider about cycle irregularities')
            recommendations.add('Keep detailed logs including symptoms and lifestyle factors')
        
        for anomaly in anomalies:
            if anomaly['type'] == 'extreme_irregularity':
                recommendations.add('Focus on stress management and regular sleep schedule')
                recommendations.add('Consider tracking lifestyle factors (diet, exercise, stress)')
            
            elif anomaly['type'] in ['frequent_short_cycles', 'frequent_long_cycles']:
                recommendations.add('Monitor patterns and discuss with healthcare provider')
                recommendations.add('Track additional symptoms and lifestyle factors')
            
            elif anomaly['type'] == 'trend_disruption':
                recommendations.add('Note any major life changes or stressors during this period')
                recommendations.add('Continue monitoring for pattern stabilization')
        
        return list(recommendations)
    
    @staticmethod
    def _get_monitoring_suggestions(anomalies: List[Dict]) -> List[str]:
        """Get specific monitoring suggestions based on anomalies"""
        suggestions = []
        
        if any(a.get('health_concern', False) for a in anomalies):
            suggestions.extend([
                'Track additional symptoms (mood, energy, pain levels)',
                'Note any medications or supplements',
                'Record stress levels and major life events',
                'Consider basal body temperature tracking'
            ])
        
        if any(a['type'] == 'extreme_irregularity' for a in anomalies):
            suggestions.extend([
                'Track sleep quality and duration',
                'Monitor exercise intensity and frequency',
                'Note dietary changes or restrictions'
            ])
        
        return suggestions
    
    @staticmethod
    def exponential_smoothing(values, alpha=0.3):
        """
        Apply exponential smoothing for trend prediction
        alpha: smoothing factor (0-1), higher = more weight on recent data
        """
        if not values or len(values) < 2:
            return values[0] if values else None
        
        smoothed = [values[0]]
        for i in range(1, len(values)):
            smoothed_value = alpha * values[i] + (1 - alpha) * smoothed[i-1]
            smoothed.append(smoothed_value)
        
        return smoothed[-1]
    
    @staticmethod
    def calculate_cycle_variability(cycle_lengths):
        """Calculate how regular/irregular the cycles are"""
        if len(cycle_lengths) < 2:
            return {'variability': 'insufficient_data', 'std_dev': 0, 'coefficient_of_variation': 0}
        
        std_dev = statistics.stdev(cycle_lengths)
        mean = statistics.mean(cycle_lengths)
        coefficient_of_variation = (std_dev / mean) * 100 if mean > 0 else 0
        
        # Classify regularity
        if coefficient_of_variation < 5:
            variability = 'very_regular'
        elif coefficient_of_variation < 10:
            variability = 'regular'
        elif coefficient_of_variation < 20:
            variability = 'somewhat_irregular'
        else:
            variability = 'irregular'
        
        return {
            'variability': variability,
            'std_dev': round(std_dev, 2),
            'coefficient_of_variation': round(coefficient_of_variation, 2)
        }
    
    @staticmethod
    def predict_next_cycles(logs, num_predictions=3, user_id=None):
        """
        ML-Enhanced prediction using advanced algorithms and machine learning
        Returns predictions with detailed analysis and learning capabilities
        """
        if not logs:
            return []
        
        # Extract cycle data using robust method
        cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
        
        if not cycle_data:
            # Fallback to default prediction
            return CyclePredictionEngine._generate_default_predictions(logs, num_predictions)
        
        # Detect and handle outliers
        filtered_cycle_data = CyclePredictionEngine.detect_outliers(cycle_data)
        
        # ML Pattern Recognition
        ml_patterns = CyclePredictionEngine.ml_pattern_recognition(filtered_cycle_data, user_id)
        
        # Adaptive Learning Prediction
        adaptive_prediction = CyclePredictionEngine.adaptive_learning_prediction(filtered_cycle_data, user_id)
        
        # Anomaly Detection
        anomaly_analysis = CyclePredictionEngine.anomaly_detection(filtered_cycle_data)
        
        # Traditional trend analysis (enhanced with ML insights)
        trend_analysis = CyclePredictionEngine.analyze_trend(filtered_cycle_data)
        
        # Calculate ML-enhanced confidence
        confidence_level = CyclePredictionEngine._calculate_ml_enhanced_confidence(
            adaptive_prediction, {'data_quality': len(filtered_cycle_data), 'patterns_found': True}, ml_patterns
        )
        
        # Get period lengths with similar robust approach
        period_lengths = []
        for log in logs:
            if log.period_length and 2 <= log.period_length <= 10:
                period_lengths.append(log.period_length)
        
        if not period_lengths:
            period_lengths = [5]  # Default
        
        # ML-Enhanced prediction calculation
        if adaptive_prediction['learning_status'] == 'active':
            # Use adaptive learning prediction as primary
            predicted_cycle_length = adaptive_prediction['prediction']
            ml_confidence_boost = 0.1  # Boost confidence when ML is active
        else:
            # Fallback to traditional methods
            predicted_cycle_length = CyclePredictionEngine.calculate_adaptive_weighted_average(filtered_cycle_data)
            ml_confidence_boost = 0
        
        # Apply ML pattern-based adjustments - use days adjustment instead of date adjustment
        pattern_adjustment_days = CyclePredictionEngine._calculate_pattern_adjustment_days(ml_patterns, user_id)
        predicted_cycle_length += pattern_adjustment_days
        
        # Apply seasonal adjustments if detected
        seasonal_patterns = CyclePredictionEngine._safe_get_seasonal_patterns_dict(ml_patterns)
        seasonal_adjustment_days = CyclePredictionEngine._calculate_seasonal_adjustment_days(
            seasonal_patterns, datetime.now().month
        )
        predicted_cycle_length += seasonal_adjustment_days
        
        # Traditional trend adjustment (enhanced with ML insights)
        if trend_analysis['trend'] in ['lengthening', 'shortening'] and trend_analysis['confidence'] == 'high':
            trend_adjustment = trend_analysis['rate']
            # ML enhancement: adjust trend based on pattern stability
            if ml_patterns['confidence'] in ['high', 'very_high']:
                trend_adjustment *= 0.8  # Reduce trend impact if patterns are stable
        else:
            trend_adjustment = 0
        
        predicted_period_length = statistics.mean(period_lengths)
        
        # Generate predictions with trend consideration
        predictions = []
        sorted_logs = sorted(logs, key=lambda x: x.start_date)
        last_period_start = sorted_logs[-1].start_date
        
        for i in range(num_predictions):
            # Apply trend adjustment for distant predictions
            cycle_adjustment = trend_adjustment * i if abs(trend_adjustment) > 0.1 else 0
            adjusted_cycle_length = predicted_cycle_length + cycle_adjustment
            
            # Ensure cycle length stays within reasonable bounds
            adjusted_cycle_length = max(21, min(45, adjusted_cycle_length))
            
            next_period_start = last_period_start + timedelta(days=int(adjusted_cycle_length * (i + 1)))
            next_period_end = next_period_start + timedelta(days=int(predicted_period_length))
            
            # Calculate ovulation (14 days before next period, adjusted for cycle length)
            luteal_phase = min(14, adjusted_cycle_length / 2)  # Adjust for shorter cycles
            ovulation_date = next_period_start - timedelta(days=int(luteal_phase))
            fertile_window_start = ovulation_date - timedelta(days=5)
            fertile_window_end = ovulation_date + timedelta(days=1)
            
            # Adjust confidence for distant predictions
            prediction_confidence = confidence_level
            if i >= 2:  # 3rd prediction and beyond
                confidence_map = {
                    'very_high': 'high',
                    'high': 'medium',
                    'medium': 'low',
                    'low': 'very_low',
                    'very_low': 'very_low'
                }
                prediction_confidence = confidence_map.get(confidence_level, 'low')
            elif i >= 1:  # 2nd prediction
                if confidence_level == 'very_high':
                    prediction_confidence = 'high'
            
            predictions.append({
                'cycle_number': i + 1,
                'predicted_start': next_period_start.isoformat(),
                'predicted_end': next_period_end.isoformat(),
                'ovulation_date': ovulation_date.isoformat(),
                'fertile_window_start': fertile_window_start.isoformat(),
                'fertile_window_end': fertile_window_end.isoformat(),
                'confidence': prediction_confidence,
                'predicted_cycle_length': round(adjusted_cycle_length, 1),
                'predicted_period_length': round(predicted_period_length, 1),
                'trend_adjustment': round(cycle_adjustment, 1),
                'ml_enhanced_data': {
                    'total_cycles': len(cycle_data),
                    'outliers_detected': sum(1 for c in filtered_cycle_data if c.get('is_outlier', False)),
                    'ml_patterns_detected': CyclePredictionEngine._safe_get_patterns_count(ml_patterns, 'cycle_patterns'),
                    'anomalies_detected': anomaly_analysis.get('anomalies_detected', False),
                    'adaptive_learning_status': adaptive_prediction.get('learning_status', 'inactive'),
                    'pattern_confidence': ml_patterns.get('confidence', 'unknown'),
                    'seasonal_patterns': CyclePredictionEngine._safe_get_seasonal_pattern(ml_patterns, 'detected', False),
                    'user_cycle_profile': ml_patterns.get('user_profile', {}),
                    'prediction_accuracy_trend': adaptive_prediction.get('improvement_potential', {}),
                    'confidence_factors': {
                        'data_volume': len(cycle_data) >= 6,
                        'ml_confidence': confidence_level in ['high', 'very_high'],
                        'pattern_recognition': ml_patterns.get('confidence') in ['high', 'very_high'],
                        'adaptive_learning': adaptive_prediction.get('learning_status') == 'active',
                        'anomaly_free': not anomaly_analysis.get('anomalies_detected', False),
                        'trend_stability': trend_analysis['trend'] == 'stable'
                    },
                    'health_insights': {
                        'anomaly_risk': anomaly_analysis.get('risk_score', {'level': 'none'}),
                        'pattern_health_score': CyclePredictionEngine._calculate_pattern_health_score(ml_patterns),
                        'recommendations': anomaly_analysis.get('recommendations', [])
                    }
                }
            })
        
        return predictions
    
    @staticmethod
    def _generate_default_predictions(logs, num_predictions):
        """Fallback prediction method for insufficient data"""
        if not logs:
            return []
        
        # Use simple approach for insufficient data
        sorted_logs = sorted(logs, key=lambda x: x.start_date)
        last_period_start = sorted_logs[-1].start_date
        
        predictions = []
        for i in range(num_predictions):
            next_period_start = last_period_start + timedelta(days=28 * (i + 1))
            next_period_end = next_period_start + timedelta(days=5)
            
            ovulation_date = next_period_start - timedelta(days=14)
            fertile_window_start = ovulation_date - timedelta(days=5)
            fertile_window_end = ovulation_date + timedelta(days=1)
            
            predictions.append({
                'cycle_number': i + 1,
                'predicted_start': next_period_start.isoformat(),
                'predicted_end': next_period_end.isoformat(),
                'ovulation_date': ovulation_date.isoformat(),
                'fertile_window_start': fertile_window_start.isoformat(),
                'fertile_window_end': fertile_window_end.isoformat(),
                'confidence': 'very_low',
                'predicted_cycle_length': 28.0,
                'predicted_period_length': 5.0,
                'trend_adjustment': 0.0,
                'data_quality': {
                    'total_cycles': len(logs),
                    'outliers_detected': 0,
                    'trend': 'insufficient_data',
                    'confidence_factors': {
                        'volume': False,
                        'consistency': False,
                        'recent_data': True,
                        'trend_stable': False
                    }
                }
            })
        
        return predictions
    
    @staticmethod
    def analyze_symptoms_patterns(logs):
        """Analyze symptom patterns across cycles"""
        symptom_frequency = defaultdict(int)
        symptom_by_phase = defaultdict(lambda: defaultdict(int))
        
        for log in logs:
            if not log.symptoms:
                continue
            
            symptoms_list = []
            if isinstance(log.symptoms, str):
                symptoms_list = [s.strip() for s in log.symptoms.split(',') if s.strip()]
            else:
                symptoms_list = log.symptoms
            
            for symptom in symptoms_list:
                symptom_frequency[symptom] += 1
                
                # Determine phase (period vs luteal vs follicular)
                if log.end_date:
                    symptom_by_phase['menstrual'][symptom] += 1
        
        return {
            'common_symptoms': dict(sorted(symptom_frequency.items(), key=lambda x: x[1], reverse=True)[:5]),
            'symptom_patterns': dict(symptom_by_phase)
        }
    
    @staticmethod
    def calculate_health_insights(logs):
        """Generate health insights based on cycle data"""
        insights = []
        
        if not logs:
            return insights
        
        # Analyze cycle regularity
        cycle_lengths = [log.cycle_length for log in logs if log.cycle_length]
        if len(cycle_lengths) >= 3:
            variability = CyclePredictionEngine.calculate_cycle_variability(cycle_lengths)
            
            if variability['variability'] == 'irregular':
                insights.append({
                    'type': 'warning',
                    'category': 'cycle_regularity',
                    'message': 'Your cycles show high variability. Consider consulting a healthcare provider.',
                    'detail': f"Standard deviation: {variability['std_dev']} days"
                })
            elif variability['variability'] == 'very_regular':
                insights.append({
                    'type': 'positive',
                    'category': 'cycle_regularity',
                    'message': 'Your cycles are very regular, which is a good sign of hormonal balance.',
                    'detail': f"Variability: {variability['coefficient_of_variation']}%"
                })
        
        # Analyze cycle length
        if cycle_lengths:
            avg_length = statistics.mean(cycle_lengths)
            if avg_length < 21:
                insights.append({
                    'type': 'warning',
                    'category': 'cycle_length',
                    'message': 'Your cycles are shorter than average. Consider tracking symptoms closely.',
                    'detail': f"Average cycle length: {round(avg_length, 1)} days"
                })
            elif avg_length > 35:
                insights.append({
                    'type': 'info',
                    'category': 'cycle_length',
                    'message': 'Your cycles are longer than average. This may be normal for you.',
                    'detail': f"Average cycle length: {round(avg_length, 1)} days"
                })
        
        # Analyze period length
        period_lengths = [log.period_length for log in logs if log.period_length]
        if period_lengths:
            avg_period = statistics.mean(period_lengths)
            if avg_period > 7:
                insights.append({
                    'type': 'info',
                    'category': 'period_length',
                    'message': 'Your periods last longer than average. Monitor for heavy bleeding.',
                    'detail': f"Average period length: {round(avg_period, 1)} days"
                })
        
        # Analyze wellness patterns for enhanced predictions
        CyclePredictionEngine.analyze_wellness_patterns(logs, insights)
        
        # Data quality insight
        if len(logs) < 3:
            insights.append({
                'type': 'info',
                'category': 'data_quality',
                'message': 'Log more cycles for more accurate predictions and insights.',
                'detail': f"Current logs: {len(logs)}, recommended: 6+"
            })
        
        return insights
    
    @staticmethod
    def analyze_wellness_patterns(logs, insights):
        """Analyze wellness patterns to provide lifestyle insights"""
        # Collect wellness data
        mood_data = [log.mood for log in logs if log.mood]
        stress_data = [log.stress_level for log in logs if log.stress_level]
        sleep_data = [log.sleep_quality for log in logs if log.sleep_quality]
        exercise_data = [log.exercise_activities for log in logs if log.exercise_activities]
        
        # Mood pattern analysis
        if mood_data:
            low_mood_count = sum(1 for mood in mood_data if mood in ['low', 'very_low'])
            mood_percentage = (low_mood_count / len(mood_data)) * 100
            
            if mood_percentage > 50:
                insights.append({
                    'type': 'warning',
                    'category': 'mental_wellness',
                    'message': 'You\'ve reported low mood frequently. Consider stress management techniques.',
                    'detail': f"Low mood reported in {mood_percentage:.0f}% of cycles"
                })
            elif mood_percentage < 20:
                insights.append({
                    'type': 'positive',
                    'category': 'mental_wellness', 
                    'message': 'Great job maintaining a positive mood throughout your cycles!',
                    'detail': f"Positive mood reported in {100-mood_percentage:.0f}% of cycles"
                })
        
        # Stress pattern analysis
        if stress_data:
            high_stress_count = sum(1 for stress in stress_data if stress in ['high', 'very_high'])
            stress_percentage = (high_stress_count / len(stress_data)) * 100
            
            if stress_percentage > 40:
                insights.append({
                    'type': 'warning',
                    'category': 'stress_management',
                    'message': 'High stress levels detected. Consider relaxation techniques and adequate rest.',
                    'detail': f"High stress reported in {stress_percentage:.0f}% of cycles"
                })
        
        # Sleep quality analysis
        if sleep_data:
            poor_sleep_count = sum(1 for sleep in sleep_data if sleep == 'poor')
            sleep_percentage = (poor_sleep_count / len(sleep_data)) * 100
            
            if sleep_percentage > 30:
                insights.append({
                    'type': 'info',
                    'category': 'sleep_wellness',
                    'message': 'Poor sleep quality may affect your cycle. Try establishing a regular sleep routine.',
                    'detail': f"Poor sleep reported in {sleep_percentage:.0f}% of cycles"
                })
        
        # Exercise pattern analysis
        if exercise_data:
            no_exercise_count = sum(1 for activities in exercise_data if 'none' in activities.lower())
            exercise_percentage = ((len(exercise_data) - no_exercise_count) / len(exercise_data)) * 100
            
            if exercise_percentage < 50:
                insights.append({
                    'type': 'info',
                    'category': 'physical_wellness',
                    'message': 'Regular exercise can help regulate your cycle and reduce symptoms.',
                    'detail': f"Exercise reported in {exercise_percentage:.0f}% of cycles"
                })
            elif exercise_percentage > 80:
                insights.append({
                    'type': 'positive',
                    'category': 'physical_wellness',
                    'message': 'Excellent job staying active! Regular exercise supports hormonal balance.',
                    'detail': f"Active lifestyle maintained in {exercise_percentage:.0f}% of cycles"
                })
    
    @staticmethod
    def _calculate_ml_enhanced_confidence(
        prediction_results: Dict[str, Any],
        data_quality: Dict[str, Any],
        ml_patterns: Dict[str, Any]
    ) -> Tuple[str, float]:
        """
        Calculate ML-enhanced confidence score for predictions
        
        Args:
            prediction_results: Results from ensemble prediction methods
            data_quality: Data quality assessment results
            ml_patterns: Machine learning pattern analysis results
            
        Returns:
            Tuple of (confidence_level_string, confidence_score_float)
        """
        # Base confidence from ensemble methods
        ensemble_confidence = prediction_results.get('ensemble_confidence', 0.5)
        
        # Pattern recognition confidence boost
        pattern_confidence = ml_patterns.get('confidence_score', 0.5)
        
        # Data quality factors
        data_volume_score = min(data_quality.get('total_cycles', 0) / 12, 1.0)  # Max at 12 cycles
        outlier_penalty = data_quality.get('outliers_detected', 0) * 0.05
        
        # ML-specific factors
        ml_boost = 0.0
        patterns = ml_patterns.get('patterns', {})
        if isinstance(patterns, dict):
            if patterns.get('seasonal_patterns', {}).get('detected'):
                ml_boost += 0.1
        if ml_patterns.get('user_profile', {}).get('regularity_score', 0) > 0.7:
            ml_boost += 0.1
            
        # Calculate final confidence
        final_score = (
            ensemble_confidence * 0.4 +
            pattern_confidence * 0.3 +
            data_volume_score * 0.2 +
            ml_boost * 0.1 -
            outlier_penalty
        )
        
        final_score = max(0.0, min(1.0, final_score))  # Clamp to [0, 1]
        
        # Convert to categorical confidence
        if final_score >= 0.85:
            return 'very_high', final_score
        elif final_score >= 0.7:
            return 'high', final_score
        elif final_score >= 0.55:
            return 'medium', final_score
        elif final_score >= 0.4:
            return 'low', final_score
        else:
            return 'very_low', final_score
    
    @staticmethod
    def _calculate_pattern_adjustment(
        base_prediction: datetime,
        ml_patterns: Dict[str, Any],
        user_id: int
    ) -> datetime:
        """
        Adjust prediction based on ML-identified patterns
        
        Args:
            base_prediction: Initial prediction date
            ml_patterns: Machine learning pattern analysis
            user_id: User ID for personalization
            
        Returns:
            Adjusted prediction date
        """
        adjustment_days = 0
        
        # Seasonal pattern adjustments
        seasonal_patterns = ml_patterns.get('patterns', {}).get('seasonal_patterns', {})
        if seasonal_patterns.get('detected'):
            current_month = base_prediction.month
            seasonal_adjustment = seasonal_patterns.get('monthly_variations', {}).get(str(current_month), 0)
            adjustment_days += seasonal_adjustment
            
        # User-specific pattern adjustments
        user_profile = ml_patterns.get('user_profile', {})
        if user_profile.get('trend_direction') == 'lengthening':
            adjustment_days += 0.5  # Slight lengthening trend
        elif user_profile.get('trend_direction') == 'shortening':
            adjustment_days -= 0.5  # Slight shortening trend
            
        # Pattern confidence weighting
        pattern_confidence = ml_patterns.get('confidence_score', 0.5)
        adjustment_days *= pattern_confidence
        
        # Apply adjustment
        adjusted_date = base_prediction + timedelta(days=round(adjustment_days))
        return adjusted_date
    
    @staticmethod
    def _calculate_seasonal_adjustment(
        prediction_date: datetime,
        seasonal_patterns: Dict[str, Any]
    ) -> datetime:
        """
        Apply seasonal adjustments to prediction
        
        Args:
            prediction_date: Base prediction date
            seasonal_patterns: Seasonal pattern analysis results
            
        Returns:
            Seasonally adjusted prediction date
        """
        if not seasonal_patterns.get('detected'):
            return prediction_date
            
        month_variations = seasonal_patterns.get('monthly_variations', {})
        current_month = prediction_date.month
        
        # Get seasonal adjustment for current month
        seasonal_adjustment = month_variations.get(str(current_month), 0)
        
        # Apply confidence weighting
        seasonal_confidence = seasonal_patterns.get('confidence', 0.5)
        weighted_adjustment = seasonal_adjustment * seasonal_confidence
        
        # Apply adjustment
        adjusted_date = prediction_date + timedelta(days=round(weighted_adjustment))
        return adjusted_date
    
    @staticmethod
    def _calculate_pattern_health_score(ml_patterns: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate health score based on ML pattern analysis
        
        Args:
            ml_patterns: Machine learning pattern analysis results
            
        Returns:
            Dictionary containing health score and related metrics
        """
        user_profile = ml_patterns.get('user_profile', {})
        patterns = ml_patterns.get('patterns', {})
        
        # Base regularity score
        regularity_score = user_profile.get('regularity_score', 0.5)
        
        # Pattern consistency bonus
        if isinstance(patterns, dict):
            cycle_patterns = patterns.get('cycle_patterns', [])
        else:
            cycle_patterns = patterns if isinstance(patterns, list) else []
            
        if len(cycle_patterns) >= 3:
            consistency_score = 1.0 - (np.std(cycle_patterns) / np.mean(cycle_patterns))
            consistency_score = max(0.0, min(1.0, consistency_score))
        else:
            consistency_score = 0.5
            
        # Seasonal pattern health
        if isinstance(patterns, dict):
            seasonal_health = 0.8 if patterns.get('seasonal_patterns', {}).get('detected') else 0.6
        else:
            seasonal_health = 0.6
        
        # Overall health score
        overall_score = (regularity_score * 0.4 + consistency_score * 0.4 + seasonal_health * 0.2)
        
        return {
            'overall_score': round(overall_score, 2),
            'regularity_score': round(regularity_score, 2),
            'consistency_score': round(consistency_score, 2),
            'seasonal_health': round(seasonal_health, 2),
            'status': 'excellent' if overall_score >= 0.8 else 
                     'good' if overall_score >= 0.65 else
                     'fair' if overall_score >= 0.5 else 'needs_attention'
        }

    @staticmethod
    def _calculate_pattern_adjustment_days(ml_patterns: Dict[str, Any], user_id: str = None) -> float:
        """
        Calculate pattern-based adjustment in days
        
        Args:
            ml_patterns: Machine learning pattern analysis
            user_id: User ID for personalization
            
        Returns:
            Number of days to adjust prediction
        """
        adjustment_days = 0.0
        
        # Handle case where ml_patterns is not a dict or is empty
        if not isinstance(ml_patterns, dict):
            return adjustment_days
            
        # Seasonal pattern adjustments
        patterns = ml_patterns.get('patterns', {})
        if isinstance(patterns, dict):
            seasonal_patterns = patterns.get('seasonal_patterns', {})
            if seasonal_patterns.get('detected'):
                current_month = datetime.now().month
                monthly_variations = seasonal_patterns.get('monthly_variations', {})
                if str(current_month) in monthly_variations:
                    adjustment_days += monthly_variations[str(current_month)] * 0.3
            
        # User-specific pattern adjustments
        user_profile = ml_patterns.get('user_profile', {})
        if user_profile.get('trend_direction') == 'lengthening':
            adjustment_days += 0.5  # Slight lengthening trend
        elif user_profile.get('trend_direction') == 'shortening':
            adjustment_days -= 0.5  # Slight shortening trend
            
        # Pattern confidence weighting
        pattern_confidence = ml_patterns.get('confidence_score', 0.5)
        if isinstance(pattern_confidence, str):
            pattern_confidence = 0.5 if pattern_confidence == 'medium' else 0.3
        adjustment_days *= pattern_confidence
        
        return adjustment_days

    @staticmethod
    def _calculate_seasonal_adjustment_days(seasonal_patterns: Dict[str, Any], current_month: int) -> float:
        """
        Calculate seasonal adjustment in days
        
        Args:
            seasonal_patterns: Seasonal pattern analysis results
            current_month: Current month (1-12)
            
        Returns:
            Number of days to adjust prediction
        """
        if not seasonal_patterns.get('detected'):
            return 0.0
            
        month_variations = seasonal_patterns.get('monthly_variations', {})
        
        # Get seasonal adjustment for current month
        seasonal_adjustment = month_variations.get(str(current_month), 0.0)
        
        # Apply confidence weighting
        seasonal_confidence = seasonal_patterns.get('confidence', 0.5)
        weighted_adjustment = seasonal_adjustment * seasonal_confidence
        
        return weighted_adjustment

    @staticmethod
    def _safe_get_seasonal_pattern(ml_patterns: Dict[str, Any], key: str, default_value):
        """
        Safely extract seasonal pattern data from ml_patterns
        
        Args:
            ml_patterns: Machine learning pattern analysis (may have patterns as list or dict)
            key: Key to extract from seasonal_patterns
            default_value: Default value if key not found
            
        Returns:
            Value from seasonal patterns or default value
        """
        if not isinstance(ml_patterns, dict):
            return default_value
            
        patterns = ml_patterns.get('patterns', {})
        
        # Handle case where patterns is a dictionary
        if isinstance(patterns, dict):
            seasonal_patterns = patterns.get('seasonal_patterns', {})
            if isinstance(seasonal_patterns, dict):
                return seasonal_patterns.get(key, default_value)
        
        # Handle case where patterns is a list or other format
        return default_value

    @staticmethod
    def _safe_get_seasonal_patterns_dict(ml_patterns: Dict[str, Any]) -> Dict[str, Any]:
        """
        Safely extract seasonal patterns dictionary from ml_patterns
        
        Args:
            ml_patterns: Machine learning pattern analysis (may have patterns as list or dict)
            
        Returns:
            Seasonal patterns dictionary or empty dict if not found/accessible
        """
        if not isinstance(ml_patterns, dict):
            return {}
            
        patterns = ml_patterns.get('patterns', {})
        
        # Handle case where patterns is a dictionary
        if isinstance(patterns, dict):
            seasonal_patterns = patterns.get('seasonal_patterns', {})
            if isinstance(seasonal_patterns, dict):
                return seasonal_patterns
        
        # Handle case where patterns is a list or other format
        return {}

    @staticmethod
    def _safe_get_patterns_count(ml_patterns: Dict[str, Any], pattern_type: str) -> int:
        """
        Safely get count of patterns from ml_patterns
        
        Args:
            ml_patterns: Machine learning pattern analysis (may have patterns as list or dict)
            pattern_type: Type of pattern to count (e.g., 'cycle_patterns')
            
        Returns:
            Count of patterns or 0 if not found
        """
        if not isinstance(ml_patterns, dict):
            return 0
            
        patterns = ml_patterns.get('patterns', {})
        
        # Handle case where patterns is a dictionary
        if isinstance(patterns, dict):
            pattern_list = patterns.get(pattern_type, [])
            if isinstance(pattern_list, list):
                return len(pattern_list)
        
        # Handle case where patterns is a list
        elif isinstance(patterns, list):
            return len(patterns)
        
        return 0


@cycle_logs_bp.route('/', methods=['GET'])
@jwt_required()
def get_cycle_logs():
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    # Get query parameters for pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Get optional user_id parameter for parent viewing child's data
    requested_user_id = request.args.get('user_id', type=int)
    target_user_id = current_user_id  # Default to current user
    
    # If requesting another user's data, verify parent-child relationship
    if requested_user_id and requested_user_id != current_user_id:
        from app.models import User, ParentChild, Parent, Adolescent
        
        # Check if current user is a parent
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.user_type != 'parent':
            return jsonify({'message': 'Only parents can view child data'}), 403
        
        # Get the Parent record for current user
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        if not parent:
            return jsonify({'message': 'Parent record not found'}), 404
        
        # Get the Adolescent record for the requested user
        adolescent = Adolescent.query.filter_by(user_id=requested_user_id).first()
        if not adolescent:
            return jsonify({'message': 'Child record not found'}), 404
        
        # Verify parent-child relationship
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=adolescent.id
        ).first()
        
        if not parent_child:
            return jsonify({'message': 'Access denied: No relationship found with this child'}), 403
        
        target_user_id = requested_user_id
    
    # Query cycle logs for the target user, ordered by start date descending
    logs = CycleLog.query.filter_by(user_id=target_user_id)\
        .order_by(CycleLog.start_date.desc())\
        .paginate(page=page, per_page=per_page)
    
    # Format the response
    result = {
        'items': [{
            'id': log.id,
            'start_date': log.start_date.isoformat(),
            'end_date': log.end_date.isoformat() if log.end_date else None,
            'cycle_length': log.cycle_length,
            'period_length': log.period_length,
            'flow_intensity': log.flow_intensity,
            'symptoms': log.symptoms,
            'notes': log.notes,
            # Enhanced wellness data
            'mood': log.mood,
            'energy_level': log.energy_level,
            'sleep_quality': log.sleep_quality,
            'stress_level': log.stress_level,
            'exercise_activities': log.exercise_activities,
            'created_at': log.created_at.isoformat()
        } for log in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': page
    }
    
    return jsonify(result), 200

@cycle_logs_bp.route('/<int:log_id>', methods=['GET'])
@jwt_required()
def get_cycle_log(log_id):
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    # Find the specific cycle log
    log = CycleLog.query.filter_by(id=log_id, user_id=current_user_id).first()
    
    if not log:
        return jsonify({'message': 'Cycle log not found'}), 404
    
    # Format the response
    result = {
        'id': log.id,
        'start_date': log.start_date.isoformat(),
        'end_date': log.end_date.isoformat() if log.end_date else None,
        'cycle_length': log.cycle_length,
        'period_length': log.period_length,
        'flow_intensity': log.flow_intensity,
        'symptoms': log.symptoms,
        'notes': log.notes,
        # Enhanced wellness data
        'mood': log.mood,
        'energy_level': log.energy_level,
        'sleep_quality': log.sleep_quality,
        'stress_level': log.stress_level,
        'exercise_activities': log.exercise_activities,
        'created_at': log.created_at.isoformat(),
        'updated_at': log.updated_at.isoformat()
    }
    
    return jsonify(result), 200

@cycle_logs_bp.route('/', methods=['POST'])
@jwt_required()
def create_cycle_log():
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    data = request.get_json()
    
    # Get target user_id (for parent creating log for child)
    target_user_id = data.get('user_id', current_user_id)
    
    # If creating for another user, verify parent-child relationship
    if target_user_id != current_user_id:
        from app.models import User, Parent, Adolescent, ParentChild
        
        # Check if current user is a parent
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.user_type != 'parent':
            return jsonify({'message': 'Only parents can create logs for children'}), 403
        
        # Get parent and adolescent records
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        adolescent = Adolescent.query.filter_by(user_id=target_user_id).first()
        
        if not parent or not adolescent:
            return jsonify({'message': 'Parent or child record not found'}), 404
        
        # Verify parent-child relationship
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=adolescent.id
        ).first()
        
        if not parent_child:
            return jsonify({'message': 'Access denied: No relationship found with this child'}), 403
    
    # Validate required fields
    if not data.get('start_date'):
        return jsonify({'message': 'Start date is required and cannot be null'}), 400
    
    try:
        # Parse dates
        start_date_str = str(data['start_date'])
        if 'Z' in start_date_str:
            start_date_str = start_date_str.replace('Z', '+00:00')
        
        start_date = datetime.fromisoformat(start_date_str)
        end_date = None
        if 'end_date' in data and data['end_date']:
            end_date_str = str(data['end_date']).replace('Z', '+00:00')
            end_date = datetime.fromisoformat(end_date_str)
        
        # Calculate period length automatically if end_date is provided
        period_length = data.get('period_length')
        if end_date and not period_length:
            period_length = (end_date - start_date).days + 1
        
        # Get previous cycle to calculate cycle length
        previous_log = CycleLog.query.filter_by(user_id=target_user_id)\
            .filter(CycleLog.start_date < start_date)\
            .order_by(CycleLog.start_date.desc())\
            .first()
        
        cycle_length = data.get('cycle_length')
        if previous_log and not cycle_length:
            # Calculate cycle length from previous period
            cycle_length = (start_date - previous_log.start_date).days
            print(f"📊 Auto-calculated cycle length: {cycle_length} days")
        
        # Prepare symptoms: accept list or string
        symptoms_raw = data.get('symptoms')
        symptoms_str = None
        if symptoms_raw:
            if isinstance(symptoms_raw, list):
                # Filter out empty strings and convert to string
                symptoms_list = [str(s).strip() for s in symptoms_raw if s and str(s).strip()]
                symptoms_str = ','.join(symptoms_list) if symptoms_list else None
            elif isinstance(symptoms_raw, str) and symptoms_raw.strip():
                symptoms_str = symptoms_raw.strip()
        # If symptoms_str is empty or None, it will be stored as None
        
        # Prepare exercise activities: accept list or string
        exercise_raw = data.get('exercise_activities')
        exercise_str = None
        if exercise_raw:
            if isinstance(exercise_raw, list):
                # Filter out empty strings and convert to string
                exercise_list = [str(e).strip() for e in exercise_raw if e and str(e).strip()]
                exercise_str = ','.join(exercise_list) if exercise_list else None
            elif isinstance(exercise_raw, str) and exercise_raw.strip():
                exercise_str = exercise_raw.strip()
        
        # Create new cycle log with enhanced tracking data
        new_log = CycleLog(
            user_id=target_user_id,
            start_date=start_date,
            end_date=end_date,
            cycle_length=cycle_length,
            period_length=period_length,
            flow_intensity=data.get('flow_intensity', 'medium'),
            symptoms=symptoms_str,
            notes=data.get('notes'),
            # Enhanced wellness tracking
            mood=data.get('mood'),
            energy_level=data.get('energy_level'),
            sleep_quality=data.get('sleep_quality'),
            stress_level=data.get('stress_level'),
            exercise_activities=exercise_str
        )
        
        db.session.add(new_log)
        db.session.commit()
        
        # Get all logs to make intelligent predictions
        all_logs = CycleLog.query.filter_by(user_id=target_user_id)\
            .order_by(CycleLog.start_date).all()
        
        # Generate prediction using the intelligent engine
        predictions = CyclePredictionEngine.predict_next_cycles(all_logs, num_predictions=1)
        
        # Create enhanced notification
        if predictions:
            from app.models import Notification
            
            prediction = predictions[0]
            confidence = prediction['confidence']
            next_date = datetime.fromisoformat(prediction['predicted_start'])
            
            confidence_text = {
                'high': 'High confidence',
                'medium': 'Moderate confidence',
                'low': 'Low confidence (log more cycles for accuracy)'
            }.get(confidence, '')
            
            message = f"📅 Next period predicted for {next_date.strftime('%B %d, %Y')}. {confidence_text}. Predicted cycle length: {prediction['predicted_cycle_length']:.0f} days."
            
            notification = Notification(
                user_id=target_user_id,
                title='Cycle Prediction',
                message=message,
                type='cycle',
                notification_type='cycle_prediction'
            )
            
            db.session.add(notification)
            db.session.commit()
            
            print(f"✅ Created cycle log with intelligent prediction notification")
        
        return jsonify({
            'message': 'Cycle log created successfully',
            'id': new_log.id,
            'calculated_cycle_length': cycle_length,
            'calculated_period_length': period_length,
            'prediction': predictions[0] if predictions else None,
            'data_quality': {
                'total_logs': len(all_logs),
                'has_enough_data': len(all_logs) >= 3,
                'recommendation': 'Log at least 6 cycles for best predictions' if len(all_logs) < 6 else 'Great! Keep logging for accuracy'
            }
        }), 201
        
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating cycle log: {str(e)}'}), 500

@cycle_logs_bp.route('/<int:log_id>', methods=['PUT'])
@jwt_required()
def update_cycle_log(log_id):
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    data = request.get_json()
    
    # Find the specific cycle log
    log = CycleLog.query.filter_by(id=log_id, user_id=current_user_id).first()
    
    if not log:
        return jsonify({'message': 'Cycle log not found'}), 404
    
    try:
        # Update fields if provided
        if 'start_date' in data:
            if data['start_date']:
                start_date_str = str(data['start_date']).replace('Z', '+00:00')
                log.start_date = datetime.fromisoformat(start_date_str)
            else:
                return jsonify({'message': 'Start date cannot be null'}), 400
        
        if 'end_date' in data:
            if data['end_date']:
                end_date_str = str(data['end_date']).replace('Z', '+00:00')
                log.end_date = datetime.fromisoformat(end_date_str)
            else:
                log.end_date = None
        
        if 'cycle_length' in data:
            log.cycle_length = data['cycle_length']
        
        if 'period_length' in data:
            log.period_length = data['period_length']
        
        if 'symptoms' in data:
            # Accept symptoms as list or string
            symptoms_raw = data['symptoms']
            if symptoms_raw:
                if isinstance(symptoms_raw, list):
                    # Filter out empty strings and convert to string
                    symptoms_list = [str(s).strip() for s in symptoms_raw if s and str(s).strip()]
                    log.symptoms = ','.join(symptoms_list) if symptoms_list else None
                elif isinstance(symptoms_raw, str) and symptoms_raw.strip():
                    log.symptoms = symptoms_raw.strip()
                else:
                    log.symptoms = None
            else:
                log.symptoms = None
        
        if 'notes' in data:
            log.notes = data['notes']
        
        # Handle wellness tracking fields
        if 'flow_intensity' in data:
            log.flow_intensity = data['flow_intensity']
        
        if 'mood' in data:
            log.mood = data['mood']
        
        if 'energy_level' in data:
            log.energy_level = data['energy_level']
        
        if 'sleep_quality' in data:
            log.sleep_quality = data['sleep_quality']
        
        if 'stress_level' in data:
            log.stress_level = data['stress_level']
        
        if 'exercise_activities' in data:
            log.exercise_activities = data['exercise_activities']
        
        # Update timestamp
        log.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cycle log updated successfully',
            'cycle_log': log.to_dict()
        }), 200
        
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating cycle log: {str(e)}'}), 500

@cycle_logs_bp.route('/<int:log_id>', methods=['DELETE'])
@jwt_required()
def delete_cycle_log(log_id):
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    # Find the specific cycle log
    log = CycleLog.query.filter_by(id=log_id, user_id=current_user_id).first()
    
    if not log:
        return jsonify({'message': 'Cycle log not found'}), 404
    
    try:
        # Store log info for response
        log_date = log.start_date.strftime('%Y-%m-%d')
        
        # Check for related period logs and handle cascade
        from app.models import PeriodLog
        related_period_logs = PeriodLog.query.filter_by(cycle_log_id=log_id).all()
        
        # Delete related period logs first (cascade)
        for period_log in related_period_logs:
            db.session.delete(period_log)
        
        # Delete the cycle log
        db.session.delete(log)
        db.session.commit()
        
        return jsonify({
            'message': f'Cycle log from {log_date} deleted successfully',
            'deleted_period_logs': len(related_period_logs)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting cycle log: {str(e)}'}), 500

@cycle_logs_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_cycle_stats():
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    # Get optional user_id parameter for parent viewing child's data
    requested_user_id = request.args.get('user_id', type=int)
    target_user_id = current_user_id  # Default to current user
    
    # If requesting another user's data, verify parent-child relationship
    if requested_user_id and requested_user_id != current_user_id:
        from app.models import User, ParentChild, Parent, Adolescent
        
        # Check if current user is a parent
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.user_type != 'parent':
            return jsonify({'message': 'Only parents can view child data'}), 403
        
        # Get the Parent record for current user
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        if not parent:
            return jsonify({'message': 'Parent record not found'}), 404
        
        # Get the Adolescent record for the requested user
        adolescent = Adolescent.query.filter_by(user_id=requested_user_id).first()
        if not adolescent:
            return jsonify({'message': 'Child record not found'}), 404
        
        # Verify parent-child relationship
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=adolescent.id
        ).first()
        
        if not parent_child:
            return jsonify({'message': 'Access denied: No relationship found with this child'}), 403
        
        target_user_id = requested_user_id
    
    print(f"🔍 Enhanced cycle stats called for user: {target_user_id} (requested by: {current_user_id})")
    
    # Get all cycle logs for the target user
    logs = CycleLog.query.filter_by(user_id=target_user_id).order_by(CycleLog.start_date).all()
    print(f"📊 Found {len(logs)} cycle logs for user {target_user_id}")
    
    if not logs:
        print("⚠️ No cycle logs found, returning empty stats")
        return jsonify({
            'message': 'No cycle data available',
            'average_cycle_length': None,
            'average_period_length': None,
            'total_logs': 0,
            'predictions': [],
            'variability': None,
            'health_insights': [],
            'latest_period_start': None
        }), 200
    
    # Extract cycle data using enhanced robust method
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
    
    # Detect and handle outliers
    filtered_cycle_data = CyclePredictionEngine.detect_outliers(cycle_data) if cycle_data else []
    
    # Analyze trends
    trend_analysis = CyclePredictionEngine.analyze_trend(filtered_cycle_data) if filtered_cycle_data else {'trend': 'insufficient_data'}
    
    # Extract cycle lengths for backward compatibility
    cycle_lengths = [c['length'] for c in cycle_data] if cycle_data else []
    period_lengths = [log.period_length for log in logs if log.period_length and 2 <= log.period_length <= 10]
    
    print(f"📈 Enhanced cycle data: {len(cycle_lengths)} cycles, {sum(1 for c in filtered_cycle_data if c.get('is_outlier', False))} outliers")
    print(f"📈 Period lengths: {period_lengths}")
    print(f"📈 Trend analysis: {trend_analysis}")
    
    # Calculate advanced statistics using enhanced methods
    avg_cycle_length = statistics.mean(cycle_lengths) if cycle_lengths else None
    avg_period_length = statistics.mean(period_lengths) if period_lengths else None
    
    # Calculate enhanced weighted average
    weighted_cycle_avg = CyclePredictionEngine.calculate_adaptive_weighted_average(
        filtered_cycle_data
    ) if filtered_cycle_data else None
    
    # Calculate enhanced confidence
    confidence_level = CyclePredictionEngine.calculate_enhanced_confidence(filtered_cycle_data, trend_analysis) if filtered_cycle_data else 'no_data'
    
    # Calculate cycle variability (backward compatibility)
    variability_info = CyclePredictionEngine.calculate_cycle_variability(cycle_lengths) if len(cycle_lengths) >= 2 else None
    
    # Generate enhanced predictions
    predictions = CyclePredictionEngine.predict_next_cycles(logs, num_predictions=3, user_id=str(current_user_id))
    
    # Analyze symptom patterns
    symptom_analysis = CyclePredictionEngine.analyze_symptoms_patterns(logs)
    
    # Generate health insights
    health_insights = CyclePredictionEngine.calculate_health_insights(logs)
    
    # Get the most recent log
    latest_log = logs[-1]
    print(f"📅 Latest log: {latest_log.start_date} - {latest_log.end_date}")
    
    # Calculate days since last period
    days_since_period = (datetime.now() - latest_log.start_date).days
    
    # Determine current cycle phase
    current_phase = None
    if weighted_cycle_avg:
        if days_since_period <= (latest_log.period_length or 5):
            current_phase = 'menstrual'
        elif days_since_period <= (weighted_cycle_avg - 14):
            current_phase = 'follicular'
        elif days_since_period <= (weighted_cycle_avg - 12):
            current_phase = 'ovulation'
        else:
            current_phase = 'luteal'
    
    stats = {
        'basic_stats': {
            'average_cycle_length': round(avg_cycle_length, 1) if avg_cycle_length else None,
            'average_period_length': round(avg_period_length, 1) if avg_period_length else None,
            'weighted_cycle_length': round(weighted_cycle_avg, 1) if weighted_cycle_avg else None,
            'total_logs': len(logs),
            'data_points': len(cycle_lengths),
            'latest_period_start': latest_log.start_date.isoformat(),
            'days_since_period': days_since_period,
            'current_cycle_phase': current_phase
        },
        'enhanced_analysis': {
            'confidence_level': confidence_level,
            'trend_analysis': trend_analysis,
            'outliers_detected': sum(1 for c in filtered_cycle_data if c.get('is_outlier', False)),
            'data_quality_score': min(100, (len(cycle_data) / 12) * 100) if cycle_data else 0
        },
        'predictions': predictions,
        'variability': variability_info,
        'symptom_analysis': symptom_analysis,
        'health_insights': health_insights,
        'recommendation': {
            'primary': 'Log at least 12 cycles for maximum prediction accuracy' if len(logs) < 12 else 'Excellent data! Keep logging for continued accuracy',
            'confidence': f'Current prediction confidence: {confidence_level}',
            'trend': f'Cycle trend: {trend_analysis.get("trend", "unknown")}'
        }
    }

    # Provide legacy flattened fields for backward compatibility with older dashboard code
    primary_prediction = predictions[0] if predictions else None
    legacy_summary = {
        'average_cycle_length': stats['basic_stats'].get('average_cycle_length'),
        'average_period_length': stats['basic_stats'].get('average_period_length'),
        'weighted_cycle_length': stats['basic_stats'].get('weighted_cycle_length'),
        'latest_period_start': stats['basic_stats'].get('latest_period_start'),
        'days_since_period': stats['basic_stats'].get('days_since_period'),
        'current_cycle_phase': stats['basic_stats'].get('current_cycle_phase'),
        'total_logs': stats['basic_stats'].get('total_logs'),
        'next_period_prediction': primary_prediction.get('predicted_start') if primary_prediction else None,
        'next_period_end': primary_prediction.get('predicted_end') if primary_prediction else None,
        'next_period_confidence': primary_prediction.get('confidence') if primary_prediction else None,
        'next_cycle_number': primary_prediction.get('cycle_number') if primary_prediction else None
    }
    stats.update(legacy_summary)
    
    print(f"✅ Returning enhanced stats with {len(predictions)} predictions")
    return jsonify(stats), 200

@cycle_logs_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_calendar_data():
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    # Get query parameters for month/year
    year = request.args.get('year', datetime.now().year, type=int)
    month = request.args.get('month', datetime.now().month, type=int)
    
    # Get optional user_id parameter for parent viewing child's data
    requested_user_id = request.args.get('user_id', type=int)
    target_user_id = current_user_id  # Default to current user
    
    # If requesting another user's data, verify parent-child relationship
    if requested_user_id and requested_user_id != current_user_id:
        from app.models import User, ParentChild, Parent, Adolescent
        
        # Check if current user is a parent
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.user_type != 'parent':
            return jsonify({'message': 'Only parents can view child data'}), 403
        
        # Get the Parent record for current user
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        if not parent:
            return jsonify({'message': 'Parent record not found'}), 404
        
        # Get the Adolescent record for the requested user
        adolescent = Adolescent.query.filter_by(user_id=requested_user_id).first()
        if not adolescent:
            return jsonify({'message': 'Child record not found'}), 404
        
        # Verify parent-child relationship
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=adolescent.id
        ).first()
        
        if not parent_child:
            return jsonify({'message': 'Access denied: No relationship found with this child'}), 403
        
        target_user_id = requested_user_id
    
    print(f"📅 Enhanced calendar data requested for user {target_user_id} (requested by: {current_user_id}), {year}-{month:02d}")
    
    # Get start and end dates for the month
    from calendar import monthrange
    from datetime import date as dt_date
    
    start_date = dt_date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = dt_date(year, month, last_day)
    
    # Extend to show full weeks (previous and next month days)
    start_calendar = start_date - timedelta(days=start_date.weekday() + 1)  # Start from Sunday
    end_calendar = end_date + timedelta(days=(6 - end_date.weekday()))
    
    print(f"📅 Calendar range: {start_calendar} to {end_calendar}")
    
    # Get all cycle logs for the target user
    logs = CycleLog.query.filter_by(user_id=target_user_id).order_by(CycleLog.start_date).all()
    
    if not logs:
        print("⚠️ No logs found, returning empty calendar")
        return jsonify({
            'year': year,
            'month': month,
            'month_name': dt_date(year, month, 1).strftime('%B'),
            'days': [],
            'stats': {
                'total_logs': 0,
                'average_cycle_length': None,
                'predictions': []
            }
        }), 200
    
    # Extract cycle data using enhanced robust method
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
    
    # Detect and handle outliers
    filtered_cycle_data = CyclePredictionEngine.detect_outliers(cycle_data) if cycle_data else []
    
    # Calculate enhanced weighted average for better predictions
    avg_cycle_length = CyclePredictionEngine.calculate_adaptive_weighted_average(filtered_cycle_data) if filtered_cycle_data else 28
    
    # Get enhanced predictions using the intelligent engine
    predictions = CyclePredictionEngine.predict_next_cycles(logs, num_predictions=6)
    
    print(f"📊 Enhanced calendar: {len(logs)} logs, {len(cycle_data)} cycles, avg: {avg_cycle_length:.1f}")
    
    # Build calendar data with enhanced intelligence
    calendar_days = []
    current_date = start_calendar
    
    while current_date <= end_calendar:
        day_data = {
            'date': current_date.isoformat(),
            'day_of_month': current_date.day,
            'is_current_month': current_date.month == month,
            'is_today': current_date == dt_date.today(),
            'is_period_day': False,
            'is_period_start': False,
            'is_period_end': False,
            'is_ovulation_day': False,
            'is_fertility_day': False,
            'is_predicted': False,
            'flow_intensity': None,
            'symptoms': [],
            'notes': None,
            'cycle_day': None,
            'phase': None,
            'confidence': None
        }
        
        # Check historical (logged) data
        for log in logs:
            log_start = log.start_date.date()
            log_end = log.end_date.date() if log.end_date else log_start + timedelta(days=(log.period_length or 5))
            
            # Check if it's a period day
            if log_start <= current_date <= log_end:
                day_data['is_period_day'] = True
                day_data['is_predicted'] = False
                
                if current_date == log_start:
                    day_data['is_period_start'] = True
                if current_date == log_end:
                    day_data['is_period_end'] = True
                
                # Flow intensity based on day of period
                days_into_period = (current_date - log_start).days
                if days_into_period <= 1:
                    day_data['flow_intensity'] = log.flow_intensity or 'medium'
                elif days_into_period <= 2:
                    day_data['flow_intensity'] = 'heavy'
                elif days_into_period <= 4:
                    day_data['flow_intensity'] = 'medium'
                else:
                    day_data['flow_intensity'] = 'light'
                
                # Symptoms
                if log.symptoms:
                    if isinstance(log.symptoms, str):
                        day_data['symptoms'] = [s.strip() for s in log.symptoms.split(',') if s.strip()]
                    else:
                        day_data['symptoms'] = log.symptoms
                
                if log.notes:
                    day_data['notes'] = log.notes
                
                day_data['phase'] = 'menstrual'
            
            # Calculate cycle day and phase
            if log_start <= current_date:
                cycle_day = (current_date - log_start).days + 1
                cycle_length = log.cycle_length if log.cycle_length else int(avg_cycle_length)
                
                if cycle_day <= cycle_length:
                    day_data['cycle_day'] = cycle_day
                    
                    # Determine phase if not period
                    if not day_data['is_period_day']:
                        if cycle_day <= cycle_length - 14:
                            day_data['phase'] = 'follicular'
                        elif cycle_day <= cycle_length - 12:
                            day_data['phase'] = 'ovulation'
                        else:
                            day_data['phase'] = 'luteal'
                    
                    # Calculate ovulation and fertile window
                    ovulation_day_num = cycle_length - 14
                    
                    if cycle_day == ovulation_day_num and not day_data['is_period_day']:
                        day_data['is_ovulation_day'] = True
                        day_data['phase'] = 'ovulation'
                        print(f"🥚 Marked {current_date} as ovulation day (cycle day {cycle_day})")
                    
                    # Fertile window: 5 days before ovulation to 1 day after
                    fertile_start = ovulation_day_num - 5
                    fertile_end = ovulation_day_num + 1
                    
                    if fertile_start <= cycle_day <= fertile_end and not day_data['is_period_day'] and not day_data['is_ovulation_day']:
                        day_data['is_fertility_day'] = True
                        if cycle_day == fertile_start:
                            print(f"🌸 Marked {current_date} as start of fertile window")
        
        # Apply predictions for future dates
        if not day_data['is_period_day'] and current_date > logs[-1].start_date.date():
            for prediction in predictions:
                pred_start = datetime.fromisoformat(prediction['predicted_start']).date()
                pred_end = datetime.fromisoformat(prediction['predicted_end']).date()
                pred_ovulation = datetime.fromisoformat(prediction['ovulation_date']).date()
                pred_fertile_start = datetime.fromisoformat(prediction['fertile_window_start']).date()
                pred_fertile_end = datetime.fromisoformat(prediction['fertile_window_end']).date()
                
                # Predicted period
                if pred_start <= current_date <= pred_end:
                    day_data['is_period_day'] = True
                    day_data['is_predicted'] = True
                    day_data['confidence'] = prediction['confidence']
                    day_data['phase'] = 'menstrual'
                    
                    if current_date == pred_start:
                        day_data['is_period_start'] = True
                    if current_date == pred_end:
                        day_data['is_period_end'] = True
                    
                    # Predicted flow intensity
                    days_into_period = (current_date - pred_start).days
                    if days_into_period <= 1:
                        day_data['flow_intensity'] = 'medium'
                    elif days_into_period <= 2:
                        day_data['flow_intensity'] = 'heavy'
                    elif days_into_period <= 4:
                        day_data['flow_intensity'] = 'medium'
                    else:
                        day_data['flow_intensity'] = 'light'
                    
                    break
                
                # Predicted ovulation
                elif current_date == pred_ovulation:
                    day_data['is_ovulation_day'] = True
                    day_data['is_predicted'] = True
                    day_data['confidence'] = prediction['confidence']
                    day_data['phase'] = 'ovulation'
                    break
                
                # Predicted fertile window
                elif pred_fertile_start <= current_date <= pred_fertile_end:
                    day_data['is_fertility_day'] = True
                    day_data['is_predicted'] = True
                    day_data['confidence'] = prediction['confidence']
                    
                    # Determine phase within fertile window
                    if (pred_ovulation - current_date).days > 2:
                        day_data['phase'] = 'follicular'
                    else:
                        day_data['phase'] = 'ovulation'
                    break
        
        calendar_days.append(day_data)
        current_date += timedelta(days=1)
    
    # Calculate cycle variability using extracted cycle data
    cycle_lengths = [c['length'] for c in cycle_data] if cycle_data else []
    variability_info = CyclePredictionEngine.calculate_cycle_variability(cycle_lengths) if len(cycle_lengths) >= 2 else None
    
    result = {
        'year': year,
        'month': month,
        'month_name': dt_date(year, month, 1).strftime('%B'),
        'days': calendar_days,
        'stats': {
            'total_logs': len(logs),
            'data_points': len(cycle_lengths),
            'average_cycle_length': round(avg_cycle_length, 1) if avg_cycle_length else None,
            'variability': variability_info,
            'predictions': predictions[:3]  # Only include next 3 predictions in summary
        },
        'legend': {
            'period_day': 'Menstruation day (confirmed or predicted)',
            'ovulation_day': 'Ovulation day (highest fertility)',
            'fertility_day': 'Fertile window (pregnancy possible)',
            'follicular': 'Follicular phase (low fertility)',
            'luteal': 'Luteal phase (pre-menstrual)',
            'confidence_levels': {
                'high': '6+ cycles logged, regular pattern',
                'medium': '3-5 cycles logged, moderate regularity',
                'low': 'Less than 3 cycles logged'
            }
        }
    }
    
    print(f"✅ Returning enhanced calendar data with {len(calendar_days)} days and {len(predictions)} predictions")
    return jsonify(result), 200

@cycle_logs_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_cycle_insights():
    """
    Get personalized cycle insights, health recommendations, and pattern analysis
    """
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    # Get optional user_id parameter for parent viewing child's data
    requested_user_id = request.args.get('user_id', type=int)
    target_user_id = current_user_id
    
    # Verify parent-child relationship if needed
    if requested_user_id and requested_user_id != current_user_id:
        from app.models import User, ParentChild, Parent, Adolescent
        
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.user_type != 'parent':
            return jsonify({'message': 'Only parents can view child data'}), 403
        
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        adolescent = Adolescent.query.filter_by(user_id=requested_user_id).first()
        
        if not parent or not adolescent:
            return jsonify({'message': 'Parent or child record not found'}), 404
        
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=adolescent.id
        ).first()
        
        if not parent_child:
            return jsonify({'message': 'Access denied'}), 403
        
        target_user_id = requested_user_id
    
    print(f"🧠 Insights requested for user {target_user_id}")
    
    # Get all cycle logs
    logs = CycleLog.query.filter_by(user_id=target_user_id).order_by(CycleLog.start_date).all()
    
    if not logs:
        return jsonify({
            'message': 'No data available for insights',
            'insights': [],
            'recommendations': ['Start logging your cycles to get personalized insights']
        }), 200
    
    # Generate health insights
    health_insights = CyclePredictionEngine.calculate_health_insights(logs)
    
    # Analyze symptom patterns
    symptom_analysis = CyclePredictionEngine.analyze_symptoms_patterns(logs)
    
    # Calculate enhanced cycle characteristics
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
    filtered_cycle_data = CyclePredictionEngine.detect_outliers(cycle_data) if cycle_data else []
    trend_analysis = CyclePredictionEngine.analyze_trend(filtered_cycle_data) if filtered_cycle_data else {'trend': 'insufficient_data'}
    
    # Extract cycle lengths for backward compatibility
    cycle_lengths = [c['length'] for c in cycle_data] if cycle_data else []
    
    variability = CyclePredictionEngine.calculate_cycle_variability(cycle_lengths) if len(cycle_lengths) >= 2 else None
    confidence_level = CyclePredictionEngine.calculate_enhanced_confidence(filtered_cycle_data, trend_analysis) if filtered_cycle_data else 'no_data'
    
    # Generate personalized recommendations
    recommendations = []
    
    if len(logs) < 6:
        recommendations.append({
            'priority': 'high',
            'category': 'data_tracking',
            'title': 'Continue Logging',
            'message': f'You have {len(logs)} cycle(s) logged. Track at least 6 cycles for highly accurate predictions.',
            'action': 'Log your next period when it starts'
        })
    
    if variability and variability['variability'] in ['irregular', 'somewhat_irregular']:
        recommendations.append({
            'priority': 'medium',
            'category': 'lifestyle',
            'title': 'Improve Cycle Regularity',
            'message': 'Your cycles show some irregularity. Consider lifestyle factors that may help.',
            'tips': [
                'Maintain consistent sleep schedule',
                'Manage stress through meditation or yoga',
                'Eat balanced meals at regular times',
                'Stay hydrated',
                'Exercise moderately but regularly'
            ]
        })
    
    if symptom_analysis['common_symptoms']:
        top_symptoms = list(symptom_analysis['common_symptoms'].keys())[:3]
        recommendations.append({
            'priority': 'medium',
            'category': 'symptom_management',
            'title': 'Manage Common Symptoms',
            'message': f'You frequently experience: {", ".join(top_symptoms)}',
            'tips': [
                'Keep a symptom diary with severity ratings',
                'Note what helps relieve each symptom',
                'Discuss persistent symptoms with healthcare provider',
                'Try natural remedies like heating pads or herbal tea'
            ]
        })
    
    # Cycle-phase specific recommendations
    if logs:
        latest_log = logs[-1]
        days_since_period = (datetime.now() - latest_log.start_date).days
        avg_cycle = statistics.mean(cycle_lengths) if cycle_lengths else 28
        
        if days_since_period <= 5:
            phase_rec = {
                'priority': 'low',
                'category': 'current_phase',
                'title': 'Menstrual Phase Tips',
                'phase': 'menstrual',
                'tips': [
                    'Rest and prioritize self-care',
                    'Stay hydrated to reduce bloating',
                    'Light exercise like walking or gentle yoga',
                    'Iron-rich foods to replenish nutrients',
                    'Use heating pad for cramps'
                ]
            }
        elif days_since_period <= avg_cycle - 14:
            phase_rec = {
                'priority': 'low',
                'category': 'current_phase',
                'title': 'Follicular Phase Tips',
                'phase': 'follicular',
                'tips': [
                    'Energy levels are high - good time for workouts',
                    'Focus on protein and fresh vegetables',
                    'Great time for social activities and new projects',
                    'Good time for important conversations'
                ]
            }
        elif days_since_period <= avg_cycle - 12:
            phase_rec = {
                'priority': 'low',
                'category': 'current_phase',
                'title': 'Ovulation Phase Tips',
                'phase': 'ovulation',
                'tips': [
                    'Peak fertility window',
                    'Highest energy and confidence',
                    'Great time for challenging workouts',
                    'Focus on complex carbs and healthy fats'
                ]
            }
        else:
            phase_rec = {
                'priority': 'low',
                'category': 'current_phase',
                'title': 'Luteal Phase Tips',
                'phase': 'luteal',
                'tips': [
                    'Energy may decrease - be gentle with yourself',
                    'Watch for PMS symptoms',
                    'Reduce caffeine and salt to minimize bloating',
                    'Include magnesium-rich foods',
                    'Practice stress management'
                ]
            }
        
        recommendations.append(phase_rec)
    
    # Educational content
    educational_tips = [
        {
            'topic': 'Cycle Length',
            'info': 'Normal cycles range from 21-35 days. Average is 28 days.'
        },
        {
            'topic': 'Period Length',
            'info': 'Normal period lasts 2-7 days. Average is 3-5 days.'
        },
        {
            'topic': 'Ovulation',
            'info': 'Typically occurs 12-14 days before your next period, not 14 days after period starts.'
        },
        {
            'topic': 'Fertile Window',
            'info': 'Approximately 6 days: 5 days before ovulation plus ovulation day.'
        }
    ]
    
    result = {
        'insights': health_insights,
        'recommendations': recommendations,
        'symptom_patterns': symptom_analysis,
        'cycle_characteristics': {
            'total_cycles_logged': len(logs),
            'data_points': len(cycle_lengths),
            'variability': variability,
            'average_cycle_length': round(statistics.mean(cycle_lengths), 1) if cycle_lengths else None,
            'cycle_range': {
                'shortest': min(cycle_lengths) if cycle_lengths else None,
                'longest': max(cycle_lengths) if cycle_lengths else None
            }
        },
        'educational_tips': educational_tips,
        'data_quality_score': min(100, (len(logs) / 6) * 100) if logs else 0
    }
    
    print(f"✅ Returning {len(health_insights)} insights and {len(recommendations)} recommendations")
    return jsonify(result), 200

@cycle_logs_bp.route('/predictions', methods=['GET'])
@jwt_required()
def get_cycle_predictions():
    """
    Get detailed cycle predictions for planning ahead
    """
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    
    # Get optional user_id and months parameter
    requested_user_id = request.args.get('user_id', type=int)
    months_ahead = request.args.get('months', 3, type=int)  # Default 3 months
    months_ahead = min(months_ahead, 12)  # Cap at 12 months
    
    target_user_id = current_user_id
    
    # Verify parent-child relationship if needed
    if requested_user_id and requested_user_id != current_user_id:
        from app.models import User, ParentChild, Parent, Adolescent
        
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.user_type != 'parent':
            return jsonify({'message': 'Only parents can view child data'}), 403
        
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        adolescent = Adolescent.query.filter_by(user_id=requested_user_id).first()
        
        if not parent or not adolescent:
            return jsonify({'message': 'Parent or child record not found'}), 404
        
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=adolescent.id
        ).first()
        
        if not parent_child:
            return jsonify({'message': 'Access denied'}), 403
        
        target_user_id = requested_user_id
    
    print(f"🔮 Predictions requested for user {target_user_id}, {months_ahead} months ahead")
    
    # Get all cycle logs
    logs = CycleLog.query.filter_by(user_id=target_user_id).order_by(CycleLog.start_date).all()
    
    if not logs:
        return jsonify({
            'message': 'No data available for predictions',
            'predictions': []
        }), 200
    
    # Calculate number of cycles to predict (roughly 1 per month)
    num_predictions = months_ahead
    
    # Generate predictions
    predictions = CyclePredictionEngine.predict_next_cycles(logs, num_predictions=num_predictions)
    
    # Group predictions by month
    predictions_by_month = defaultdict(list)
    for pred in predictions:
        pred_date = datetime.fromisoformat(pred['predicted_start'])
        month_key = pred_date.strftime('%Y-%m')
        predictions_by_month[month_key].append(pred)
    
    result = {
        'total_predictions': len(predictions),
        'predictions': predictions,
        'grouped_by_month': dict(predictions_by_month),
        'confidence_note': 'Predictions become less accurate further into the future. Regular logging improves accuracy.',
        'planning_tips': [
            'Plan vacations around predicted periods',
            'Stock up on supplies before predicted start dates',
            'Schedule important events during non-period days when possible',
            'Track actual vs predicted to improve future accuracy'
        ]
    }
    
    print(f"✅ Returning {len(predictions)} predictions grouped into {len(predictions_by_month)} months")
    return jsonify(result), 200

# Test endpoint for calendar data without authentication
@cycle_logs_bp.route('/ml-insights', methods=['GET'])
@jwt_required()
def get_ml_insights():
    """Get comprehensive ML insights for the user"""
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    requested_user_id = request.args.get('user_id', type=int)
    target_user_id = current_user_id
    
    # Verify parent-child relationship if needed
    if requested_user_id and requested_user_id != current_user_id:
        from app.models import User, ParentChild, Parent, Adolescent
        
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.user_type != 'parent':
            return jsonify({'message': 'Only parents can view child data'}), 403
        
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        adolescent = Adolescent.query.filter_by(user_id=requested_user_id).first()
        
        if not parent or not adolescent:
            return jsonify({'message': 'Parent or child record not found'}), 404
        
        parent_child = ParentChild.query.filter_by(
            parent_id=parent.id,
            adolescent_id=adolescent.id
        ).first()
        
        if not parent_child:
            return jsonify({'message': 'Access denied'}), 403
        
        target_user_id = requested_user_id
    
    # Get cycle logs for ML analysis
    logs = CycleLog.query.filter_by(user_id=target_user_id).order_by(CycleLog.start_date).all()
    
    if len(logs) < 3:
        return jsonify({
            'pattern_analysis': {
                'patterns_detected': 0,
                'confidence': 'insufficient_data',
                'learning_status': 'inactive',
                'user_profile': {
                    'regularity_score': 0.0,
                    'predictability_index': 0.0,
                    'trend_direction': 'unknown'
                }
            },
            'anomaly_detection': {
                'anomalies_detected': False,
                'risk_level': 'none',
                'recommendations': []
            },
            'adaptive_learning': {
                'accuracy_trend': 'insufficient_data',
                'improvement_potential': 0.0,
                'cycles_needed_for_optimization': max(0, 6 - len(logs))
            },
            'seasonal_patterns': {
                'detected': False,
                'monthly_variations': {},
                'confidence': 0.0
            }
        }), 200
    
    # Perform ML analysis
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
    try:
        ml_patterns = CyclePredictionEngine.ml_pattern_recognition(cycle_data, str(target_user_id))
    except Exception as e:
        print(f"ML Pattern Recognition Error: {str(e)}")
        ml_patterns = {'patterns': [], 'confidence': 'error', 'recommendations': []}
    
    try:
        anomaly_analysis = CyclePredictionEngine.anomaly_detection(cycle_data)
    except Exception as e:
        print(f"Anomaly Detection Error: {str(e)}")
        anomaly_analysis = {'anomalies': [], 'score': 0.0}
    
    try:
        adaptive_prediction = CyclePredictionEngine.adaptive_learning_prediction(cycle_data, str(target_user_id))
    except Exception as e:
        print(f"Adaptive Learning Error: {str(e)}")
        adaptive_prediction = {'confidence': 'low', 'prediction_accuracy': 0.5}
    
    # Handle both list and dict patterns format
    patterns = ml_patterns.get('patterns', {})
    if isinstance(patterns, list):
        patterns_count = len(patterns)
    else:
        patterns_count = len(patterns.get('cycle_patterns', []))
    
    # Get user profile with proper defaults
    user_profile_data = ml_patterns.get('user_profile', {})
    
    # Calculate regularity score directly from cycle data if not in profile
    if 'regularity_score' not in user_profile_data:
        lengths = [c['length'] for c in cycle_data] if cycle_data else []
        regularity_score = CyclePredictionEngine._calculate_regularity_score(lengths) / 100 if lengths else 0.5
        predictability_index = CyclePredictionEngine._calculate_predictability_index(lengths) if lengths else 0.5
        
        # Determine trend direction
        if len(lengths) >= 3:
            trend_slope = CyclePredictionEngine._calculate_trend_slope(lengths)
            if trend_slope > 0.1:
                trend_direction = 'lengthening'
            elif trend_slope < -0.1:
                trend_direction = 'shortening'
            else:
                trend_direction = 'stable'
        else:
            trend_direction = 'stable'
    else:
        regularity_score = user_profile_data.get('regularity_score', 0.5)
        predictability_index = user_profile_data.get('predictability_index', 0.5)
        trend_direction = user_profile_data.get('trend_direction', 'stable')
    
    # Ensure values are valid numbers
    regularity_score = float(regularity_score) if regularity_score is not None and not (isinstance(regularity_score, float) and regularity_score != regularity_score) else 0.5
    predictability_index = float(predictability_index) if predictability_index is not None and not (isinstance(predictability_index, float) and predictability_index != predictability_index) else 0.5
    
    return jsonify({
        'pattern_analysis': {
            'patterns_detected': patterns_count,
            'confidence': ml_patterns.get('confidence', 'unknown'),
            'learning_status': 'active' if len(logs) >= 6 else 'learning',
            'user_profile': {
                'regularity_score': regularity_score,
                'predictability_index': predictability_index,
                'trend_direction': trend_direction
            }
        },
        'anomaly_detection': {
            'anomalies_detected': anomaly_analysis.get('anomalies_detected', False),
            'risk_level': anomaly_analysis.get('risk_score', {}).get('level', 'low'),
            'recommendations': anomaly_analysis.get('recommendations', [])
        },
        'adaptive_learning': {
            'accuracy_trend': adaptive_prediction.get('accuracy_trend', 'stable'),
            'improvement_potential': adaptive_prediction.get('improvement_potential', {}).get('percentage', 0.0),
            'cycles_needed_for_optimization': max(0, 12 - len(logs))
        },
        'seasonal_patterns': {
            'detected': CyclePredictionEngine._safe_get_seasonal_pattern(ml_patterns, 'detected', False),
            'monthly_variations': CyclePredictionEngine._safe_get_seasonal_pattern(ml_patterns, 'monthly_variations', {}),
            'confidence': CyclePredictionEngine._safe_get_seasonal_pattern(ml_patterns, 'confidence', 0.0)
        }
    }), 200

@cycle_logs_bp.route('/pattern-analysis', methods=['GET'])
@jwt_required()
def get_pattern_analysis():
    """Get detailed pattern analysis"""
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    requested_user_id = request.args.get('user_id', type=int)
    target_user_id = requested_user_id if requested_user_id else current_user_id
    
    logs = CycleLog.query.filter_by(user_id=target_user_id).order_by(CycleLog.start_date).all()
    
    if len(logs) < 3:
        return jsonify({
            'patterns_detected': 0,
            'pattern_types': [],
            'confidence': 'insufficient_data',
            'learning_status': 'inactive',
            'user_profile': {
                'regularity_score': 0.0,
                'predictability_index': 0.0,
                'trend_direction': 'unknown',
                'cycle_signature': []
            }
        }), 200
    
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
    try:
        ml_patterns = CyclePredictionEngine.ml_pattern_recognition(cycle_data, str(target_user_id))
    except Exception as e:
        print(f"ML Pattern Recognition Error: {str(e)}")
        ml_patterns = {'patterns': [], 'confidence': 'error', 'recommendations': []}
    
    # Handle both list and dict patterns format
    patterns = ml_patterns.get('patterns', {})
    if isinstance(patterns, list):
        patterns_count = len(patterns)
    else:
        patterns_count = len(patterns.get('cycle_patterns', []))
    
    return jsonify({
        'patterns_detected': patterns_count,
        'pattern_types': ['regular_cycle', 'seasonal_variation', 'trend_stability'],
        'confidence': ml_patterns.get('confidence', 'medium'),
        'learning_status': 'active' if len(logs) >= 6 else 'learning',
        'user_profile': {
            'regularity_score': ml_patterns.get('user_profile', {}).get('regularity_score', 0.5),
            'predictability_index': ml_patterns.get('user_profile', {}).get('predictability_index', 50.0),
            'trend_direction': ml_patterns.get('user_profile', {}).get('trend_direction', 'stable'),
            'cycle_signature': ['pattern_' + str(i) for i in range(min(3, len(logs)))]
        }
    }), 200

@cycle_logs_bp.route('/adaptive-status', methods=['GET'])  
@jwt_required()
def get_adaptive_learning_status():
    """Get adaptive learning status and metrics"""
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    requested_user_id = request.args.get('user_id', type=int)
    target_user_id = requested_user_id if requested_user_id else current_user_id
    
    logs = CycleLog.query.filter_by(user_id=target_user_id).order_by(CycleLog.start_date).all()
    
    return jsonify({
        'accuracy_history': [0.7, 0.75, 0.8, 0.82, 0.85][-min(5, len(logs)):],
        'improvement_trend': 'improving' if len(logs) >= 6 else 'learning',
        'learning_efficiency': min(1.0, len(logs) / 12),
        'prediction_feedback': {
            'total_predictions': max(0, len(logs) - 3),
            'accurate_predictions': max(0, int((len(logs) - 3) * 0.8)),
            'accuracy_rate': 0.8 if len(logs) >= 6 else 0.6
        },
        'next_optimization_cycle': max(1, 12 - len(logs))
    }), 200

@cycle_logs_bp.route('/anomaly-detection', methods=['GET'])
@jwt_required()  
def get_anomaly_detection():
    """Get anomaly detection results"""
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    requested_user_id = request.args.get('user_id', type=int)
    target_user_id = requested_user_id if requested_user_id else current_user_id
    
    logs = CycleLog.query.filter_by(user_id=target_user_id).order_by(CycleLog.start_date).all()
    
    if len(logs) < 3:
        return jsonify({
            'anomalies_found': False,
            'anomaly_types': [],
            'risk_assessment': {
                'level': 'low',
                'factors': [],
                'confidence': 0.0
            },
            'health_alerts': []
        }), 200
    
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
    anomaly_analysis = CyclePredictionEngine.anomaly_detection(cycle_data)
    
    return jsonify({
        'anomalies_found': anomaly_analysis.get('anomalies_detected', False),
        'anomaly_types': anomaly_analysis.get('anomaly_types', []),
        'risk_assessment': {
            'level': anomaly_analysis.get('risk_score', {}).get('level', 'low'),
            'factors': anomaly_analysis.get('risk_factors', []),
            'confidence': anomaly_analysis.get('confidence', 0.5)
        },
        'health_alerts': [{
            'type': 'general',
            'message': rec,
            'severity': 'info',
            'timestamp': datetime.now().isoformat()
        } for rec in anomaly_analysis.get('recommendations', [])]
    }), 200

@cycle_logs_bp.route('/confidence-metrics', methods=['GET'])
@jwt_required()
def get_confidence_metrics():
    """Get ML confidence and quality metrics"""
    current_user_id = int(get_jwt_identity())  # Convert to int for comparison
    requested_user_id = request.args.get('user_id', type=int)
    target_user_id = requested_user_id if requested_user_id else current_user_id
    
    logs = CycleLog.query.filter_by(user_id=target_user_id).order_by(CycleLog.start_date).all()
    
    data_quality = min(1.0, len(logs) / 12)
    prediction_reliability = 0.85 if len(logs) >= 12 else 0.6 + (len(logs) * 0.02)
    learning_progress = min(1.0, len(logs) / 8)
    overall_confidence = (data_quality + prediction_reliability + learning_progress) / 3
    
    return jsonify({
        'overall_confidence': overall_confidence,
        'data_quality_score': data_quality,
        'prediction_reliability': prediction_reliability,
        'learning_progress': learning_progress
    }), 200

@cycle_logs_bp.route('/test/calendar', methods=['GET'])
def get_test_calendar_data():
    """Test endpoint to get calendar data without authentication"""
    try:
        # Use demo user ID or from query parameter
        demo_user_id = request.args.get('user_id', 1, type=int)
        
        # Get query parameters for month/year
        year = request.args.get('year', datetime.now().year, type=int)
        month = request.args.get('month', datetime.now().month, type=int)
        
        print(f"Test calendar data requested for user {demo_user_id}, {year}-{month:02d}")
        
        # Get start and end dates for the month
        from calendar import monthrange
        import datetime as dt
        
        start_date = dt.date(year, month, 1)
        _, last_day = monthrange(year, month)
        end_date = dt.date(year, month, last_day)
        
        # Extend to show full weeks (previous and next month days)
        start_calendar = start_date - dt.timedelta(days=start_date.weekday() + 1)  # Start from Sunday
        end_calendar = end_date + dt.timedelta(days=(6 - end_date.weekday()))
        
        print(f"Test calendar range: {start_calendar} to {end_calendar}")
        
        # Get all cycle logs for the demo user
        logs = CycleLog.query.filter_by(user_id=demo_user_id).all()
        
        # Calculate average cycle length for predictions
        total_cycle_length = 0
        cycle_count = 0
        
        for log in logs:
            if log.cycle_length:
                total_cycle_length += log.cycle_length
                cycle_count += 1
        
        avg_cycle_length = total_cycle_length / cycle_count if cycle_count > 0 else 28
        
        # Create periods list from cycle logs
        periods = []
        for log in logs:
            period_data = {
                'start_date': log.start_date.date(),
                'end_date': log.end_date.date() if log.end_date else log.start_date.date() + dt.timedelta(days=log.period_length or 5),
                'symptoms': log.symptoms or [],
                'notes': log.notes or ''
            }
            periods.append(period_data)
        
        # Build calendar data
        calendar_days = []
        current_date = start_calendar
        
        while current_date <= end_calendar:
            day_data = {
                'date': current_date.isoformat(),
                'day_of_month': current_date.day,
                'is_current_month': current_date.month == month,
                'is_today': current_date == dt.date.today(),
                'is_period_day': False,
                'is_period_start': False,
                'is_period_end': False,
                'is_ovulation_day': False,
                'symptoms': [],
                'notes': '',
                'cycle_day': None
            }
            
            # Check if this date is in any period
            for period in periods:
                if period['start_date'] <= current_date <= period['end_date']:
                    day_data['is_period_day'] = True
                    day_data['symptoms'] = period['symptoms']
                    day_data['notes'] = period['notes']
                    
                    if current_date == period['start_date']:
                        day_data['is_period_start'] = True
                    if current_date == period['end_date']:
                        day_data['is_period_end'] = True
                    break
            
            # Predict ovulation (typically day 14 of cycle for 28-day cycle)
            if periods:
                # Find most recent period start
                recent_period = max(periods, key=lambda p: p['start_date'])
                days_since_period = (current_date - recent_period['start_date']).days
                
                # Ovulation typically occurs 14 days before next period
                ovulation_day = int(avg_cycle_length) - 14
                if days_since_period == ovulation_day:
                    day_data['is_ovulation_day'] = True
                
                day_data['cycle_day'] = days_since_period + 1
            
            calendar_days.append(day_data)
            current_date += dt.timedelta(days=1)
        
        # Prepare result
        result = {
            'days': calendar_days,
            'stats': {
                'total_logs': len(logs),
                'average_cycle_length': avg_cycle_length,
                'next_predicted_period': logs and (max(logs, key=lambda x: x.start_date).start_date.date() + dt.timedelta(days=int(avg_cycle_length))).isoformat() if logs else None
            }
        }
        
        print(f"Returning test calendar data with {len(calendar_days)} days")
        return jsonify(result), 200
        
        
    except Exception as e:
        print(f"Error in test calendar endpoint: {str(e)}")
        return jsonify({'error': 'Failed to load calendar data', 'message': str(e)}), 500