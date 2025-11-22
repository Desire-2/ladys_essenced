"""
Period Logs Management Routes
Enhanced tracking for detailed menstrual health monitoring
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import PeriodLog, CycleLog, User
from app import db
from datetime import datetime, timedelta, date
import statistics
from collections import defaultdict
import json

period_logs_bp = Blueprint('period_logs', __name__)


class PeriodAnalyticsEngine:
    """Advanced analytics for period tracking"""
    
    @staticmethod
    def calculate_period_patterns(period_logs):
        """Analyze patterns across multiple periods"""
        if not period_logs:
            return {}
        
        patterns = {
            'average_duration': None,
            'average_pain_level': None,
            'most_common_symptoms': [],
            'flow_patterns': {},
            'pain_trends': [],
            'product_usage_trends': {},
            'effectiveness_ratings': {}
        }
        
        durations = []
        pain_levels = []
        all_symptoms = []
        flow_intensities = defaultdict(int)
        products_usage = defaultdict(list)
        
        for log in period_logs:
            # Duration analysis
            if log.duration_days:
                durations.append(log.duration_days)
            
            # Pain analysis
            if log.pain_level:
                pain_levels.append(log.pain_level)
            
            # Symptom analysis
            if log.emotional_symptoms:
                all_symptoms.extend(log.emotional_symptoms)
            
            # Flow analysis
            if log.daily_flow:
                for day in log.daily_flow:
                    intensity = day.get('intensity', 'medium')
                    flow_intensities[intensity] += 1
            
            # Product usage analysis
            if log.products_used:
                for product in log.products_used:
                    product_type = product.get('type', 'unknown')
                    count = product.get('count', 0)
                    products_usage[product_type].append(count)
        
        # Calculate averages
        if durations:
            patterns['average_duration'] = round(statistics.mean(durations), 1)
        
        if pain_levels:
            patterns['average_pain_level'] = round(statistics.mean(pain_levels), 1)
        
        # Most common symptoms
        symptom_counts = defaultdict(int)
        for symptom in all_symptoms:
            symptom_counts[symptom] += 1
        patterns['most_common_symptoms'] = sorted(
            symptom_counts.items(), key=lambda x: x[1], reverse=True
        )[:5]
        
        # Flow patterns
        patterns['flow_patterns'] = dict(flow_intensities)
        
        # Product usage averages
        for product_type, counts in products_usage.items():
            patterns['product_usage_trends'][product_type] = {
                'average_per_period': round(statistics.mean(counts), 1),
                'range': f"{min(counts)}-{max(counts)}"
            }
        
        return patterns
    
    @staticmethod
    def generate_period_insights(period_logs, cycle_logs=None):
        """Generate personalized insights based on period data"""
        insights = []
        
        if not period_logs:
            return [{
                'type': 'info',
                'title': 'Start Tracking Your Periods',
                'message': 'Begin logging your periods for personalized insights and better health management.',
                'priority': 'high'
            }]
        
        patterns = PeriodAnalyticsEngine.calculate_period_patterns(period_logs)
        latest_period = period_logs[0]  # Assuming sorted by date desc
        
        # Duration insights
        if patterns.get('average_duration'):
            avg_duration = patterns['average_duration']
            if avg_duration > 7:
                insights.append({
                    'type': 'warning',
                    'title': 'Long Period Duration',
                    'message': f'Your average period lasts {avg_duration} days. Consider discussing with a healthcare provider if periods consistently exceed 7 days.',
                    'priority': 'medium'
                })
            elif avg_duration < 3:
                insights.append({
                    'type': 'info',
                    'title': 'Short Period Duration',
                    'message': f'Your average period lasts {avg_duration} days. This may be normal for you, but tracking helps identify changes.',
                    'priority': 'low'
                })
        
        # Pain level insights
        if patterns.get('average_pain_level'):
            avg_pain = patterns['average_pain_level']
            if avg_pain >= 7:
                insights.append({
                    'type': 'warning',
                    'title': 'High Pain Levels',
                    'message': f'Your average period pain is {avg_pain}/10. Consider pain management strategies and consult a healthcare provider.',
                    'priority': 'high',
                    'recommendations': [
                        'Try heat therapy (heating pad or warm bath)',
                        'Consider anti-inflammatory medications',
                        'Practice relaxation techniques',
                        'Consult with a healthcare provider about treatment options'
                    ]
                })
            elif avg_pain >= 4:
                insights.append({
                    'type': 'info',
                    'title': 'Moderate Pain Management',
                    'message': f'Your average pain level is {avg_pain}/10. Here are some management tips.',
                    'priority': 'medium',
                    'recommendations': [
                        'Regular exercise can help reduce period pain',
                        'Try herbal teas like chamomile or ginger',
                        'Maintain a healthy diet rich in omega-3s',
                        'Practice stress management techniques'
                    ]
                })
        
        # Flow insights
        flow_patterns = patterns.get('flow_patterns', {})
        if 'heavy' in flow_patterns and flow_patterns['heavy'] > 3:
            insights.append({
                'type': 'info',
                'title': 'Heavy Flow Management',
                'message': 'You frequently experience heavy flow days. Here are some management tips.',
                'priority': 'medium',
                'recommendations': [
                    'Stay hydrated and maintain iron levels',
                    'Consider higher-absorbency period products',
                    'Track flow changes for healthcare discussions',
                    'Eat iron-rich foods like spinach and lean meats'
                ]
            })
        
        # Product usage insights
        product_trends = patterns.get('product_usage_trends', {})
        for product, data in product_trends.items():
            if data['average_per_period'] > 20:  # High usage threshold
                insights.append({
                    'type': 'info',
                    'title': f'High {product.title()} Usage',
                    'message': f'You use an average of {data["average_per_period"]} {product}s per period. Consider if this meets your comfort needs.',
                    'priority': 'low'
                })
        
        # Symptom management insights
        common_symptoms = patterns.get('most_common_symptoms', [])
        if common_symptoms:
            top_symptom = common_symptoms[0][0]
            symptom_tips = {
                'anxiety': 'Try deep breathing exercises, meditation, or gentle yoga',
                'mood_swings': 'Maintain regular sleep schedule and consider magnesium supplements',
                'depression': 'Engage in light exercise and consider talking to someone you trust',
                'irritability': 'Practice stress management and ensure adequate rest'
            }
            
            if top_symptom in symptom_tips:
                insights.append({
                    'type': 'info',
                    'title': f'Managing {top_symptom.title().replace("_", " ")}',
                    'message': f'You commonly experience {top_symptom.replace("_", " ")}. {symptom_tips[top_symptom]}',
                    'priority': 'medium'
                })
        
        return insights


# ============================================================================
# PERIOD LOGS CRUD OPERATIONS
# ============================================================================

@period_logs_bp.route('/', methods=['POST'])
@jwt_required()
def create_period_log():
    """Create a new detailed period log"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('start_date'):
            return jsonify({'message': 'Start date is required'}), 400
        
        # Parse dates
        try:
            start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'message': 'Invalid start date format'}), 400
        
        end_date = None
        if data.get('end_date'):
            try:
                end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'message': 'Invalid end date format'}), 400
        
        # Create new period log
        period_log = PeriodLog(
            user_id=current_user_id,
            cycle_log_id=data.get('cycle_log_id'),
            start_date=start_date,
            end_date=end_date,
            daily_flow=data.get('daily_flow'),
            products_used=data.get('products_used'),
            total_products_count=data.get('total_products_count'),
            pain_level=data.get('pain_level'),
            pain_location=data.get('pain_location'),
            pain_management=data.get('pain_management'),
            breast_tenderness=data.get('breast_tenderness'),
            bloating_level=data.get('bloating_level'),
            headache_severity=data.get('headache_severity'),
            nausea_level=data.get('nausea_level'),
            fatigue_level=data.get('fatigue_level'),
            mood_changes=data.get('mood_changes'),
            emotional_symptoms=data.get('emotional_symptoms'),
            activity_limitations=data.get('activity_limitations'),
            missed_activities=data.get('missed_activities'),
            self_care_activities=data.get('self_care_activities'),
            diet_changes=data.get('diet_changes'),
            sleep_impact=data.get('sleep_impact'),
            medication_taken=data.get('medication_taken'),
            supplements_taken=data.get('supplements_taken'),
            stress_factors=data.get('stress_factors'),
            exercise_modifications=data.get('exercise_modifications'),
            overall_severity=data.get('overall_severity'),
            period_satisfaction=data.get('period_satisfaction'),
            notes=data.get('notes'),
            observations=data.get('observations')
        )
        
        db.session.add(period_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Period log created successfully',
            'period_log': period_log.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating period log: {str(e)}'}), 500


@period_logs_bp.route('/', methods=['GET'])
@jwt_required()
def get_period_logs():
    """Get paginated period logs for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        
        # Query period logs
        period_logs = PeriodLog.query.filter_by(user_id=current_user_id)\
            .order_by(PeriodLog.start_date.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'items': [log.to_dict() for log in period_logs.items],
            'total': period_logs.total,
            'pages': period_logs.pages,
            'current_page': period_logs.page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching period logs: {str(e)}'}), 500


@period_logs_bp.route('/<int:log_id>', methods=['GET'])
@jwt_required()
def get_period_log(log_id):
    """Get a specific period log"""
    try:
        current_user_id = get_jwt_identity()
        
        period_log = PeriodLog.query.filter_by(
            id=log_id, 
            user_id=current_user_id
        ).first()
        
        if not period_log:
            return jsonify({'message': 'Period log not found'}), 404
        
        return jsonify(period_log.to_dict()), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching period log: {str(e)}'}), 500


@period_logs_bp.route('/<int:log_id>', methods=['PUT'])
@jwt_required()
def update_period_log(log_id):
    """Update a period log"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        period_log = PeriodLog.query.filter_by(
            id=log_id, 
            user_id=current_user_id
        ).first()
        
        if not period_log:
            return jsonify({'message': 'Period log not found'}), 404
        
        # Update fields
        updatable_fields = [
            'end_date', 'daily_flow', 'products_used', 'total_products_count',
            'pain_level', 'pain_location', 'pain_management', 'breast_tenderness',
            'bloating_level', 'headache_severity', 'nausea_level', 'fatigue_level',
            'mood_changes', 'emotional_symptoms', 'activity_limitations',
            'missed_activities', 'self_care_activities', 'diet_changes',
            'sleep_impact', 'medication_taken', 'supplements_taken',
            'stress_factors', 'exercise_modifications', 'overall_severity',
            'period_satisfaction', 'notes', 'observations'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'end_date' and data[field]:
                    try:
                        setattr(period_log, field, datetime.fromisoformat(data[field].replace('Z', '+00:00')))
                    except ValueError:
                        return jsonify({'message': f'Invalid {field} format'}), 400
                else:
                    setattr(period_log, field, data[field])
        
        period_log.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Period log updated successfully',
            'period_log': period_log.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating period log: {str(e)}'}), 500


@period_logs_bp.route('/<int:log_id>', methods=['DELETE'])
@jwt_required()
def delete_period_log(log_id):
    """Delete a period log"""
    try:
        current_user_id = get_jwt_identity()
        
        period_log = PeriodLog.query.filter_by(
            id=log_id, 
            user_id=current_user_id
        ).first()
        
        if not period_log:
            return jsonify({'message': 'Period log not found'}), 404
        
        db.session.delete(period_log)
        db.session.commit()
        
        return jsonify({'message': 'Period log deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting period log: {str(e)}'}), 500


# ============================================================================
# PERIOD ANALYTICS AND INSIGHTS
# ============================================================================

@period_logs_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_period_analytics():
    """Get comprehensive period analytics and patterns"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get all period logs for analysis
        period_logs = PeriodLog.query.filter_by(user_id=current_user_id)\
            .order_by(PeriodLog.start_date.desc())\
            .all()
        
        # Calculate patterns
        patterns = PeriodAnalyticsEngine.calculate_period_patterns(period_logs)
        
        # Get recent statistics
        recent_logs = period_logs[:6]  # Last 6 periods
        current_period = None
        
        # Check for active period
        for log in period_logs:
            if log.is_active:
                current_period = log
                break
        
        analytics = {
            'total_periods_tracked': len(period_logs),
            'patterns': patterns,
            'current_period': current_period.to_dict() if current_period else None,
            'recent_periods_count': len(recent_logs),
            'tracking_duration_months': None
        }
        
        # Calculate tracking duration
        if period_logs and len(period_logs) > 1:
            first_period = period_logs[-1].start_date
            latest_period = period_logs[0].start_date
            duration = (latest_period - first_period).days / 30.44  # Average days per month
            analytics['tracking_duration_months'] = round(duration, 1)
        
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'message': f'Error generating analytics: {str(e)}'}), 500


@period_logs_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_period_insights():
    """Get personalized period insights and recommendations"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get period logs and related cycle logs
        period_logs = PeriodLog.query.filter_by(user_id=current_user_id)\
            .order_by(PeriodLog.start_date.desc())\
            .limit(12)\
            .all()
        
        cycle_logs = CycleLog.query.filter_by(user_id=current_user_id)\
            .order_by(CycleLog.start_date.desc())\
            .limit(12)\
            .all()
        
        # Generate insights
        insights = PeriodAnalyticsEngine.generate_period_insights(period_logs, cycle_logs)
        
        return jsonify({
            'insights': insights,
            'generated_at': datetime.utcnow().isoformat(),
            'data_points': len(period_logs)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error generating insights: {str(e)}'}), 500


@period_logs_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_period():
    """Get current active period if any"""
    try:
        current_user_id = get_jwt_identity()
        
        current_period = PeriodLog.query.filter_by(user_id=current_user_id)\
            .filter(PeriodLog.end_date.is_(None))\
            .order_by(PeriodLog.start_date.desc())\
            .first()
        
        if current_period:
            return jsonify({
                'has_active_period': True,
                'current_period': current_period.to_dict(),
                'days_active': (datetime.utcnow() - current_period.start_date).days + 1
            }), 200
        else:
            return jsonify({
                'has_active_period': False,
                'current_period': None
            }), 200
            
    except Exception as e:
        return jsonify({'message': f'Error checking current period: {str(e)}'}), 500


@period_logs_bp.route('/end-current', methods=['POST'])
@jwt_required()
def end_current_period():
    """End the current active period"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        current_period = PeriodLog.query.filter_by(user_id=current_user_id)\
            .filter(PeriodLog.end_date.is_(None))\
            .order_by(PeriodLog.start_date.desc())\
            .first()
        
        if not current_period:
            return jsonify({'message': 'No active period found'}), 404
        
        # Set end date
        end_date = datetime.utcnow()
        if data.get('end_date'):
            try:
                end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'message': 'Invalid end date format'}), 400
        
        current_period.end_date = end_date
        
        # Update any final tracking data
        if data.get('final_notes'):
            current_period.observations = data['final_notes']
        if data.get('overall_severity'):
            current_period.overall_severity = data['overall_severity']
        if data.get('period_satisfaction'):
            current_period.period_satisfaction = data['period_satisfaction']
        
        current_period.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Period ended successfully',
            'period_log': current_period.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error ending period: {str(e)}'}), 500


# ============================================================================
# PARENT ACCESS ROUTES
# ============================================================================

@period_logs_bp.route('/parent/<int:child_id>', methods=['GET'])
@jwt_required()
def get_child_period_logs(child_id):
    """Get period logs for a child (parent access)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify parent-child relationship
        from app.models import User, Parent, Adolescent, ParentChild
        
        user = User.query.get(current_user_id)
        if not user or user.user_type != 'parent':
            return jsonify({'message': 'Only parent accounts can access child data'}), 403
        
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        if not parent:
            return jsonify({'message': 'Parent record not found'}), 404
        
        # Verify parent-child relationship
        child = Adolescent.query.get(child_id)
        if not child:
            return jsonify({'message': 'Child not found'}), 404
        
        relation = ParentChild.query.filter_by(
            parent_id=parent.id, 
            adolescent_id=child_id
        ).first()
        if not relation:
            return jsonify({'message': 'Child not found'}), 404
        
        # Check if child allows parent access
        child_user = User.query.get(child.user_id)
        if not child_user.allow_parent_access:
            return jsonify({'message': 'Access denied: Child has disabled parent access'}), 403
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        
        # Query child's period logs
        period_logs = PeriodLog.query.filter_by(user_id=child.user_id)\
            .order_by(PeriodLog.start_date.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'items': [log.to_dict() for log in period_logs.items],
            'total': period_logs.total,
            'pages': period_logs.pages,
            'current_page': period_logs.page,
            'per_page': per_page,
            'child_name': child_user.name
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching child period logs: {str(e)}'}), 500


@period_logs_bp.route('/parent/<int:child_id>/analytics', methods=['GET'])
@jwt_required()
def get_child_period_analytics(child_id):
    """Get period analytics for a child (parent access)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify parent-child relationship (same as above)
        from app.models import User, Parent, Adolescent, ParentChild
        
        user = User.query.get(current_user_id)
        if not user or user.user_type != 'parent':
            return jsonify({'message': 'Only parent accounts can access child data'}), 403
        
        parent = Parent.query.filter_by(user_id=current_user_id).first()
        if not parent:
            return jsonify({'message': 'Parent record not found'}), 404
        
        child = Adolescent.query.get(child_id)
        if not child:
            return jsonify({'message': 'Child not found'}), 404
        
        relation = ParentChild.query.filter_by(
            parent_id=parent.id, 
            adolescent_id=child_id
        ).first()
        if not relation:
            return jsonify({'message': 'Child not found'}), 404
        
        child_user = User.query.get(child.user_id)
        if not child_user.allow_parent_access:
            return jsonify({'message': 'Access denied: Child has disabled parent access'}), 403
        
        # Get period logs for analysis
        period_logs = PeriodLog.query.filter_by(user_id=child.user_id)\
            .order_by(PeriodLog.start_date.desc())\
            .all()
        
        # Calculate patterns
        patterns = PeriodAnalyticsEngine.calculate_period_patterns(period_logs)
        
        # Generate insights
        insights = PeriodAnalyticsEngine.generate_period_insights(period_logs)
        
        return jsonify({
            'child_name': child_user.name,
            'total_periods_tracked': len(period_logs),
            'patterns': patterns,
            'insights': insights,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error generating child analytics: {str(e)}'}), 500