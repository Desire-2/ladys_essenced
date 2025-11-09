from app.models import CycleLog
from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import statistics
from collections import defaultdict

cycle_logs_bp = Blueprint('cycle_logs', __name__)

# ============================================================================
# INTELLIGENT PREDICTION ALGORITHMS
# ============================================================================

class CyclePredictionEngine:
    """
    Advanced cycle prediction engine using multiple algorithms:
    1. Weighted Moving Average - gives more weight to recent cycles
    2. Exponential Smoothing - adapts to changing patterns
    3. Statistical Analysis - identifies irregularities and patterns
    4. Machine Learning-like approach - learns from historical data
    """
    
    @staticmethod
    def calculate_weighted_average(values, weights=None):
        """Calculate weighted average giving more importance to recent data"""
        if not values:
            return None
        
        if weights is None:
            # Create exponential weights: most recent gets highest weight
            weights = [2 ** i for i in range(len(values))]
        
        if len(values) != len(weights):
            weights = weights[:len(values)]
        
        return sum(v * w for v, w in zip(values, weights)) / sum(weights)
    
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
    def predict_next_cycles(logs, num_predictions=3):
        """
        Predict next N cycles using advanced algorithms
        Returns list of predictions with confidence levels
        """
        if not logs:
            return []
        
        # Sort logs by date
        sorted_logs = sorted(logs, key=lambda x: x.start_date)
        
        # Extract cycle lengths
        cycle_lengths = []
        period_lengths = []
        
        for i in range(len(sorted_logs) - 1):
            days_between = (sorted_logs[i + 1].start_date - sorted_logs[i].start_date).days
            if days_between > 0:
                cycle_lengths.append(days_between)
            
            if sorted_logs[i].period_length:
                period_lengths.append(sorted_logs[i].period_length)
        
        # Also include stored cycle lengths
        for log in sorted_logs:
            if log.cycle_length and log.cycle_length not in cycle_lengths:
                cycle_lengths.append(log.cycle_length)
            if log.period_length and log.period_length not in period_lengths:
                period_lengths.append(log.period_length)
        
        if not cycle_lengths:
            # Use default 28-day cycle
            cycle_lengths = [28]
        
        if not period_lengths:
            period_lengths = [5]  # Default period length
        
        # Calculate predictions using multiple methods
        simple_avg = statistics.mean(cycle_lengths)
        weighted_avg = CyclePredictionEngine.calculate_weighted_average(
            cycle_lengths[-6:] if len(cycle_lengths) > 6 else cycle_lengths
        )
        smoothed_prediction = CyclePredictionEngine.exponential_smoothing(cycle_lengths)
        
        # Use weighted average as primary prediction
        predicted_cycle_length = weighted_avg if weighted_avg else simple_avg
        predicted_period_length = statistics.mean(period_lengths)
        
        # Calculate variability for confidence
        variability_info = CyclePredictionEngine.calculate_cycle_variability(cycle_lengths)
        
        # Determine confidence based on data quality and regularity
        data_points = len(cycle_lengths)
        if data_points >= 6 and variability_info['variability'] in ['very_regular', 'regular']:
            confidence = 'high'
        elif data_points >= 3 and variability_info['variability'] != 'irregular':
            confidence = 'medium'
        else:
            confidence = 'low'
        
        # Generate predictions
        predictions = []
        last_period_start = sorted_logs[-1].start_date
        
        for i in range(num_predictions):
            next_period_start = last_period_start + timedelta(days=int(predicted_cycle_length * (i + 1)))
            next_period_end = next_period_start + timedelta(days=int(predicted_period_length))
            
            # Calculate ovulation (typically 14 days before next period)
            ovulation_date = next_period_start + timedelta(days=int(predicted_cycle_length) - 14)
            fertile_window_start = ovulation_date - timedelta(days=5)
            fertile_window_end = ovulation_date + timedelta(days=1)
            
            predictions.append({
                'cycle_number': i + 1,
                'predicted_start': next_period_start.isoformat(),
                'predicted_end': next_period_end.isoformat(),
                'ovulation_date': ovulation_date.isoformat(),
                'fertile_window_start': fertile_window_start.isoformat(),
                'fertile_window_end': fertile_window_end.isoformat(),
                'confidence': confidence,
                'predicted_cycle_length': round(predicted_cycle_length, 1),
                'predicted_period_length': round(predicted_period_length, 1)
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
        
        # Data quality insight
        if len(logs) < 3:
            insights.append({
                'type': 'info',
                'category': 'data_quality',
                'message': 'Log more cycles for more accurate predictions and insights.',
                'detail': f"Current logs: {len(logs)}, recommended: 6+"
            })
        
        return insights

@cycle_logs_bp.route('/', methods=['GET'])
@jwt_required()
def get_cycle_logs():
    current_user_id = get_jwt_identity()
    
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
            'symptoms': log.symptoms,
            'notes': log.notes,
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
    current_user_id = get_jwt_identity()
    
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
        'symptoms': log.symptoms,
        'notes': log.notes,
        'created_at': log.created_at.isoformat(),
        'updated_at': log.updated_at.isoformat()
    }
    
    return jsonify(result), 200

@cycle_logs_bp.route('/', methods=['POST'])
@jwt_required()
def create_cycle_log():
    current_user_id = get_jwt_identity()
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
    if 'start_date' not in data:
        return jsonify({'message': 'Start date is required'}), 400
    
    try:
        # Parse dates
        start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        end_date = None
        if 'end_date' in data and data['end_date']:
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        
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
        if isinstance(symptoms_raw, list):
            symptoms_str = ','.join(symptoms_raw)
        else:
            symptoms_str = symptoms_raw
        
        # Create new cycle log
        new_log = CycleLog(
            user_id=target_user_id,
            start_date=start_date,
            end_date=end_date,
            cycle_length=cycle_length,
            period_length=period_length,
            flow_intensity=data.get('flow_intensity', 'medium'),
            symptoms=symptoms_str,
            notes=data.get('notes')
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
                message=message,
                notification_type='cycle'
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
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Find the specific cycle log
    log = CycleLog.query.filter_by(id=log_id, user_id=current_user_id).first()
    
    if not log:
        return jsonify({'message': 'Cycle log not found'}), 404
    
    try:
        # Update fields if provided
        if 'start_date' in data:
            log.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        
        if 'end_date' in data:
            if data['end_date']:
                log.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            else:
                log.end_date = None
        
        if 'cycle_length' in data:
            log.cycle_length = data['cycle_length']
        
        if 'period_length' in data:
            log.period_length = data['period_length']
        
        if 'symptoms' in data:
            # Accept symptoms as list or string
            symptoms_raw = data['symptoms']
            if isinstance(symptoms_raw, list):
                log.symptoms = ','.join(symptoms_raw)
            else:
                log.symptoms = symptoms_raw
        
        if 'notes' in data:
            log.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cycle log updated successfully'
        }, 200)
        
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating cycle log: {str(e)}'}), 500

@cycle_logs_bp.route('/<int:log_id>', methods=['DELETE'])
@jwt_required()
def delete_cycle_log(log_id):
    current_user_id = get_jwt_identity()
    
    # Find the specific cycle log
    log = CycleLog.query.filter_by(id=log_id, user_id=current_user_id).first()
    
    if not log:
        return jsonify({'message': 'Cycle log not found'}), 404
    
    try:
        db.session.delete(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Cycle log deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting cycle log: {str(e)}'}), 500

@cycle_logs_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_cycle_stats():
    current_user_id = get_jwt_identity()
    
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
    
    # Calculate cycle lengths from consecutive logs
    cycle_lengths = []
    period_lengths = []
    
    for i in range(len(logs) - 1):
        days_between = (logs[i + 1].start_date - logs[i].start_date).days
        if days_between > 0:
            cycle_lengths.append(days_between)
    
    # Also include stored cycle lengths
    for log in logs:
        if log.cycle_length:
            cycle_lengths.append(log.cycle_length)
        if log.period_length:
            period_lengths.append(log.period_length)
    
    # Remove duplicates and sort
    cycle_lengths = sorted(list(set(cycle_lengths)))
    period_lengths = sorted(list(set(period_lengths)))
    
    print(f"📈 Cycle lengths: {cycle_lengths}")
    print(f"📈 Period lengths: {period_lengths}")
    
    # Calculate advanced statistics
    avg_cycle_length = statistics.mean(cycle_lengths) if cycle_lengths else None
    avg_period_length = statistics.mean(period_lengths) if period_lengths else None
    
    # Calculate weighted average (more weight on recent cycles)
    weighted_cycle_avg = CyclePredictionEngine.calculate_weighted_average(
        cycle_lengths[-6:] if len(cycle_lengths) > 6 else cycle_lengths
    ) if cycle_lengths else None
    
    # Calculate cycle variability
    variability_info = CyclePredictionEngine.calculate_cycle_variability(cycle_lengths) if len(cycle_lengths) >= 2 else None
    
    # Generate intelligent predictions
    predictions = CyclePredictionEngine.predict_next_cycles(logs, num_predictions=3)
    
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
        'predictions': predictions,
        'variability': variability_info,
        'symptom_analysis': symptom_analysis,
        'health_insights': health_insights,
        'recommendation': 'Log at least 6 cycles for highly accurate predictions' if len(logs) < 6 else 'Keep logging for continued accuracy'
    }
    
    print(f"✅ Returning enhanced stats with {len(predictions)} predictions")
    return jsonify(stats), 200

@cycle_logs_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_calendar_data():
    current_user_id = get_jwt_identity()
    
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
    
    # Calculate cycle lengths from consecutive logs
    cycle_lengths = []
    for i in range(len(logs) - 1):
        days_between = (logs[i + 1].start_date - logs[i].start_date).days
        if days_between > 0:
            cycle_lengths.append(days_between)
    
    # Also include stored cycle lengths
    for log in logs:
        if log.cycle_length:
            cycle_lengths.append(log.cycle_length)
    
    # Calculate weighted average for better predictions
    avg_cycle_length = CyclePredictionEngine.calculate_weighted_average(
        cycle_lengths[-6:] if len(cycle_lengths) > 6 else cycle_lengths
    ) if cycle_lengths else 28
    
    # Get predictions using the intelligent engine
    predictions = CyclePredictionEngine.predict_next_cycles(logs, num_predictions=6)
    
    print(f"📊 Found {len(logs)} logs, weighted average cycle: {avg_cycle_length:.1f}")
    
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
    
    # Calculate cycle variability
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
    current_user_id = get_jwt_identity()
    
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
    
    # Calculate cycle characteristics
    cycle_lengths = []
    for i in range(len(logs) - 1):
        days_between = (logs[i + 1].start_date - logs[i].start_date).days
        if days_between > 0:
            cycle_lengths.append(days_between)
    
    for log in logs:
        if log.cycle_length:
            cycle_lengths.append(log.cycle_length)
    
    variability = CyclePredictionEngine.calculate_cycle_variability(cycle_lengths) if len(cycle_lengths) >= 2 else None
    
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
    current_user_id = get_jwt_identity()
    
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