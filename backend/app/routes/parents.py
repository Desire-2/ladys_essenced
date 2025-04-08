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
                    'relationship': relation.relationship_type
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
@jwt_required()
def add_child():
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
    
    # Validate required fields
    required_fields = ['name', 'phone_number', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Check if phone number already exists
    if User.query.filter_by(phone_number=data['phone_number']).first():
        return jsonify({'message': 'Phone number already registered'}), 409
    
    try:
        # Create new user for the adolescent
        from app import bcrypt
        password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        new_user = User(
            name=data['name'],
            phone_number=data['phone_number'],
            password_hash=password_hash,
            user_type='adolescent'
        )
        
        db.session.add(new_user)
        db.session.flush()  # Get the ID without committing
        
        # Create adolescent record
        date_of_birth = None
        if 'date_of_birth' in data and data['date_of_birth']:
            date_of_birth = datetime.fromisoformat(data['date_of_birth'].replace('Z', '+00:00'))
        
        new_adolescent = Adolescent(
            user_id=new_user.id,
            date_of_birth=date_of_birth
        )
        
        db.session.add(new_adolescent)
        db.session.flush()  # Get the ID without committing
        
        # Create parent-child relationship
        relationship_type = data.get('relationship_type', 'parent')
        
        new_relation = ParentChild(
            parent_id=parent.id,
            adolescent_id=new_adolescent.id,
            relationship_type=relationship_type
        )
        
        db.session.add(new_relation)
        db.session.commit()
        
        return jsonify({
            'message': 'Child added successfully',
            'child_id': new_adolescent.id,
            'user_id': new_user.id
        }), 201
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding child: {str(e)}'}), 500

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
    
    # Get adolescent user ID
    adolescent = Adolescent.query.get(adolescent_id)
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
    
    # Get adolescent user ID
    adolescent = Adolescent.query.get(adolescent_id)
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
