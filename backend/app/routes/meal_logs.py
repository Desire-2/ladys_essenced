from app.models import MealLog
from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

meal_logs_bp = Blueprint('meal_logs', __name__)

@meal_logs_bp.route('/', methods=['GET'])
@jwt_required()
def get_meal_logs():
    current_user_id = get_jwt_identity()
    
    # Get query parameters for pagination and filtering
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    meal_type = request.args.get('meal_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base query
    query = MealLog.query.filter_by(user_id=current_user_id)
    
    # Apply filters if provided
    if meal_type:
        query = query.filter_by(meal_type=meal_type)
    
    if start_date:
        try:
            start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(MealLog.meal_time >= start_date_obj)
        except ValueError:
            return jsonify({'message': 'Invalid start_date format'}), 400
    
    if end_date:
        try:
            end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(MealLog.meal_time <= end_date_obj)
        except ValueError:
            return jsonify({'message': 'Invalid end_date format'}), 400
    
    # Order by meal time descending and paginate
    logs = query.order_by(MealLog.meal_time.desc()).paginate(page=page, per_page=per_page)
    
    # Format the response
    result = {
        'logs': [{
            'id': log.id,
            'meal_type': log.meal_type,
            'meal_time': log.meal_time.isoformat(),
            'date': log.meal_time.isoformat(),  # For backward compatibility
            'description': log.description,
            'details': log.description,  # For backward compatibility
            'calories': log.calories,
            'protein': log.protein,
            'carbs': log.carbs,
            'fat': log.fat,
            'created_at': log.created_at.isoformat()
        } for log in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': page
    }
    
    return jsonify(result), 200

@meal_logs_bp.route('/<int:log_id>', methods=['GET'])
@jwt_required()
def get_meal_log(log_id):
    current_user_id = get_jwt_identity()
    
    # Find the specific meal log
    log = MealLog.query.filter_by(id=log_id, user_id=current_user_id).first()
    
    if not log:
        return jsonify({'message': 'Meal log not found'}), 404
    
    # Format the response
    result = {
        'id': log.id,
        'meal_type': log.meal_type,
        'meal_time': log.meal_time.isoformat(),
        'description': log.description,
        'calories': log.calories,
        'protein': log.protein,
        'carbs': log.carbs,
        'fat': log.fat,
        'created_at': log.created_at.isoformat(),
        'updated_at': log.updated_at.isoformat()
    }
    
    return jsonify(result), 200

@meal_logs_bp.route('/', methods=['POST'])
@jwt_required()
def create_meal_log():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['meal_type', 'meal_time', 'description']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    try:
        # Parse meal time - handle both full datetime and time-only formats
        meal_time_str = data['meal_time']
        
        try:
            # Try parsing as full ISO datetime
            meal_time = datetime.fromisoformat(meal_time_str.replace('Z', '+00:00'))
        except ValueError:
            # If that fails, try parsing as time only (HH:MM or HH:MM:SS)
            try:
                from datetime import datetime as dt
                time_obj = dt.strptime(meal_time_str, '%H:%M:%S').time()
                today = dt.now().date()
                meal_time = dt.combine(today, time_obj)
            except ValueError:
                try:
                    time_obj = dt.strptime(meal_time_str, '%H:%M').time()
                    today = dt.now().date()
                    meal_time = dt.combine(today, time_obj)
                except ValueError:
                    raise ValueError(f"Invalid time format: '{meal_time_str}'. Expected ISO datetime (2025-11-06T10:46:00) or time format (10:46 or 10:46:30)")
        
        # Create new meal log
        new_log = MealLog(
            user_id=current_user_id,
            meal_type=data['meal_type'],
            meal_time=meal_time,
            description=data['description'],
            calories=data.get('calories'),
            protein=data.get('protein'),
            carbs=data.get('carbs'),
            fat=data.get('fat')
        )
        
        db.session.add(new_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Meal log created successfully',
            'id': new_log.id
        }), 201
        
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating meal log: {str(e)}'}), 500

@meal_logs_bp.route('/<int:log_id>', methods=['PUT'])
@jwt_required()
def update_meal_log(log_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Find the specific meal log
    log = MealLog.query.filter_by(id=log_id, user_id=current_user_id).first()
    
    if not log:
        return jsonify({'message': 'Meal log not found'}), 404
    
    try:
        # Update fields if provided
        if 'meal_type' in data:
            log.meal_type = data['meal_type']
        
        if 'meal_time' in data:
            meal_time_str = data['meal_time']
            try:
                # Try parsing as full ISO datetime
                log.meal_time = datetime.fromisoformat(meal_time_str.replace('Z', '+00:00'))
            except ValueError:
                # If that fails, try parsing as time only (HH:MM or HH:MM:SS)
                try:
                    from datetime import datetime as dt
                    time_obj = dt.strptime(meal_time_str, '%H:%M:%S').time()
                    today = dt.now().date()
                    log.meal_time = dt.combine(today, time_obj)
                except ValueError:
                    try:
                        time_obj = dt.strptime(meal_time_str, '%H:%M').time()
                        today = dt.now().date()
                        log.meal_time = dt.combine(today, time_obj)
                    except ValueError:
                        raise ValueError(f"Invalid time format: '{meal_time_str}'. Expected ISO datetime (2025-11-06T10:46:00) or time format (10:46 or 10:46:30)")
        
        if 'description' in data:
            log.description = data['description']
        
        if 'calories' in data:
            log.calories = data['calories']
        
        if 'protein' in data:
            log.protein = data['protein']
        
        if 'carbs' in data:
            log.carbs = data['carbs']
        
        if 'fat' in data:
            log.fat = data['fat']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Meal log updated successfully'
        }), 200
        
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating meal log: {str(e)}'}), 500

@meal_logs_bp.route('/<int:log_id>', methods=['DELETE'])
@jwt_required()
def delete_meal_log(log_id):
    current_user_id = get_jwt_identity()
    
    # Find the specific meal log
    log = MealLog.query.filter_by(id=log_id, user_id=current_user_id).first()
    
    if not log:
        return jsonify({'message': 'Meal log not found'}), 404
    
    try:
        db.session.delete(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Meal log deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting meal log: {str(e)}'}), 500

@meal_logs_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_meal_stats():
    current_user_id = get_jwt_identity()
    
    # Get time range parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base query
    query = MealLog.query.filter_by(user_id=current_user_id)
    
    # Apply date filters if provided
    if start_date:
        try:
            start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(MealLog.meal_time >= start_date_obj)
        except ValueError:
            return jsonify({'message': 'Invalid start_date format'}), 400
    
    if end_date:
        try:
            end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(MealLog.meal_time <= end_date_obj)
        except ValueError:
            return jsonify({'message': 'Invalid end_date format'}), 400
    
    # Get all meal logs within the time range
    logs = query.all()
    
    if not logs:
        return jsonify({
            'message': 'No meal data available',
            'total_logs': 0,
            'meal_types': {},
            'nutrition': {
                'average_calories': None,
                'average_protein': None,
                'average_carbs': None,
                'average_fat': None
            }
        }), 200
    
    # Calculate statistics
    meal_types = {}
    calories = []
    proteins = []
    carbs = []
    fats = []
    
    for log in logs:
        # Count meal types
        if log.meal_type in meal_types:
            meal_types[log.meal_type] += 1
        else:
            meal_types[log.meal_type] = 1
        
        # Collect nutrition data
        if log.calories is not None:
            calories.append(log.calories)
        if log.protein is not None:
            proteins.append(log.protein)
        if log.carbs is not None:
            carbs.append(log.carbs)
        if log.fat is not None:
            fats.append(log.fat)
    
    # Calculate averages
    avg_calories = sum(calories) / len(calories) if calories else None
    avg_protein = sum(proteins) / len(proteins) if proteins else None
    avg_carbs = sum(carbs) / len(carbs) if carbs else None
    avg_fat = sum(fats) / len(fats) if fats else None
    
    return jsonify({
        'total_logs': len(logs),
        'meal_types': meal_types,
        'nutrition': {
            'average_calories': avg_calories,
            'average_protein': avg_protein,
            'average_carbs': avg_carbs,
            'average_fat': avg_fat
        }
    }), 200
