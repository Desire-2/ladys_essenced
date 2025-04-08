from app.models import User
from app import db, bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'phone_number', 'password', 'user_type']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Check if phone number already exists
    if User.query.filter_by(phone_number=data['phone_number']).first():
        return jsonify({'message': 'Phone number already registered'}), 409
    
    # Validate user type
    if data['user_type'] not in ['parent', 'adolescent']:
        return jsonify({'message': 'Invalid user type. Must be "parent" or "adolescent"'}), 400
    
    # Hash password
    password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create new user
    new_user = User(
        name=data['name'],
        phone_number=data['phone_number'],
        password_hash=password_hash,
        user_type=data['user_type']
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Create additional record in parent or adolescent table
    if data['user_type'] == 'parent':
        from app.models import Parent
        new_parent = Parent(user_id=new_user.id)
        db.session.add(new_parent)
    else:  # adolescent
        from app.models import Adolescent
        date_of_birth = data.get('date_of_birth')
        new_adolescent = Adolescent(user_id=new_user.id, date_of_birth=date_of_birth)
        db.session.add(new_adolescent)
    
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully',
        'user_id': new_user.id
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if not data or 'phone_number' not in data or 'password' not in data:
        return jsonify({'message': 'Missing phone number or password'}), 400
    
    # Find user by phone number
    user = User.query.filter_by(phone_number=data['phone_number']).first()
    
    # Check if user exists and password is correct
    if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': 'Invalid phone number or password'}), 401
    
    # Create access and refresh tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user_id': user.id,
        'user_type': user.user_type,
        'token': access_token,
        'refresh_token': refresh_token
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'token': access_token
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Get additional profile information based on user type
    additional_info = {}
    if user.user_type == 'parent':
        from app.models import Parent, ParentChild, Adolescent
        parent = Parent.query.filter_by(user_id=user.id).first()
        if parent:
            # Get children information
            children = []
            parent_child_relations = ParentChild.query.filter_by(parent_id=parent.id).all()
            for relation in parent_child_relations:
                adolescent = Adolescent.query.get(relation.adolescent_id)
                if adolescent:
                    adolescent_user = User.query.get(adolescent.user_id)
                    if adolescent_user:
                        children.append({
                            'id': adolescent.id,
                            'name': adolescent_user.name,
                            'date_of_birth': adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None,
                            'relationship': relation.relationship_type
                        })
            additional_info['children'] = children
    elif user.user_type == 'adolescent':
        from app.models import Adolescent, ParentChild, Parent
        adolescent = Adolescent.query.filter_by(user_id=user.id).first()
        if adolescent:
            additional_info['date_of_birth'] = adolescent.date_of_birth.isoformat() if adolescent.date_of_birth else None
            
            # Get parent information
            parents = []
            parent_child_relations = ParentChild.query.filter_by(adolescent_id=adolescent.id).all()
            for relation in parent_child_relations:
                parent = Parent.query.get(relation.parent_id)
                if parent:
                    parent_user = User.query.get(parent.user_id)
                    if parent_user:
                        parents.append({
                            'id': parent.id,
                            'name': parent_user.name,
                            'relationship': relation.relationship_type
                        })
            additional_info['parents'] = parents
    
    return jsonify({
        'id': user.id,
        'name': user.name,
        'phone_number': user.phone_number,
        'user_type': user.user_type,
        'created_at': user.created_at.isoformat(),
        **additional_info
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update user fields
    if 'name' in data:
        user.name = data['name']
    
    # Update password if provided
    if 'password' in data:
        user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Update additional fields based on user type
    if user.user_type == 'adolescent' and 'date_of_birth' in data:
        from app.models import Adolescent
        adolescent = Adolescent.query.filter_by(user_id=user.id).first()
        if adolescent:
            adolescent.date_of_birth = data['date_of_birth']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully'
    }), 200
