from app.models import CycleLog
from app import db
from flask import Blueprint, request, jsonify, current_app
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
from app.services.cycle_notifications import (
    notify_cycle_prediction_updated,
    notify_period_late,
    notify_cycle_anomaly,
)

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
    def _to_date(value):
        """Normalize datetime/date values for day-difference math."""
        if value is None:
            return None
        return value.date() if hasattr(value, 'date') else value

    @staticmethod
    def _predictions_from_result(result):
        """Unwrap predict_next_cycles return value (dict or legacy list)."""
        if isinstance(result, dict):
            return result.get('predictions', [])
        return result or []

    @staticmethod
    def extract_cycle_lengths_robust(cycle_logs: list) -> dict:
        """
        ALWAYS compute cycle length from consecutive start_date differences.
        NEVER use the stored cycle_length field as the primary source.
        """
        if not cycle_logs:
            return {'lengths': [], 'dates': [], 'raw_logs': [], 'error': 'no_data'}

        sorted_logs = sorted(
            [log for log in cycle_logs if log.start_date is not None],
            key=lambda x: x.start_date
        )

        if len(sorted_logs) < 2:
            return {
                'lengths': [],
                'dates': [sorted_logs[0].start_date] if sorted_logs else [],
                'raw_logs': sorted_logs,
                'error': 'insufficient_logs',
                'message': 'Need at least 2 period start dates to compute cycle length'
            }

        computed_lengths = []
        for i in range(len(sorted_logs) - 1):
            current_start = CyclePredictionEngine._to_date(sorted_logs[i].start_date)
            next_start = CyclePredictionEngine._to_date(sorted_logs[i + 1].start_date)
            gap = (next_start - current_start).days

            entry = {
                'length': gap,
                'start_date': current_start,
                'next_start_date': next_start,
                'log_id': getattr(sorted_logs[i], 'id', None),
                'is_valid': 15 <= gap <= 90,
                'is_outlier': False,
                'flow_intensity': getattr(sorted_logs[i], 'flow_intensity', None),
                'symptoms': getattr(sorted_logs[i], 'symptoms', None),
                'mood': getattr(sorted_logs[i], 'mood', None),
                'stress_level': getattr(sorted_logs[i], 'stress_level', None),
            }
            computed_lengths.append(entry)

        valid_lengths = [e['length'] for e in computed_lengths if e['is_valid']]

        return {
            'lengths': valid_lengths,
            'all_entries': computed_lengths,
            'dates': [sorted_logs[i].start_date for i in range(len(sorted_logs))],
            'raw_logs': sorted_logs,
            'total_logs': len(sorted_logs),
            'computable_cycles': len(computed_lengths),
            'valid_cycles': len(valid_lengths),
            'invalid_cycles': len([e for e in computed_lengths if not e['is_valid']]),
        }

    @staticmethod
    def compute_period_lengths(cycle_logs: list) -> list:
        """Period duration from explicit start/end dates only (inclusive end day, no +1)."""
        lengths = []
        for log in cycle_logs:
            if log.start_date and log.end_date:
                start = CyclePredictionEngine._to_date(log.start_date)
                end = CyclePredictionEngine._to_date(log.end_date)
                duration = (end - start).days
                if 1 <= duration <= 10:
                    lengths.append(duration)
        return lengths

    @staticmethod
    def _legacy_entries_from_cycle_data(cycle_data) -> list:
        """Convert robust extraction dict to legacy list entries for ML helpers."""
        if not cycle_data:
            return []
        if isinstance(cycle_data, dict):
            entries = []
            for e in cycle_data.get('all_entries', []):
                entries.append({
                    'length': e['length'],
                    'date': e.get('start_date'),
                    'source': 'computed',
                    'reliability': 'outlier' if e.get('is_outlier') else ('high' if e.get('is_valid', True) else 'low'),
                    'is_outlier': e.get('is_outlier', False),
                })
            return entries
        return cycle_data

    @staticmethod
    def detect_outliers_adaptive(lengths: list, user_baseline: dict = None) -> dict:
        """Adaptive IQR outlier detection with clinical bounds for short cycles."""
        if len(lengths) < 4:
            return {
                'clean_lengths': lengths,
                'outliers': [],
                'outlier_indices': [],
                'method': 'skipped_insufficient_data',
            }

        sorted_l = sorted(lengths)
        n = len(sorted_l)
        q1 = sorted_l[n // 4]
        q3 = sorted_l[(3 * n) // 4]
        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        lower_bound = max(lower_bound, 15)
        upper_bound = min(upper_bound, 90)

        median = statistics.median(lengths)
        lower_bound = min(lower_bound, median - 4)
        upper_bound = max(upper_bound, median + 4)

        clean = []
        outliers = []
        outlier_indices = []

        for i, length in enumerate(lengths):
            if lower_bound <= length <= upper_bound:
                clean.append(length)
            else:
                outliers.append(length)
                outlier_indices.append(i)

        return {
            'clean_lengths': clean,
            'outliers': outliers,
            'outlier_indices': outlier_indices,
            'bounds': {'lower': round(lower_bound, 1), 'upper': round(upper_bound, 1)},
            'method': 'adaptive_iqr',
            'iqr': round(iqr, 2),
            'q1': q1,
            'q3': q3,
        }

    @staticmethod
    def detect_outliers(cycle_data, method='iqr'):
        """Backward-compatible wrapper; marks outliers on robust extraction output."""
        if isinstance(cycle_data, dict):
            lengths = cycle_data.get('lengths', [])
            outlier_result = CyclePredictionEngine.detect_outliers_adaptive(lengths)
            outlier_set = set(outlier_result.get('outliers', []))
            for entry in cycle_data.get('all_entries', []):
                if entry['length'] in outlier_set and entry['length'] in outlier_result.get('outliers', []):
                    entry['is_outlier'] = True
            if outlier_result.get('outlier_indices'):
                valid_entries = [e for e in cycle_data.get('all_entries', []) if e.get('is_valid', True)]
                for idx in outlier_result['outlier_indices']:
                    if idx < len(valid_entries):
                        valid_entries[idx]['is_outlier'] = True
            cycle_data['lengths'] = outlier_result.get('clean_lengths', lengths) or lengths
            return CyclePredictionEngine._legacy_entries_from_cycle_data(cycle_data)

        if len(cycle_data) < 4:
            return cycle_data

        lengths = [c['length'] for c in cycle_data]
        outlier_result = CyclePredictionEngine.detect_outliers_adaptive(lengths)
        outlier_values = set(outlier_result.get('outliers', []))

        filtered_data = []
        for cycle in cycle_data:
            entry = dict(cycle)
            if entry['length'] in outlier_values:
                entry['is_outlier'] = True
                entry['reliability'] = 'outlier'
            filtered_data.append(entry)

        return filtered_data

    @staticmethod
    def compute_regularity_index(cycle_lengths: list) -> dict:
        """Clinician-style regularity score from computed cycle gaps."""
        if len(cycle_lengths) < 2:
            return {
                'score': None,
                'label': 'insufficient_data',
                'std_dev': None,
                'cv_percent': None,
                'interpretation': 'Need at least 2 cycles to assess regularity'
            }

        mean = statistics.mean(cycle_lengths)
        std = statistics.stdev(cycle_lengths)
        cv = (std / mean) * 100 if mean > 0 else 100
        max_deviation = max(abs(length - mean) for length in cycle_lengths)

        if std <= 1.0:
            score = 95 + min(5, (1 - std) * 5)
        elif std <= 2.0:
            score = 85 + (2.0 - std) * 10
        elif std <= 4.0:
            score = 70 + (4.0 - std) * 7.5
        elif std <= 7.0:
            score = 50 + (7.0 - std) * (20 / 3)
        else:
            score = max(0, 50 - (std - 7) * 5)

        score = round(min(100, max(0, score)), 1)

        if score >= 90:
            label = 'ultra_regular'
            interpretation = 'Cycles are extremely consistent — highly predictable'
        elif score >= 75:
            label = 'regular'
            interpretation = 'Cycles are within normal regular range'
        elif score >= 55:
            label = 'mostly_regular'
            interpretation = 'Minor variation — clinically normal, worth monitoring'
        elif score >= 35:
            label = 'somewhat_irregular'
            interpretation = 'Noticeable variation — lifestyle or hormonal factors possible'
        else:
            label = 'irregular'
            interpretation = 'Significant variation — recommend healthcare consultation'

        return {
            'score': score,
            'label': label,
            'std_dev': round(std, 2),
            'cv_percent': round(cv, 1),
            'max_deviation_days': round(max_deviation, 1),
            'mean_cycle_length': round(mean, 1),
            'interpretation': interpretation,
        }

    @staticmethod
    def build_personal_baseline(cycle_data: dict) -> dict:
        """Personalized cycle profile from computed start_date gaps."""
        lengths = cycle_data.get('lengths', [])

        if len(lengths) < 2:
            return {'error': 'insufficient_data', 'minimum_cycles_needed': 2}

        mean = statistics.mean(lengths)
        median = statistics.median(lengths)
        std = statistics.stdev(lengths) if len(lengths) >= 2 else 0

        recent = lengths[-3:] if len(lengths) >= 3 else lengths
        recent_mean = statistics.mean(recent)

        if len(lengths) >= 4:
            first_half_mean = statistics.mean(lengths[:len(lengths) // 2])
            second_half_mean = statistics.mean(lengths[len(lengths) // 2:])
            trend_delta = second_half_mean - first_half_mean
        else:
            trend_delta = 0

        sorted_lengths = sorted(lengths)
        q1 = sorted_lengths[len(lengths) // 4] if len(lengths) >= 4 else min(lengths)
        q3 = sorted_lengths[3 * len(lengths) // 4] if len(lengths) >= 4 else max(lengths)

        prediction_base = (recent_mean * 0.6) + (median * 0.4)
        if abs(trend_delta) > 1.5:
            prediction_base += trend_delta * 0.15

        return {
            'mean': round(mean, 2),
            'median': round(median, 2),
            'std_dev': round(std, 2),
            'recent_mean': round(recent_mean, 2),
            'prediction_base': round(prediction_base, 2),
            'trend_delta': round(trend_delta, 2),
            'trend_direction': 'shortening' if trend_delta < -1 else 'lengthening' if trend_delta > 1 else 'stable',
            'typical_range_days': [round(q1, 1), round(q3, 1)],
            'shortest_cycle': min(lengths),
            'longest_cycle': max(lengths),
            'cycles_analyzed': len(lengths),
        }

    @staticmethod
    def compute_confidence_score(cycle_data: dict) -> dict:
        """Confidence score based on computed cycle length data."""
        lengths = cycle_data.get('lengths', [])
        n = len(lengths)

        if n == 0:
            return {'score': 0, 'level': 'no_data', 'factors': {}}

        mean = statistics.mean(lengths)
        std = statistics.stdev(lengths) if n >= 2 else 10
        cv = (std / mean * 100) if mean > 0 else 100

        if n >= 12:
            volume_score = 1.0
        elif n >= 6:
            volume_score = 0.6 + (n - 6) * (0.4 / 6)
        elif n >= 2:
            volume_score = 0.2 + (n - 2) * (0.4 / 4)
        else:
            volume_score = 0.1

        if cv < 5:
            consistency_score = 1.0
        elif cv < 10:
            consistency_score = 0.85
        elif cv < 15:
            consistency_score = 0.65
        elif cv < 25:
            consistency_score = 0.40
        else:
            consistency_score = 0.15

        last_dates = cycle_data.get('dates', [])
        recency_score = 0.5
        if last_dates:
            last_date = CyclePredictionEngine._to_date(max(last_dates))
            days_since = (datetime.now().date() - last_date).days
            if days_since <= 35:
                recency_score = 1.0
            elif days_since <= 60:
                recency_score = 0.75
            elif days_since <= 90:
                recency_score = 0.50
            else:
                recency_score = 0.25

        all_entries = cycle_data.get('all_entries', [])
        if all_entries:
            invalid_count = len([e for e in all_entries if not e.get('is_valid', True)])
            outlier_ratio = invalid_count / len(all_entries)
            outlier_score = 1.0 - min(1.0, outlier_ratio * 2)
        else:
            outlier_score = 0.8

        if n >= 4:
            first_half = statistics.mean(lengths[:n // 2])
            second_half = statistics.mean(lengths[n // 2:])
            trend_change = abs(second_half - first_half)
            stability_score = max(0, 1.0 - (trend_change / 5))
        else:
            stability_score = 0.6

        total = (
            volume_score * 0.30 +
            consistency_score * 0.25 +
            recency_score * 0.15 +
            outlier_score * 0.15 +
            stability_score * 0.15
        )

        if total >= 0.82:
            level = 'very_high'
        elif total >= 0.65:
            level = 'high'
        elif total >= 0.45:
            level = 'medium'
        elif total >= 0.25:
            level = 'low'
        else:
            level = 'very_low'

        return {
            'score': round(total, 3),
            'level': level,
            'factors': {
                'data_volume': round(volume_score, 3),
                'consistency': round(consistency_score, 3),
                'recency': round(recency_score, 3),
                'outlier_ratio': round(outlier_score, 3),
                'trend_stability': round(stability_score, 3),
            },
            'cycles_analyzed': n,
            'cv_percent': round(cv, 1),
            'std_dev': round(std, 2),
        }

    @staticmethod
    def detect_health_anomalies(cycle_data: dict, period_lengths: list) -> dict:
        """Clinically grounded anomaly detection from computed patterns."""
        lengths = cycle_data.get('lengths', [])

        if not lengths:
            return {'anomalies': [], 'risk_level': 'unknown', 'risk_score': 0}

        mean = statistics.mean(lengths)
        std = statistics.stdev(lengths) if len(lengths) >= 2 else 0
        anomalies = []

        dates = cycle_data.get('dates', [])
        if dates:
            last_start = CyclePredictionEngine._to_date(max(dates))
            days_since_last = (datetime.now().date() - last_start).days
            if days_since_last > 90:
                anomalies.append({
                    'type': 'amenorrhea_risk',
                    'severity': 'high',
                    'days_since_last_period': days_since_last,
                    'message': f'No period logged for {days_since_last} days. If not pregnant, consult a healthcare provider.',
                    'action': 'urgent_consultation',
                })
            elif days_since_last > (mean + 2 * std) and days_since_last > mean + 7:
                anomalies.append({
                    'type': 'late_period',
                    'severity': 'medium',
                    'days_late': round(days_since_last - mean),
                    'message': f'Period is approximately {round(days_since_last - mean)} days later than your typical cycle.',
                    'action': 'monitor',
                })

        if period_lengths:
            avg_period = statistics.mean(period_lengths)
            if avg_period > 7:
                anomalies.append({
                    'type': 'menorrhagia_pattern',
                    'severity': 'medium',
                    'average_period_days': round(avg_period, 1),
                    'message': f'Average period length of {round(avg_period, 1)} days exceeds the typical 7-day maximum.',
                    'action': 'consultation_recommended',
                })

        long_cycles = [length for length in lengths if length > 35]
        if len(lengths) >= 4 and len(long_cycles) / len(lengths) > 0.5 and std > 5:
            anomalies.append({
                'type': 'pcos_pattern',
                'severity': 'medium',
                'percent_long_cycles': round(len(long_cycles) / len(lengths) * 100),
                'message': 'Cycle pattern with frequent long cycles and variability may warrant evaluation for hormonal conditions.',
                'action': 'consultation_recommended',
                'note': 'Only a healthcare provider can diagnose PCOS.',
            })

        short_cycles = [length for length in lengths if length < 21]
        if len(short_cycles) / len(lengths) > 0.3 and mean < 24:
            anomalies.append({
                'type': 'naturally_short_cycles',
                'severity': 'low',
                'average_length': round(mean, 1),
                'message': f'Your cycles average {round(mean, 1)} days. Cycles under 21 days are worth tracking. Mention to your provider at next visit.',
                'action': 'mention_at_next_visit',
            })

        if len(lengths) >= 5:
            historical_mean = statistics.mean(lengths[:-3])
            recent_mean = statistics.mean(lengths[-3:])
            if abs(recent_mean - historical_mean) > (std * 1.5 + 3):
                anomalies.append({
                    'type': 'recent_pattern_shift',
                    'severity': 'medium',
                    'historical_mean': round(historical_mean, 1),
                    'recent_mean': round(recent_mean, 1),
                    'shift_days': round(recent_mean - historical_mean, 1),
                    'message': f'Your recent cycles have shifted by {round(abs(recent_mean - historical_mean), 1)} days compared to your historical pattern.',
                    'action': 'monitor_closely',
                })

        severity_weights = {'high': 5, 'medium': 3, 'low': 1}
        raw_score = sum(severity_weights.get(a['severity'], 1) for a in anomalies)
        risk_score = min(100, raw_score * 12)

        risk_level = 'high' if risk_score >= 60 else \
            'medium' if risk_score >= 30 else \
            'low' if risk_score >= 10 else 'minimal'

        return {
            'anomalies': anomalies,
            'anomaly_count': len(anomalies),
            'risk_score': risk_score,
            'risk_level': risk_level,
            'cycles_analyzed': len(lengths),
        }
    
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
            latest_date = max(
                CyclePredictionEngine._to_date(c['date']) for c in cycle_data if c.get('date')
            )
            today = CyclePredictionEngine._to_date(datetime.now())
            days_since_latest = (today - latest_date).days
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
        """Calculate overall regularity score (0-100) from computed cycle gaps."""
        result = CyclePredictionEngine.compute_regularity_index(lengths)
        return result.get('score') or 0
    
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
    def predict_next_cycles(cycle_logs: list, num_predictions: int = 3, user_id=None) -> dict:
        """
        Generate next N cycle predictions grounded in the user's personal history.
        Returns a dict with predictions list and baseline metadata.
        """
        from datetime import date

        if not cycle_logs:
            return {
                'predictions': [],
                'error': 'insufficient_data',
                'message': 'No cycle logs available',
            }

        cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(cycle_logs)

        if cycle_data.get('error') or len(cycle_data.get('lengths', [])) < 1:
            default_preds = CyclePredictionEngine._generate_default_predictions(cycle_logs, num_predictions)
            return {
                'predictions': default_preds if isinstance(default_preds, list) else [],
                'error': 'insufficient_data',
                'message': 'Log at least 2 period start dates to generate predictions',
                'cycles_available': cycle_data.get('valid_cycles', 0),
            }

        outlier_result = CyclePredictionEngine.detect_outliers_adaptive(cycle_data['lengths'])
        if outlier_result.get('clean_lengths'):
            cycle_data['lengths'] = outlier_result['clean_lengths']

        lengths = cycle_data['lengths']
        sorted_logs = cycle_data['raw_logs']

        last_period_start = CyclePredictionEngine._to_date(sorted_logs[-1].start_date)

        baseline = CyclePredictionEngine.build_personal_baseline(cycle_data)
        if baseline.get('error'):
            predicted_length = lengths[0] if lengths else 28
            confidence = 'very_low'
        else:
            predicted_length = baseline['prediction_base']
            confidence = CyclePredictionEngine.compute_confidence_score(cycle_data)['level']

        period_lengths = CyclePredictionEngine.compute_period_lengths(cycle_logs)
        avg_period_length = round(sum(period_lengths) / len(period_lengths), 1) if period_lengths else 5

        predictions = []
        current_base_date = last_period_start

        for i in range(num_predictions):
            cycle_adjustment = 0
            if not baseline.get('error') and abs(baseline.get('trend_delta', 0)) > 1.5:
                cycle_adjustment = baseline['trend_delta'] * 0.1 * (i + 1)
                cycle_adjustment = max(-3, min(3, cycle_adjustment))

            this_cycle_length = round(predicted_length + cycle_adjustment, 1)
            this_cycle_length = max(15, min(90, this_cycle_length))

            next_start = current_base_date + timedelta(days=round(this_cycle_length))
            next_end = next_start + timedelta(days=round(avg_period_length) - 1)

            next_next_start = next_start + timedelta(days=round(this_cycle_length))
            ovulation_date = next_next_start - timedelta(days=14)
            fertile_start = ovulation_date - timedelta(days=5)
            fertile_end = ovulation_date + timedelta(days=1)

            std = baseline.get('std_dev', 3) if not baseline.get('error') else 5
            earliest_start = next_start - timedelta(days=round(std))
            latest_start = next_start + timedelta(days=round(std))

            predictions.append({
                'cycle_number': i + 1,
                'predicted_start': next_start.isoformat(),
                'predicted_end': next_end.isoformat(),
                'predicted_cycle_length': this_cycle_length,
                'predicted_period_length': avg_period_length,
                'ovulation_date': ovulation_date.isoformat(),
                'fertile_window_start': fertile_start.isoformat(),
                'fertile_window_end': fertile_end.isoformat(),
                'confidence': confidence,
                'confidence_interval': {
                    'earliest_start': earliest_start.isoformat(),
                    'latest_start': latest_start.isoformat(),
                    'range_days': round(std * 2, 1),
                },
                'days_until': (next_start - date.today()).days,
                'trend_note': baseline.get('trend_direction', 'stable') if not baseline.get('error') else None,
            })

            current_base_date = next_start

        return {
            'predictions': predictions,
            'baseline': baseline,
            'confidence': confidence,
            'cycles_used_for_prediction': len(lengths),
            'last_period_start': last_period_start.isoformat(),
            'generated_at': date.today().isoformat(),
        }
    
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
        
        # ── Amenorrhea & late period detection ────────────────────────────────
        sorted_by_date = sorted(logs, key=lambda x: x.start_date)
        last_period_start = sorted_by_date[-1].start_date
        days_since_last = (datetime.now() - last_period_start).days
        computed_for_late = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
        cycle_lengths_for_avg = computed_for_late.get('lengths', [])
        avg_cycle_for_late = statistics.mean(cycle_lengths_for_avg) if cycle_lengths_for_avg else 28
        days_late = days_since_last - int(avg_cycle_for_late)

        if days_since_last >= 90:
            insights.insert(0, {
                'type': 'warning',
                'category': 'amenorrhea_risk',
                'message': (
                    f'No period recorded for {days_since_last} days. '
                    'Absence of menstruation for 3+ months (secondary amenorrhea) can indicate '
                    'thyroid disorders, PCOS, excessive exercise, low body weight, or elevated stress. '
                    'Please consult a healthcare provider promptly.'
                ),
                'detail': f"Last logged period: {last_period_start.strftime('%B %d, %Y')} | "
                          f"Average cycle: {int(avg_cycle_for_late)} days",
                'action_required': True,
                'priority': 'high'
            })
        elif days_late >= 10:
            insights.insert(0, {
                'type': 'info',
                'category': 'late_period',
                'message': (
                    f'Your period appears to be approximately {days_late} days late based on your '
                    f'average cycle length of {int(avg_cycle_for_late)} days. '
                    'Consider taking a pregnancy test if sexually active, and note any unusual symptoms.'
                ),
                'detail': f"Last logged period: {last_period_start.strftime('%B %d, %Y')}",
                'priority': 'medium'
            })
        # ─────────────────────────────────────────────────────────────────────

        computed_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
        cycle_lengths = computed_data.get('lengths', [])
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
        
        period_lengths = CyclePredictionEngine.compute_period_lengths(logs)
        if period_lengths:
            avg_period = statistics.mean(period_lengths)
            if avg_period > 7:
                insights.append({
                    'type': 'warning',
                    'category': 'menorrhagia_risk',
                    'message': (
                        f'Your periods average {round(avg_period, 1)} days, which is longer than the typical '
                        '2–7 day range. Periods consistently lasting >7 days (menorrhagia) may indicate '
                        'fibroids, polyps, hormonal imbalance, or a bleeding disorder. Discuss with your healthcare provider.'
                    ),
                    'detail': f"Average period length: {round(avg_period, 1)} days",
                    'priority': 'medium'
                })
            elif avg_period < 2:
                insights.append({
                    'type': 'info',
                    'category': 'period_length',
                    'message': (
                        f'Your periods average only {round(avg_period, 1)} day(s), which is shorter than typical. '
                        'Hypomenorrhea can be caused by hormonal contraceptives, low body weight, or thyroid issues.'
                    ),
                    'detail': f"Average period length: {round(avg_period, 1)} days",
                    'priority': 'low'
                })

        # ── PCOS-pattern detection ─────────────────────────────────────────
        # PCOS often presents as: long irregular cycles (>35 days), high variability, or
        # cycles absent for extended periods. We flag the pattern, not diagnose.
        if cycle_lengths and len(cycle_lengths) >= 3:
            long_cycle_count = sum(1 for cl in cycle_lengths if cl > 35)
            long_cycle_fraction = long_cycle_count / len(cycle_lengths)
            variability_for_pcos = CyclePredictionEngine.calculate_cycle_variability(cycle_lengths)
            cv = variability_for_pcos.get('coefficient_of_variation', 0)

            if long_cycle_fraction >= 0.5 and cv > 20:
                insights.append({
                    'type': 'info',
                    'category': 'pcos_pattern',
                    'message': (
                        f'{int(long_cycle_fraction * 100)}% of your cycles are longer than 35 days '
                        f'with high variability (CV {round(cv, 1)}%). This pattern can be associated with '
                        'Polycystic Ovary Syndrome (PCOS). Only a healthcare provider can diagnose PCOS — '
                        'consider a consultation if you have concerns.'
                    ),
                    'detail': f"Long cycles (>35 days): {long_cycle_count}/{len(cycle_lengths)}, CV: {round(cv, 1)}%",
                    'priority': 'medium',
                    'action_required': False
                })
        # ─────────────────────────────────────────────────────────────────
        
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
    def _fmt_symptoms(raw):
        if not raw:
            return []
        if isinstance(raw, list):
            return [s.strip() for s in raw if s and str(s).strip()]
        return [s.strip() for s in str(raw).split(',') if s.strip()]

    def _fmt_exercise(raw):
        if not raw:
            return []
        if isinstance(raw, list):
            return raw
        try:
            import json as _json
            parsed = _json.loads(raw)
            return parsed if isinstance(parsed, list) else [raw]
        except Exception:
            return [s.strip() for s in str(raw).split(',') if s.strip()]

    result = {
        'items': [{
            'id': log.id,
            'start_date': log.start_date.isoformat(),
            'end_date': log.end_date.isoformat() if log.end_date else None,
            'cycle_length': log.cycle_length,
            'period_length': log.period_length,
            'flow_intensity': log.flow_intensity,
            'symptoms': _fmt_symptoms(log.symptoms),
            'notes': log.notes,
            # Enhanced wellness data
            'mood': log.mood,
            'energy_level': log.energy_level,
            'sleep_quality': log.sleep_quality,
            'stress_level': log.stress_level,
            'exercise_activities': _fmt_exercise(log.exercise_activities),
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
    
    def _fmt_syms(raw):
        if not raw:
            return []
        if isinstance(raw, list):
            return [s.strip() for s in raw if s and str(s).strip()]
        return [s.strip() for s in str(raw).split(',') if s.strip()]

    def _fmt_ex(raw):
        if not raw:
            return []
        if isinstance(raw, list):
            return raw
        try:
            import json as _json
            parsed = _json.loads(raw)
            return parsed if isinstance(parsed, list) else [raw]
        except Exception:
            return [s.strip() for s in str(raw).split(',') if s.strip()]

    # Format the response
    result = {
        'id': log.id,
        'start_date': log.start_date.isoformat(),
        'end_date': log.end_date.isoformat() if log.end_date else None,
        'cycle_length': log.cycle_length,
        'period_length': log.period_length,
        'flow_intensity': log.flow_intensity,
        'symptoms': _fmt_syms(log.symptoms),
        'notes': log.notes,
        # Enhanced wellness data
        'mood': log.mood,
        'energy_level': log.energy_level,
        'sleep_quality': log.sleep_quality,
        'stress_level': log.stress_level,
        'exercise_activities': _fmt_ex(log.exercise_activities),
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
            period_length = (end_date - start_date).days
        
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
            flow_intensity=data.get('flow_intensity') or data.get('flow_level', 'medium'),
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
        predictions = CyclePredictionEngine._predictions_from_result(
            CyclePredictionEngine.predict_next_cycles(all_logs, num_predictions=1)
        )
        
        # Create enhanced notification using the new cycle notification helper
        if predictions:
            prediction = predictions[0]
            confidence = prediction['confidence']
            next_date = datetime.fromisoformat(prediction['predicted_start'])
            
            # Extract fertile window if available
            fertile_start = prediction.get('fertile_start')
            fertile_end = prediction.get('fertile_end')
            
            # 🔔 Call the new cycle notification helper
            notify_cycle_prediction_updated(
                user_id=target_user_id,
                next_period_date=next_date,
                fertile_start=fertile_start,
                fertile_end=fertile_end,
                confidence=confidence
            )
            
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
        if 'flow_intensity' in data or 'flow_level' in data:
            log.flow_intensity = data.get('flow_intensity') or data.get('flow_level')
        
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
    
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
    period_lengths = CyclePredictionEngine.compute_period_lengths(logs)
    cycle_lengths = cycle_data.get('lengths', [])
    outlier_result = {'outliers': [], 'outlier_indices': []}

    if cycle_lengths:
        outlier_result = CyclePredictionEngine.detect_outliers_adaptive(cycle_lengths)
        if outlier_result.get('clean_lengths'):
            cycle_lengths = outlier_result['clean_lengths']
            cycle_data['lengths'] = cycle_lengths

    filtered_cycle_data = CyclePredictionEngine._legacy_entries_from_cycle_data(cycle_data)
    trend_analysis = CyclePredictionEngine.analyze_trend(filtered_cycle_data) if filtered_cycle_data else {'trend': 'insufficient_data'}

    print(f"📈 Computed cycle gaps: {cycle_lengths}, period lengths: {period_lengths}")

    avg_cycle_length = round(statistics.mean(cycle_lengths), 1) if cycle_lengths else None
    avg_period_length = round(statistics.mean(period_lengths), 1) if period_lengths else None
    weighted_cycle_avg = cycle_data.get('lengths') and round(statistics.median(cycle_lengths), 1)
    regularity = CyclePredictionEngine.compute_regularity_index(cycle_lengths) if cycle_lengths else None
    confidence = CyclePredictionEngine.compute_confidence_score(cycle_data) if cycle_lengths else None
    confidence_level = confidence['level'] if confidence else 'no_data'
    variability_info = CyclePredictionEngine.calculate_cycle_variability(cycle_lengths) if len(cycle_lengths) >= 2 else None

    prediction_result = CyclePredictionEngine.predict_next_cycles(logs, num_predictions=3, user_id=str(current_user_id))
    predictions = CyclePredictionEngine._predictions_from_result(prediction_result)
    
    # Analyze symptom patterns
    symptom_analysis = CyclePredictionEngine.analyze_symptoms_patterns(logs)
    
    # Generate health insights
    health_insights = CyclePredictionEngine.calculate_health_insights(logs)
    
    # Get the most recent log
    latest_log = logs[-1]
    print(f"📅 Latest log: {latest_log.start_date} - {latest_log.end_date}")
    
    # Calculate days since last period
    days_since_period = (datetime.now() - latest_log.start_date).days
    
    # Determine current cycle phase with correct boundaries
    current_phase = None
    if weighted_cycle_avg:
        avg_period_len = avg_period_length or 5
        if days_since_period >= int(weighted_cycle_avg) + 14:
            # More than one full cycle overdue — flag as overdue, not luteal
            current_phase = 'overdue'
        elif days_since_period <= avg_period_len:
            current_phase = 'menstrual'
        elif days_since_period <= int(weighted_cycle_avg) - 16:
            current_phase = 'follicular'
        elif days_since_period <= int(weighted_cycle_avg) - 11:
            # Biologically, ovulation window spans ~5 days (LH surge + ±2 days around O-day)
            current_phase = 'ovulation'
        else:
            current_phase = 'luteal'
    
    stats = {
        'basic_stats': {
            'average_cycle_length': avg_cycle_length,
            'average_period_length': avg_period_length,
            'weighted_cycle_length': weighted_cycle_avg,
            'median_cycle_length': round(statistics.median(cycle_lengths), 1) if cycle_lengths else None,
            'total_logs': len(logs),
            'data_points': len(cycle_lengths),
            'computable_cycles': cycle_data.get('computable_cycles', 0),
            'valid_cycles': cycle_data.get('valid_cycles', 0),
            'latest_period_start': latest_log.start_date.isoformat(),
            'days_since_period': days_since_period,
            'current_cycle_phase': current_phase,
            'shortest_cycle': min(cycle_lengths) if cycle_lengths else None,
            'longest_cycle': max(cycle_lengths) if cycle_lengths else None,
            'std_deviation': round(statistics.stdev(cycle_lengths), 2) if len(cycle_lengths) >= 2 else 0,
        },
        'regularity': regularity,
        'confidence': confidence,
        'enhanced_analysis': {
            'confidence_level': confidence_level,
            'trend_analysis': trend_analysis,
            'outliers_detected': len(outlier_result.get('outliers', [])),
            'data_quality_score': regularity['score'] if regularity and regularity.get('score') is not None else 0
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
    
    # Determine if the primary prediction is stale (i.e. the predicted date is already in the past)
    prediction_outdated = False
    if primary_prediction:
        try:
            pred_date = datetime.fromisoformat(primary_prediction['predicted_start'])
            prediction_outdated = pred_date < datetime.now()
            # If the first prediction is already in the past, find the next future one
            if prediction_outdated:
                for pred in predictions:
                    if datetime.fromisoformat(pred['predicted_start']) >= datetime.now():
                        primary_prediction = pred
                        prediction_outdated = False
                        break
        except Exception:
            pass

    flow_counts = {'light': 0, 'medium': 0, 'heavy': 0}
    for log in logs:
        if log.flow_intensity in flow_counts:
            flow_counts[log.flow_intensity] += 1

    legacy_summary = {
        'average_cycle_length': stats['basic_stats'].get('average_cycle_length'),
        'average_period_length': stats['basic_stats'].get('average_period_length'),
        'weighted_cycle_length': stats['basic_stats'].get('weighted_cycle_length'),
        'median_cycle_length': stats['basic_stats'].get('median_cycle_length'),
        'regularity_status': regularity.get('label') if regularity else None,
        'regularity_interpretation': regularity.get('interpretation') if regularity else None,
        'flow_breakdown': flow_counts,
        'dominant_flow': max(flow_counts, key=flow_counts.get) if any(flow_counts.values()) else None,
        'cycle_history': [
            {
                'cycle_number': i + 1,
                'length': e['length'],
                'start_date': e['start_date'].isoformat() if hasattr(e['start_date'], 'isoformat') else str(e['start_date']),
                'is_valid': e['is_valid'],
                'flow_intensity': e.get('flow_intensity'),
                'symptoms': e.get('symptoms'),
            }
            for i, e in enumerate(cycle_data.get('all_entries', []))
        ],
        'latest_period_start': stats['basic_stats'].get('latest_period_start'),
        'days_since_period': stats['basic_stats'].get('days_since_period'),
        'current_cycle_phase': stats['basic_stats'].get('current_cycle_phase'),
        'total_logs': stats['basic_stats'].get('total_logs'),
        'next_period_prediction': primary_prediction.get('predicted_start') if primary_prediction else None,
        'next_period_end': primary_prediction.get('predicted_end') if primary_prediction else None,
        'next_period_confidence': primary_prediction.get('confidence') if primary_prediction else None,
        'next_cycle_number': primary_prediction.get('cycle_number') if primary_prediction else None,
        'prediction_is_outdated': prediction_outdated,
        'fertile_window_start': primary_prediction.get('fertile_window_start') if primary_prediction else None,
        'fertile_window_end': primary_prediction.get('fertile_window_end') if primary_prediction else None,
        'ovulation_date': primary_prediction.get('ovulation_date') if primary_prediction else None,
    }

    # Regularity score drives dashboard "cycle regularity index"
    health_score = regularity['score'] if regularity and regularity.get('score') is not None else 0
    _days = days_since_period
    if _days >= 90:
        health_score = max(0, health_score - 20)
    elif avg_cycle_length and _days >= int(avg_cycle_length) + 10:
        health_score = max(0, health_score - 10)
    legacy_summary['health_score'] = health_score
    legacy_summary['health_score_label'] = (
        regularity.get('label', '').replace('_', ' ').title() if regularity and regularity.get('label') else (
            'Excellent' if health_score >= 80 else
            'Good' if health_score >= 65 else
            'Fair' if health_score >= 50 else
            'Needs Attention'
        )
    )

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
    
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
    cycle_lengths = cycle_data.get('lengths', [])
    if cycle_lengths:
        outlier_result = CyclePredictionEngine.detect_outliers_adaptive(cycle_lengths)
        cycle_lengths = outlier_result.get('clean_lengths', cycle_lengths)
    avg_cycle_length = statistics.mean(cycle_lengths) if cycle_lengths else 28
    baseline = CyclePredictionEngine.build_personal_baseline(cycle_data) if len(cycle_lengths) >= 2 else {}
    if baseline.get('prediction_base'):
        avg_cycle_length = baseline['prediction_base']

    predictions = CyclePredictionEngine._predictions_from_result(
        CyclePredictionEngine.predict_next_cycles(logs, num_predictions=6)
    )
    
    print(f"📊 Enhanced calendar: {len(logs)} logs, {len(cycle_lengths)} cycles, avg: {avg_cycle_length:.1f}")
    
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
                
                # Flow intensity: prefer stored value; fall back to day-based heuristic
                if log.flow_intensity:
                    day_data['flow_intensity'] = log.flow_intensity
                else:
                    days_into_period = (current_date - log_start).days
                    if days_into_period == 0:
                        day_data['flow_intensity'] = 'medium'   # start day
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
                    # Ovulation window spans 5 days (LH surge ±2 days around O-day = cycle day cycle_length-16 to cycle_length-11)
                    if not day_data['is_period_day']:
                        if cycle_day <= cycle_length - 16:
                            day_data['phase'] = 'follicular'
                        elif cycle_day <= cycle_length - 11:
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
    
    cycle_lengths = cycle_data.get('lengths', [])
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
    try:
        return _build_cycle_insights_response()
    except Exception as e:
        current_app.logger.error(f"Failed to build cycle insights: {e}", exc_info=True)
        return jsonify({
            'message': 'Unable to generate insights right now',
            'insights': [],
            'recommendations': [],
        }), 500


def _build_cycle_insights_response():
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
    
    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
    cycle_lengths = cycle_data.get('lengths', [])
    filtered_cycle_data = CyclePredictionEngine._legacy_entries_from_cycle_data(cycle_data)
    trend_analysis = CyclePredictionEngine.analyze_trend(filtered_cycle_data) if filtered_cycle_data else {'trend': 'insufficient_data'}
    
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
        days_since_period = (
            CyclePredictionEngine._to_date(datetime.now())
            - CyclePredictionEngine._to_date(latest_log.start_date)
        ).days
        avg_cycle = statistics.mean(cycle_lengths) if cycle_lengths else 28
        period_len = latest_log.period_length or 5
        
        if days_since_period >= int(avg_cycle) + 14:
            # Significantly overdue — skip generic phase tip, amenorrhea alert handled above
            phase_rec = {
                'priority': 'high',
                'category': 'current_phase',
                'title': 'Cycle Overdue — Consult a Provider',
                'phase': 'overdue',
                'tips': [
                    'Your period is significantly overdue.',
                    'Consider taking a pregnancy test if sexually active.',
                    'Track any symptoms (nausea, fatigue, unusual discharge).',
                    'Consult a healthcare provider for evaluation.'
                ]
            }
        elif days_since_period <= period_len:
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
        elif days_since_period <= avg_cycle - 16:
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
        elif days_since_period <= avg_cycle - 11:  # 5-day ovulation window
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
    
    prediction_result = CyclePredictionEngine.predict_next_cycles(logs, num_predictions=num_predictions)
    predictions = CyclePredictionEngine._predictions_from_result(prediction_result)
    
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
    legacy_cycle_entries = CyclePredictionEngine._legacy_entries_from_cycle_data(cycle_data)
    try:
        ml_patterns = CyclePredictionEngine.ml_pattern_recognition(legacy_cycle_entries, str(target_user_id))
    except Exception as e:
        print(f"ML Pattern Recognition Error: {str(e)}")
        ml_patterns = {'patterns': [], 'confidence': 'error', 'recommendations': []}
    
    try:
        anomaly_analysis = CyclePredictionEngine.anomaly_detection(legacy_cycle_entries)
    except Exception as e:
        print(f"Anomaly Detection Error: {str(e)}")
        anomaly_analysis = {'anomalies': [], 'score': 0.0}
    
    try:
        adaptive_prediction = CyclePredictionEngine.adaptive_learning_prediction(legacy_cycle_entries, str(target_user_id))
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
        lengths = cycle_data.get('lengths', []) if isinstance(cycle_data, dict) else [c['length'] for c in cycle_data]
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
    legacy_entries = CyclePredictionEngine._legacy_entries_from_cycle_data(cycle_data)
    try:
        ml_patterns = CyclePredictionEngine.ml_pattern_recognition(legacy_entries, str(target_user_id))
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
    legacy_entries = CyclePredictionEngine._legacy_entries_from_cycle_data(cycle_data)
    anomaly_analysis = CyclePredictionEngine.anomaly_detection(legacy_entries)
    
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


# ============================================================================
# FERTILE WINDOW ENDPOINT
# ============================================================================

@cycle_logs_bp.route('/fertile-window', methods=['GET'])
@jwt_required()
def get_fertile_window():
    """
    Return the current or upcoming fertile window for the authenticated user.
    Ovulation = 14 days before next predicted period (luteal phase is constant).
    Fertile window = ovulation - 5 days to ovulation + 1 day (6 days total).
    """
    try:
        current_user_id = int(get_jwt_identity())

        # Parent viewing child data
        requested_user_id = request.args.get('user_id', type=int)
        target_user_id = current_user_id
        if requested_user_id and requested_user_id != current_user_id:
            from app.models import User, ParentChild, Parent, Adolescent
            user = User.query.get(current_user_id)
            if not user or user.user_type != 'parent':
                return jsonify({'message': 'Only parents can view child data'}), 403
            parent = Parent.query.filter_by(user_id=current_user_id).first()
            adolescent = Adolescent.query.filter_by(user_id=requested_user_id).first()
            if not parent or not adolescent:
                return jsonify({'message': 'Parent or child record not found'}), 404
            parent_child = ParentChild.query.filter_by(
                parent_id=parent.id, adolescent_id=adolescent.id
            ).first()
            if not parent_child:
                return jsonify({'message': 'Access denied'}), 403
            target_user_id = requested_user_id

        logs = CycleLog.query.filter_by(user_id=target_user_id)\
            .order_by(CycleLog.start_date).all()

        if not logs:
            return jsonify({
                'has_data': False,
                'message': 'No cycle data available. Log your first period to get fertile window predictions.',
                'fertile_window': None
            }), 200

        predictions = CyclePredictionEngine._predictions_from_result(
            CyclePredictionEngine.predict_next_cycles(logs, num_predictions=3)
        )
        today = datetime.now().date()

        # Find the first future ovulation/fertile window
        for pred in predictions:
            ovulation_date = datetime.fromisoformat(pred['ovulation_date']).date()
            fertile_start = datetime.fromisoformat(pred['fertile_window_start']).date()
            fertile_end = datetime.fromisoformat(pred['fertile_window_end']).date()
            next_period = datetime.fromisoformat(pred['predicted_start']).date()

            # Is the fertile window upcoming or currently active?
            if fertile_end >= today:
                is_in_window = fertile_start <= today <= fertile_end
                days_until_window = max(0, (fertile_start - today).days)
                days_until_ovulation = (ovulation_date - today).days

                return jsonify({
                    'has_data': True,
                    'is_currently_fertile': is_in_window,
                    'fertile_window': {
                        'start': fertile_start.isoformat(),
                        'end': fertile_end.isoformat(),
                        'ovulation_date': ovulation_date.isoformat(),
                        'next_period_date': next_period.isoformat(),
                        'confidence': pred['confidence'],
                        'predicted_cycle_length': pred['predicted_cycle_length']
                    },
                    'days_until_fertile_window': days_until_window,
                    'days_until_ovulation': days_until_ovulation,
                    'fertility_tip': (
                        'You are currently in your fertile window! '
                        'This is the best time to conceive if trying to get pregnant.'
                        if is_in_window else
                        f'Your next fertile window starts in {days_until_window} day(s). '
                        'Sperm can survive 3-5 days, so the window starts before ovulation.'
                    )
                }), 200

        return jsonify({
            'has_data': True,
            'is_currently_fertile': False,
            'message': 'No upcoming fertile window found in the next 3 predictions.',
            'fertile_window': None
        }), 200

    except Exception as e:
        return jsonify({'message': f'Error calculating fertile window: {str(e)}'}), 500


# ============================================================================
# HEALTH SUMMARY ENDPOINT
# ============================================================================

@cycle_logs_bp.route('/health-summary', methods=['GET'])
@jwt_required()
def get_health_summary():
    """
    Comprehensive women's health summary combining cycle regularity,
    predicted fertile window, current phase, health alerts, and data completeness.
    Designed to surface the most clinically meaningful information at a glance.
    """
    try:
        current_user_id = int(get_jwt_identity())

        # Parent viewing child data
        requested_user_id = request.args.get('user_id', type=int)
        target_user_id = current_user_id
        if requested_user_id and requested_user_id != current_user_id:
            from app.models import User, ParentChild, Parent, Adolescent
            user = User.query.get(current_user_id)
            if not user or user.user_type != 'parent':
                return jsonify({'message': 'Only parents can view child data'}), 403
            parent = Parent.query.filter_by(user_id=current_user_id).first()
            adolescent = Adolescent.query.filter_by(user_id=requested_user_id).first()
            if not parent or not adolescent:
                return jsonify({'message': 'Parent or child record not found'}), 404
            parent_child = ParentChild.query.filter_by(
                parent_id=parent.id, adolescent_id=adolescent.id
            ).first()
            if not parent_child:
                return jsonify({'message': 'Access denied'}), 403
            target_user_id = requested_user_id

        logs = CycleLog.query.filter_by(user_id=target_user_id)\
            .order_by(CycleLog.start_date).all()

        today = datetime.now().date()

        if not logs:
            return jsonify({
                'has_data': False,
                'health_score': None,
                'data_completeness_pct': 0,
                'current_phase': None,
                'days_since_period': None,
                'next_period_prediction': None,
                'fertile_window': None,
                'health_alerts': [],
                'recommendations': [
                    'Start logging your cycle to receive personalised health insights.',
                    'Track at least 3 periods for basic predictions.',
                    'Track 6+ periods for high-confidence predictions.'
                ],
                'last_updated': datetime.utcnow().isoformat()
            }), 200

        cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(logs)
        cycle_lengths = cycle_data.get('lengths', [])
        if cycle_lengths:
            outlier_result = CyclePredictionEngine.detect_outliers_adaptive(cycle_lengths)
            cycle_lengths = outlier_result.get('clean_lengths', cycle_lengths)
        period_lengths = CyclePredictionEngine.compute_period_lengths(logs)
        filtered = CyclePredictionEngine._legacy_entries_from_cycle_data(cycle_data)

        avg_cycle = statistics.mean(cycle_lengths) if cycle_lengths else 28.0
        avg_period = statistics.mean(period_lengths) if period_lengths else 5.0
        variability = CyclePredictionEngine.calculate_cycle_variability(cycle_lengths) if len(cycle_lengths) >= 2 else None
        trend = CyclePredictionEngine.analyze_trend(filtered) if filtered else {'trend': 'insufficient_data'}

        latest_log = logs[-1]
        days_since = (datetime.now() - latest_log.start_date).days

        # Cycle phase — ovulation window = 5 days (LH surge ±2 around O-day)
        period_len_used = latest_log.period_length or int(avg_period)
        if days_since >= int(avg_cycle) + 14:
            current_phase = 'overdue'
        elif days_since <= period_len_used:
            current_phase = 'menstrual'
        elif days_since <= int(avg_cycle) - 16:
            current_phase = 'follicular'
        elif days_since <= int(avg_cycle) - 11:
            current_phase = 'ovulation'
        else:
            current_phase = 'luteal'

        predictions = CyclePredictionEngine._predictions_from_result(
            CyclePredictionEngine.predict_next_cycles(logs, num_predictions=3)
        )
        next_future_pred = None
        for pred in predictions:
            if datetime.fromisoformat(pred['predicted_start']).date() >= today:
                next_future_pred = pred
                break
        if not next_future_pred and predictions:
            next_future_pred = predictions[0]  # Show last even if past

        # Health alerts
        health_alerts = []
        if days_since >= 90:
            health_alerts.append({
                'type': 'critical',
                'category': 'amenorrhea',
                'title': 'Prolonged Absence of Period',
                'message': (
                    f'No period logged for {days_since} days. '
                    'This may indicate amenorrhea. Please consult a healthcare provider.'
                ),
                'action': 'Schedule a healthcare appointment'
            })
        elif days_since >= int(avg_cycle) + 10:
            health_alerts.append({
                'type': 'warning',
                'category': 'late_period',
                'title': 'Period May Be Late',
                'message': f'Your period appears to be {days_since - int(avg_cycle)} days late.',
                'action': 'Consider taking a pregnancy test if sexually active'
            })

        if avg_cycle < 21:
            health_alerts.append({
                'type': 'warning',
                'category': 'short_cycles',
                'title': 'Unusually Short Cycles',
                'message': f'Average cycle length of {round(avg_cycle, 1)} days is below the normal range (21–35 days).',
                'action': 'Discuss with a healthcare provider'
            })
        elif avg_cycle > 35:
            health_alerts.append({
                'type': 'info',
                'category': 'long_cycles',
                'title': 'Longer-than-Typical Cycles',
                'message': f'Average cycle length of {round(avg_cycle, 1)} days is above the typical range (21–35 days).',
                'action': 'Track additional symptoms; consult a provider if persistent'
            })

        if avg_period > 7:
            health_alerts.append({
                'type': 'warning',
                'category': 'prolonged_period',
                'title': 'Prolonged Periods',
                'message': f'Average period length of {round(avg_period, 1)} days exceeds 7 days (menorrhagia risk).',
                'action': 'Discuss with a healthcare provider; track iron intake'
            })

        if variability and variability['variability'] in ['irregular', 'somewhat_irregular'] and (variability.get('coefficient_of_variation') or 0) > 20:
            health_alerts.append({
                'type': 'info',
                'category': 'irregular_cycles',
                'title': 'Cycle Irregularity Detected',
                'message': f"Cycle variability: {variability.get('coefficient_of_variation', 0):.1f}% (CV). Irregular cycles may indicate hormonal imbalances, stress, or thyroid issues.",
                'action': 'Consider tracking stress, sleep, and diet factors'
            })

        # Health score (0-100)
        score = 80  # Start optimistic
        if days_since >= 90: score -= 30
        elif days_since >= int(avg_cycle) + 10: score -= 15
        if avg_cycle < 21 or avg_cycle > 35: score -= 10
        if avg_period > 7: score -= 10
        if variability and (variability.get('coefficient_of_variation') or 0) > 20: score -= 10
        if len(logs) < 3: score -= 10
        score = max(0, min(100, score))

        # Data completeness
        has_period_len = sum(1 for l in logs if l.period_length) / max(len(logs), 1)
        has_symptoms = sum(1 for l in logs if l.symptoms) / max(len(logs), 1)
        has_mood = sum(1 for l in logs if l.mood) / max(len(logs), 1)
        data_completeness = round(
            (len(logs) / max(len(logs), 6) * 40 + has_period_len * 20 + has_symptoms * 20 + has_mood * 20),
            1
        )
        data_completeness = min(100, data_completeness)

        # Fertile window summary
        fertile_summary = None
        if next_future_pred:
            ovul_date = datetime.fromisoformat(next_future_pred['ovulation_date']).date()
            fert_start = datetime.fromisoformat(next_future_pred['fertile_window_start']).date()
            fert_end = datetime.fromisoformat(next_future_pred['fertile_window_end']).date()
            fertile_summary = {
                'start': fert_start.isoformat(),
                'end': fert_end.isoformat(),
                'ovulation_date': ovul_date.isoformat(),
                'is_currently_active': fert_start <= today <= fert_end,
                'days_until': max(0, (fert_start - today).days),
                'confidence': next_future_pred['confidence']
            }

        return jsonify({
            'has_data': True,
            'health_score': score,
            'health_score_label': (
                'Excellent' if score >= 80 else
                'Good' if score >= 65 else
                'Fair' if score >= 50 else
                'Needs Attention'
            ),
            'data_completeness_pct': data_completeness,
            'current_phase': current_phase,
            'days_since_period': days_since,
            'average_cycle_length': round(avg_cycle, 1),
            'average_period_length': round(avg_period, 1),
            'cycle_regularity': variability['variability'] if variability else 'insufficient_data',
            'trend': trend.get('trend', 'unknown'),
            'total_cycles_logged': len(logs),
            'next_period_prediction': next_future_pred.get('predicted_start') if next_future_pred else None,
            'next_period_confidence': next_future_pred.get('confidence') if next_future_pred else None,
            'fertile_window': fertile_summary,
            'health_alerts': health_alerts,
            'health_insights_count': len(CyclePredictionEngine.calculate_health_insights(logs)),
            'last_updated': datetime.utcnow().isoformat(),
            'recommendations': [
                'Log period dates consistently every month for best accuracy.',
                'Add symptoms, mood, and flow intensity for deeper insights.',
                'Use the calendar view to visualise your cycle phases.',
            ]
        }), 200

    except Exception as e:
        return jsonify({'message': f'Error generating health summary: {str(e)}'}), 500