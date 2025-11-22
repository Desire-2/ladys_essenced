from app.models import Parent, Adolescent, ParentChild, User
from app import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

parents_bp = Blueprint('parents', __name__)

@parents_bp.route('/children', methods=['GET'])
@jwt_required()
def get_children():
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = Parent.query.filter_by(user_id=current_user_id).first()
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Get all children for this parent
    parent_child_relations = ParentChild.query.filter_by(parent_id=parent.id).all()
    
    # Format the response
    children = []
    for relation in parent_child_relations:
        adolescent = Adolescent.query.get(relation.adolescent_id)
        if adolescent:
            adolescent_user = User.query.get(adolescent.user_id)
            if adolescent_user:
                children.append({
                    'id': adolescent.id,
                    'user_id': adolescent_user.id,
                    'name': adolescent_user.name,
                    'phone_number': adolescent_user.phone_number,
                    'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
                    'relationship': relation.relationship_type,
                    'parent_access_enabled': adolescent_user.allow_parent_access
                })
    
    return jsonify(children), 200

@parents_bp.route('/children/<int:adolescent_id>', methods=['GET'])
@jwt_required()
def get_child(adolescent_id):
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = Parent.query.filter_by(user_id=current_user_id).first()
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    # Get adolescent details
    adolescent = Adolescent.query.get(adolescent_id)
    adolescent_user = User.query.get(adolescent.user_id)
    
    # Check if child allows parent access
    if not adolescent_user.allow_parent_access:
        return jsonify({'message': 'Access denied: Child has disabled parent access to their account'}), 403
    
    # Format the response
    child_data = {
        'id': adolescent.id,
        'user_id': adolescent_user.id,
        'name': adolescent_user.name,
        'phone_number': adolescent_user.phone_number,
        'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
        'relationship': relation.relationship_type
    }
    
    return jsonify(child_data), 200

@parents_bp.route('/children', methods=['POST'])
@parents_bp.route('/children/add', methods=['POST'])
@jwt_required()
def add_child():
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = Parent.query.filter_by(user_id=current_user_id).first()
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'password', 'relationship_type']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Check if phone number already exists (if provided)
    if data.get('phone_number'):
        if User.query.filter_by(phone_number=data['phone_number']).first():
            return jsonify({'message': 'Phone number already registered'}), 409
    
    # Validate relationship type
    valid_relationships = ['mother', 'father', 'guardian']
    if data['relationship_type'] not in valid_relationships:
        return jsonify({'message': 'Invalid relationship type'}), 400
    
    try:
        # Create user account for the child
        from app import bcrypt
        password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        # Generate email from name if not provided (make it unique)
        email = data.get('email')
        if not email:
            # Create unique email from name and timestamp
            import time
            email = f"{data['name'].lower().replace(' ', '')}{int(time.time())}@ladysessence.local"
        
        child_user = User(
            name=data['name'],
            phone_number=data.get('phone_number'),  # Optional phone number
            email=email,  # Email is required or auto-generated
            password_hash=password_hash,
            user_type='adolescent'
        )
        db.session.add(child_user)
        db.session.flush()  # Get the user_id
        
        # Create adolescent record
        adolescent = Adolescent(
            user_id=child_user.id,
            date_of_birth=datetime.fromisoformat(data['date_of_birth']) if data.get('date_of_birth') else None
        )
        db.session.add(adolescent)
        db.session.flush()  # Get the adolescent_id
        
        # Create parent-child relationship
        parent_child = ParentChild(
            parent_id=parent.id,
            adolescent_id=adolescent.id,
            relationship_type=data['relationship_type']
        )
        db.session.add(parent_child)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Child added successfully',
            'child': {
                'id': adolescent.id,
                'user_id': child_user.id,
                'name': child_user.name,
                'phone_number': child_user.phone_number,
                'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
                'relationship': parent_child.relationship_type
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to add child', 'error': str(e)}), 500

@parents_bp.route('/children/<int:adolescent_id>', methods=['PUT'])
@jwt_required()
def update_child(adolescent_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = Parent.query.filter_by(user_id=current_user_id).first()
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    # Get adolescent and user records
    adolescent = Adolescent.query.get(adolescent_id)
    adolescent_user = User.query.get(adolescent.user_id)
    
    try:
        # Update fields if provided
        if 'name' in data:
            adolescent_user.name = data['name']
        
        if 'date_of_birth' in data:
            if data['date_of_birth']:
                adolescent.date_of_birth = datetime.fromisoformat(data['date_of_birth'].replace('Z', '+00:00'))
            else:
                adolescent.date_of_birth = None
        
        if 'relationship_type' in data:
            relation.relationship_type = data['relationship_type']
        
        # Update password if provided
        if 'password' in data:
            from app import bcrypt
            adolescent_user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Child information updated successfully'
        }), 200
    except ValueError as e:
        db.session.rollback()
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating child information: {str(e)}'}), 500

@parents_bp.route('/children/<int:adolescent_id>', methods=['DELETE'])
@jwt_required()
def delete_child(adolescent_id):
    current_user_id = get_jwt_identity()
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    # Get parent record
    parent = Parent.query.filter_by(user_id=current_user_id).first()
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    # Get adolescent and user records
    adolescent = Adolescent.query.get(adolescent_id)
    adolescent_user = User.query.get(adolescent.user_id) if adolescent else None
    try:
        # Remove records
        db.session.delete(relation)
        if adolescent:
            db.session.delete(adolescent)
        if adolescent_user:
            db.session.delete(adolescent_user)
        db.session.commit()
        return jsonify({'message': 'Child deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting child: {str(e)}'}), 500

@parents_bp.route('/children/<int:adolescent_id>/cycle-logs', methods=['GET'])
@jwt_required()
def get_child_cycle_logs(adolescent_id):
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = Parent.query.filter_by(user_id=current_user_id).first()
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    # Get adolescent and check parent access permission
    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)
    
    # Check if child allows parent access
    if not child_user.allow_parent_access:
        return jsonify({'message': 'Access denied: Child has disabled parent access to their account'}), 403
    adolescent_user_id = adolescent.user_id
    
    # Get cycle logs for the adolescent
    from app.models import CycleLog
    
    # Get query parameters for pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Query cycle logs for the adolescent, ordered by start date descending
    logs = CycleLog.query.filter_by(user_id=adolescent_user_id)\
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

@parents_bp.route('/children/<int:adolescent_id>/cycle-logs', methods=['POST'])
@jwt_required()
def create_child_cycle_log(adolescent_id):
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = Parent.query.filter_by(user_id=current_user_id).first()
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    # Get adolescent user ID
    adolescent = Adolescent.query.get(adolescent_id)
    adolescent_user_id = adolescent.user_id
    
    # Get request data
    data = request.get_json()
    
    # Validate required fields
    if not data.get('start_date'):
        return jsonify({'message': 'Start date is required and cannot be null'}), 400
    
    try:
        from app.models import CycleLog, Notification
        
        # Parse dates with proper null checks
        start_date_str = str(data['start_date'])
        if 'Z' in start_date_str:
            start_date_str = start_date_str.replace('Z', '+00:00')
            
        start_date = datetime.fromisoformat(start_date_str)
        end_date = None
        if 'end_date' in data and data['end_date']:
            end_date_str = str(data['end_date']).replace('Z', '+00:00')
            end_date = datetime.fromisoformat(end_date_str)
        
        # Prepare symptoms: accept list or string with proper null handling
        symptoms_raw = data.get('symptoms')
        symptoms_str = None
        if symptoms_raw:
            if isinstance(symptoms_raw, list):
                # Filter out empty strings and convert to string
                symptoms_list = [str(s).strip() for s in symptoms_raw if s and str(s).strip()]
                symptoms_str = ','.join(symptoms_list) if symptoms_list else None
            elif isinstance(symptoms_raw, str) and symptoms_raw.strip():
                symptoms_str = symptoms_raw.strip()
        
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
        
        # Create new cycle log for the child (NOT the parent)
        new_log = CycleLog(
            user_id=adolescent_user_id,  # IMPORTANT: Associate with child, not parent
            start_date=start_date,
            end_date=end_date,
            cycle_length=data.get('cycle_length'),
            period_length=data.get('period_length'),
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
        
        # Create notification for the child about next cycle prediction if applicable
        if new_log.cycle_length:
            import datetime as dt
            
            # Calculate predicted next cycle start date
            next_cycle_date = start_date + dt.timedelta(days=new_log.cycle_length)
            
            # Create notification for the child
            notification = Notification(
                user_id=adolescent_user_id,  # Notify the child
                title='Cycle Prediction',
                message=f"Your next period is predicted to start on {next_cycle_date.strftime('%Y-%m-%d')}",
                type='cycle'
            )
            
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({
            'message': 'Cycle log created successfully for child',
            'id': new_log.id
        }), 201
        
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating cycle log: {str(e)}'}), 500

@parents_bp.route('/children/<int:adolescent_id>/meal-logs', methods=['GET'])
@jwt_required()
def get_child_meal_logs(adolescent_id):
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = Parent.query.filter_by(user_id=current_user_id).first()
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    # Get adolescent user ID
    adolescent = Adolescent.query.get(adolescent_id)
    adolescent_user_id = adolescent.user_id
    
    # Get meal logs for the adolescent
    from app.models import MealLog
    
    # Get query parameters for pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Query meal logs for the adolescent, ordered by meal time descending
    logs = MealLog.query.filter_by(user_id=adolescent_user_id)\
        .order_by(MealLog.meal_time.desc())\
        .paginate(page=page, per_page=per_page)
    
    # Format the response
    result = {
        'items': [{
            'id': log.id,
            'meal_type': log.meal_type,
            'meal_time': log.meal_time.isoformat(),
            'description': log.description,
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

@parents_bp.route('/children/<int:adolescent_id>/appointments', methods=['GET'])
@jwt_required()
def get_child_appointments(adolescent_id):
    current_user_id = get_jwt_identity()
    
    # Check if user is a parent
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'parent':
        return jsonify({'message': 'Only parent accounts can access this endpoint'}), 403
    
    # Get parent record
    parent = Parent.query.filter_by(user_id=current_user_id).first()
    if not parent:
        return jsonify({'message': 'Parent record not found'}), 404
    
    # Check if this adolescent is a child of the parent
    relation = ParentChild.query.filter_by(parent_id=parent.id, adolescent_id=adolescent_id).first()
    if not relation:
        return jsonify({'message': 'Child not found or not associated with this parent'}), 404
    
    # Get adolescent and check parent access permission
    adolescent = Adolescent.query.get(adolescent_id)
    child_user = User.query.get(adolescent.user_id)
    
    # Check if child allows parent access
    if not child_user.allow_parent_access:
        return jsonify({'message': 'Access denied: Child has disabled parent access to their account'}), 403
    
    adolescent_user_id = adolescent.user_id
    
    # Get appointments for the adolescent
    from app.models import Appointment
    
    # Get query parameters for pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Query appointments for the adolescent, ordered by appointment date
    appointments = Appointment.query.filter_by(user_id=adolescent_user_id)\
        .order_by(Appointment.appointment_date)\
        .paginate(page=page, per_page=per_page)
    
    # Format the response
    result = {
        'items': [{
            'id': appointment.id,
            'appointment_for': appointment.appointment_for,
            'appointment_date': appointment.appointment_date.isoformat(),
            'issue': appointment.issue,
            'status': appointment.status,
            'notes': appointment.notes,
            'created_at': appointment.created_at.isoformat()
        } for appointment in appointments.items],
        'total': appointments.total,
        'pages': appointments.pages,
        'current_page': page
    }
    
    return jsonify(result), 200
