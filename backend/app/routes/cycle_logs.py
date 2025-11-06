from app.models import CycleLog
from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

cycle_logs_bp = Blueprint('cycle_logs', __name__)

@cycle_logs_bp.route('/', methods=['GET'])
@jwt_required()
def get_cycle_logs():
    current_user_id = get_jwt_identity()
    
    # Get query parameters for pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Query cycle logs for the current user, ordered by start date descending
    logs = CycleLog.query.filter_by(user_id=current_user_id)\
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
    
    # Validate required fields
    if 'start_date' not in data:
        return jsonify({'message': 'Start date is required'}), 400
    
    try:
        # Parse dates
        start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        end_date = None
        if 'end_date' in data and data['end_date']:
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        
        # Prepare symptoms: accept list or string
        symptoms_raw = data.get('symptoms')
        if isinstance(symptoms_raw, list):
            symptoms_str = ','.join(symptoms_raw)
        else:
            symptoms_str = symptoms_raw
        # Create new cycle log
        new_log = CycleLog(
            user_id=current_user_id,
            start_date=start_date,
            end_date=end_date,
            cycle_length=data.get('cycle_length'),
            period_length=data.get('period_length'),
            symptoms=symptoms_str,
            notes=data.get('notes')
        )
        
        db.session.add(new_log)
        db.session.commit()
        
        # Create notification for next cycle prediction if applicable
        if new_log.cycle_length:
            from app.models import Notification
            import datetime as dt
            
            # Calculate predicted next cycle start date
            next_cycle_date = start_date + dt.timedelta(days=new_log.cycle_length)
            
            # Create notification
            notification = Notification(
                user_id=current_user_id,
                message=f"Your next period is predicted to start on {next_cycle_date.strftime('%Y-%m-%d')}",
                notification_type='cycle'
            )
            
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({
            'message': 'Cycle log created successfully',
            'id': new_log.id
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
    print(f"Cycle stats called for user: {current_user_id}")
    
    # Get all cycle logs for the user
    logs = CycleLog.query.filter_by(user_id=current_user_id).order_by(CycleLog.start_date).all()
    print(f"Found {len(logs)} cycle logs for user {current_user_id}")
    
    if not logs:
        print("No cycle logs found, returning empty stats")
        return jsonify({
            'message': 'No cycle data available',
            'average_cycle_length': None,
            'average_period_length': None,
            'total_logs': 0,
            'next_period_prediction': None,
            'latest_period_start': None
        }), 200
    
    # Calculate statistics
    cycle_lengths = [log.cycle_length for log in logs if log.cycle_length]
    period_lengths = [log.period_length for log in logs if log.period_length]
    
    print(f"Cycle lengths: {cycle_lengths}")
    print(f"Period lengths: {period_lengths}")
    
    avg_cycle_length = sum(cycle_lengths) / len(cycle_lengths) if cycle_lengths else None
    avg_period_length = sum(period_lengths) / len(period_lengths) if period_lengths else None
    
    # Get the most recent log
    latest_log = logs[-1]
    print(f"Latest log: {latest_log.start_date} - {latest_log.end_date}")
    
    # Predict next period if possible
    next_period_prediction = None
    if latest_log and avg_cycle_length:
        import datetime as dt
        next_period_prediction = latest_log.start_date + dt.timedelta(days=int(avg_cycle_length))
        print(f"Next period prediction: {next_period_prediction}")
    
    stats = {
        'average_cycle_length': avg_cycle_length,
        'average_period_length': avg_period_length,
        'total_logs': len(logs),
        'next_period_prediction': next_period_prediction.isoformat() if next_period_prediction else None,
        'latest_period_start': latest_log.start_date.isoformat() if latest_log else None
    }
    
    print(f"Returning stats: {stats}")
    return jsonify(stats), 200

@cycle_logs_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_calendar_data():
    current_user_id = get_jwt_identity()
    
    # Get query parameters for month/year
    year = request.args.get('year', datetime.now().year, type=int)
    month = request.args.get('month', datetime.now().month, type=int)
    
    print(f"Calendar data requested for user {current_user_id}, {year}-{month:02d}")
    
    # Get start and end dates for the month
    from calendar import monthrange
    import datetime as dt
    
    start_date = dt.date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = dt.date(year, month, last_day)
    
    # Extend to show full weeks (previous and next month days)
    start_calendar = start_date - dt.timedelta(days=start_date.weekday() + 1)  # Start from Sunday
    end_calendar = end_date + dt.timedelta(days=(6 - end_date.weekday()))
    
    print(f"Calendar range: {start_calendar} to {end_calendar}")
    
    # Get all cycle logs for the user
    logs = CycleLog.query.filter_by(user_id=current_user_id).all()
    
    # Calculate average cycle length for predictions
    cycle_lengths = [log.cycle_length for log in logs if log.cycle_length]
    avg_cycle_length = sum(cycle_lengths) / len(cycle_lengths) if cycle_lengths else 28
    
    print(f"Found {len(logs)} logs, average cycle: {avg_cycle_length}")
    
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
            'is_fertility_day': False,
            'flow_intensity': None,
            'symptoms': [],
            'notes': None
        }
        
        # Check if this date falls within any logged cycles
        for log in logs:
            log_start = log.start_date.date()
            log_end = log.end_date.date() if log.end_date else log_start
            
            # Check if it's a period day
            if log_start <= current_date <= log_end:
                day_data['is_period_day'] = True
                if current_date == log_start:
                    day_data['is_period_start'] = True
                if current_date == log_end:
                    day_data['is_period_end'] = True
                day_data['flow_intensity'] = 'medium'  # Default flow intensity
                if log.symptoms:
                    # Parse symptoms string into array
                    if isinstance(log.symptoms, str):
                        day_data['symptoms'] = [s.strip() for s in log.symptoms.split(',') if s.strip()]
                    else:
                        day_data['symptoms'] = log.symptoms
                if log.notes:
                    day_data['notes'] = log.notes
                break
            
            # Calculate ovulation and fertile window
            if log.cycle_length:
                ovulation_date = log_start + dt.timedelta(days=log.cycle_length // 2)
                fertile_start = ovulation_date - dt.timedelta(days=2)
                fertile_end = ovulation_date + dt.timedelta(days=2)
                
                if current_date == ovulation_date:
                    day_data['is_ovulation_day'] = True
                elif fertile_start <= current_date <= fertile_end:
                    day_data['is_fertility_day'] = True
        
        # Predict future periods based on the last cycle
        if logs and not day_data['is_period_day']:
            latest_log = max(logs, key=lambda x: x.start_date)
            next_period_date = latest_log.start_date.date() + dt.timedelta(days=int(avg_cycle_length))
            
            # Check for predicted future periods (next 3 cycles)
            for i in range(3):
                predicted_start = next_period_date + dt.timedelta(days=int(avg_cycle_length) * i)
                predicted_end = predicted_start + dt.timedelta(days=5)  # Assume 5-day period
                
                if predicted_start <= current_date <= predicted_end:
                    day_data['is_period_day'] = True
                    day_data['predicted'] = True
                    break
                
                # Predicted ovulation and fertile window
                predicted_ovulation = predicted_start + dt.timedelta(days=int(avg_cycle_length) // 2)
                predicted_fertile_start = predicted_ovulation - dt.timedelta(days=2)
                predicted_fertile_end = predicted_ovulation + dt.timedelta(days=2)
                
                if current_date == predicted_ovulation:
                    day_data['is_ovulation_day'] = True
                    day_data['predicted'] = True
                    break
                elif predicted_fertile_start <= current_date <= predicted_fertile_end:
                    day_data['is_fertility_day'] = True
                    day_data['predicted'] = True
                    break
        
        calendar_days.append(day_data)
        current_date += dt.timedelta(days=1)
    
    result = {
        'year': year,
        'month': month,
        'month_name': dt.date(year, month, 1).strftime('%B'),
        'days': calendar_days,
        'stats': {
            'total_logs': len(logs),
            'average_cycle_length': avg_cycle_length,
            'next_predicted_period': logs and (max(logs, key=lambda x: x.start_date).start_date.date() + dt.timedelta(days=int(avg_cycle_length))).isoformat()
        }
    }
    
    print(f"Returning calendar data with {len(calendar_days)} days")
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