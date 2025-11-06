from app.models import User
from app import db, bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime
from werkzeug.security import check_password_hash, generate_password_hash

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
    password_hash = generate_password_hash(data['password'])
    
    # Validate and hash PIN if provided
    pin_hash = None
    enable_pin_auth = False
    if 'pin' in data and data['pin']:
        pin = data['pin'].strip()
        # Validate PIN: must be exactly 4 digits
        if len(pin) != 4 or not pin.isdigit():
            return jsonify({'message': 'PIN must be exactly 4 digits'}), 400
        pin_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
        enable_pin_auth = True
    
    # Create new user
    new_user = User(
        name=data['name'],
        phone_number=data['phone_number'],
        password_hash=password_hash,
        user_type=data['user_type'],
        pin_hash=pin_hash,
        enable_pin_auth=enable_pin_auth
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
        'user_id': new_user.id,
        'pin_enabled': enable_pin_auth
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'phone_number' not in data:
            return jsonify({'message': 'Missing phone number'}), 400
        
        # Check if either password or pin is provided
        if 'password' not in data and 'pin' not in data:
            return jsonify({'message': 'Missing password or PIN'}), 400
        
        # Find user by phone number
        user = User.query.filter_by(phone_number=data['phone_number']).first()
        
        if not user:
            return jsonify({'message': 'Invalid phone number or password'}), 401
        
        # Try PIN authentication if PIN is provided
        if 'pin' in data and data['pin']:
            pin = data['pin'].strip()
            if user.enable_pin_auth and user.pin_hash and check_password_hash(user.pin_hash, pin):
                # PIN authentication successful
                user_identity = str(user.id)
                access_token = create_access_token(identity=user_identity)
                refresh_token = create_refresh_token(identity=user_identity)
                
                return jsonify({
                    'message': 'Login successful',
                    'user_id': user.id,
                    'user_type': user.user_type,
                    'token': access_token,
                    'refresh_token': refresh_token,
                    'auth_method': 'pin'
                }), 200
            elif user.enable_pin_auth:
                return jsonify({'message': 'Invalid PIN'}), 401
        
        # Try password authentication
        if 'password' in data and check_password_hash(user.password_hash, data['password']):
            user_identity = str(user.id)
            access_token = create_access_token(identity=user_identity)
            refresh_token = create_refresh_token(identity=user_identity)
            
            return jsonify({
                'message': 'Login successful',
                'user_id': user.id,
                'user_type': user.user_type,
                'token': access_token,
                'refresh_token': refresh_token,
                'auth_method': 'password'
            }), 200
        
        return jsonify({'message': 'Invalid phone number or password'}), 401
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    print("Refresh endpoint called")
    try:
        current_user_id = get_jwt_identity()
        print(f"Refresh: Identity from token: {current_user_id} (type: {type(current_user_id)})")
        
        # Ensure identity is a string for the new access token
        new_identity = str(current_user_id)
        print(f"Refresh: Creating new access token with identity: '{new_identity}' (type: {type(new_identity)})")
        access_token = create_access_token(identity=new_identity)
        
        return jsonify({
            'token': access_token
        }), 200
    except Exception as e:
        print(f"Refresh endpoint error: {str(e)}")
        return jsonify({'message': 'Internal server error during refresh', 'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        print("Profile endpoint called")
        current_user_id = get_jwt_identity()
        print(f"Current user ID: {current_user_id}")
        user = User.query.get(current_user_id)
        print(f"User found: {user.name if user else 'None'}")
        
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
        
    except Exception as e:
        print(f"Profile endpoint error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

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
    
    # Update PIN if provided
    if 'pin' in data and data['pin']:
        pin = data['pin'].strip()
        # Validate PIN: must be exactly 4 digits
        if len(pin) != 4 or not pin.isdigit():
            return jsonify({'message': 'PIN must be exactly 4 digits'}), 400
        user.pin_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
        user.enable_pin_auth = True
    
    # Allow disabling PIN authentication
    if 'enable_pin_auth' in data:
        user.enable_pin_auth = data['enable_pin_auth']
    
    # Update additional fields based on user type
    if user.user_type == 'adolescent' and 'date_of_birth' in data:
        from app.models import Adolescent
        adolescent = Adolescent.query.filter_by(user_id=user.id).first()
        if adolescent:
            adolescent.date_of_birth = data['date_of_birth']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'pin_enabled': user.enable_pin_auth
    }), 200

@auth_bp.route('/test-jwt', methods=['GET'])
@jwt_required()
def test_jwt():
    current_user_id = get_jwt_identity()
    return jsonify({
        'message': 'JWT is working correctly',
        'user_id': current_user_id,
        'timestamp': datetime.now().isoformat()
    }), 200
