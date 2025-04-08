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
        
        # Create new cycle log
        new_log = CycleLog(
            user_id=current_user_id,
            start_date=start_date,
            end_date=end_date,
            cycle_length=data.get('cycle_length'),
            period_length=data.get('period_length'),
            symptoms=data.get('symptoms'),
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
            log.symptoms = data['symptoms']
        
        if 'notes' in data:
            log.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cycle log updated successfully'
        }), 200
        
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
    
    # Get all cycle logs for the user
    logs = CycleLog.query.filter_by(user_id=current_user_id).order_by(CycleLog.start_date).all()
    
    if not logs:
        return jsonify({
            'message': 'No cycle data available',
            'average_cycle_length': None,
            'average_period_length': None,
            'total_logs': 0
        }), 200
    
    # Calculate statistics
    cycle_lengths = [log.cycle_length for log in logs if log.cycle_length]
    period_lengths = [log.period_length for log in logs if log.period_length]
    
    avg_cycle_length = sum(cycle_lengths) / len(cycle_lengths) if cycle_lengths else None
    avg_period_length = sum(period_lengths) / len(period_lengths) if period_lengths else None
    
    # Get the most recent log
    latest_log = logs[-1]
    
    # Predict next period if possible
    next_period_prediction = None
    if latest_log and avg_cycle_length:
        import datetime as dt
        next_period_prediction = latest_log.start_date + dt.timedelta(days=int(avg_cycle_length))
    
    return jsonify({
        'average_cycle_length': avg_cycle_length,
        'average_period_length': avg_period_length,
        'total_logs': len(logs),
        'next_period_prediction': next_period_prediction.isoformat() if next_period_prediction else None,
        'latest_period_start': latest_log.start_date.isoformat() if latest_log else None
    }), 200
