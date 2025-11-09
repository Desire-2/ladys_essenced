from app.models import User
from app import db, bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import re

auth_bp = Blueprint('auth', __name__)

# ====== VALIDATION HELPERS ======

def validate_phone_number(phone_number):
    """Validate phone number format (10+ digits, no spaces/special chars except +)"""
    if not phone_number:
        return False, "Phone number required"
    
    phone = phone_number.strip()
    # Allow + prefix and digits only
    if not re.match(r'^\+?\d{10,}$', phone):
        return False, "Phone number must contain at least 10 digits"
    return True, None

def validate_password_strength(password):
    """Validate password meets minimum security requirements"""
    if not password:
        return False, "Password required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, None

def validate_pin(pin_str):
    """Validate and check PIN security"""
    if not pin_str:
        return False, "PIN required"
    
    pin = pin_str.strip()
    
    if len(pin) != 4 or not pin.isdigit():
        return False, "PIN must be exactly 4 digits"
    
    # Prevent weak PINs
    weak_pins = {'0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',  # Repeated
                 '0123', '1234', '2345', '3456', '4567', '5678', '6789',  # Sequential ascending
                 '3210', '4321', '5432', '6543', '7654', '8765', '9876'}  # Sequential descending
    
    if pin in weak_pins:
        return False, "PIN is too simple. Choose a less obvious combination"
    
    return True, None

def log_login_attempt(phone_number, success, ip_address=None):
    """Log authentication attempt for audit trail and rate limiting"""
    try:
        from app.models import LoginAttempt
        attempt = LoginAttempt(
            phone_number=phone_number,
            success=success,
            ip_address=ip_address or request.remote_addr
        )
        db.session.add(attempt)
        db.session.commit()
    except Exception as e:
        # If table doesn't exist or other database error, continue gracefully
        # This allows authentication to work while migration is being applied
        print(f"Error logging login attempt: {str(e)}")
        try:
            db.session.rollback()
        except:
            pass  # Ignore rollback errors

def check_rate_limit(phone_number, ip_address=None):
    """Check if user has exceeded login attempt rate limit"""
    try:
        from app.models import LoginAttempt
        ip = ip_address or request.remote_addr
        
        # Check attempts in last 15 minutes
        fifteen_min_ago = datetime.utcnow() - timedelta(minutes=15)
        recent_attempts = LoginAttempt.query.filter(
            LoginAttempt.phone_number == phone_number,
            LoginAttempt.ip_address == ip,
            LoginAttempt.created_at > fifteen_min_ago
        ).all()
        
        failed_attempts = sum(1 for attempt in recent_attempts if not attempt.success)
        
        # Limit to 5 failed attempts per 15 minutes
        if failed_attempts >= 5:
            return False, "Too many login attempts. Please try again in 15 minutes"
        
        return True, None
    except Exception as e:
        # If table doesn't exist or other error, allow login but log the error
        # This gracefully handles the case where migration hasn't been run yet
        print(f"Error checking rate limit: {str(e)}")
        # Rollback any failed transaction to prevent "transaction aborted" errors
        try:
            db.session.rollback()
        except:
            pass
        # Return True to allow login - rate limiting will work once migration is applied
        return True, None

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'phone_number', 'password', 'user_type']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Validate phone number
    is_valid, error_msg = validate_phone_number(data['phone_number'])
    if not is_valid:
        return jsonify({'message': error_msg}), 400
    
    # Check if phone number already exists
    if User.query.filter_by(phone_number=data['phone_number'].strip()).first():
        return jsonify({'message': 'Phone number already registered'}), 409
    
    # Validate user type
    if data['user_type'] not in ['parent', 'adolescent']:
        return jsonify({'message': 'Invalid user type. Must be "parent" or "adolescent"'}), 400
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(data['password'])
    if not is_valid:
        return jsonify({'message': error_msg}), 400
    
    # Hash password using bcrypt
    password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Validate and hash PIN if provided
    pin_hash = None
    enable_pin_auth = False
    if 'pin' in data and data['pin']:
        is_valid, error_msg = validate_pin(data['pin'])
        if not is_valid:
            return jsonify({'message': error_msg}), 400
        pin_hash = bcrypt.generate_password_hash(data['pin'].strip()).decode('utf-8')
        enable_pin_auth = True
    
    # Create new user
    new_user = User(
        name=data['name'],
        phone_number=data['phone_number'].strip(),
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
        
        phone = data['phone_number'].strip()
        has_password = 'password' in data and data['password']
        has_pin = 'pin' in data and data['pin']
        
        # Check if neither password nor PIN is provided
        if not has_password and not has_pin:
            return jsonify({'message': 'Please provide either password or PIN'}), 400
        
        # Check if both password and PIN provided
        if has_password and has_pin:
            return jsonify({'message': 'Please provide either password OR PIN, not both'}), 400
        
        # Check rate limit
        is_allowed, rate_limit_error = check_rate_limit(phone)
        if not is_allowed:
            log_login_attempt(phone, False)
            return jsonify({'message': rate_limit_error}), 429
        
        # Find user by phone number
        user = User.query.filter_by(phone_number=phone).first()
        
        if not user:
            log_login_attempt(phone, False)
            return jsonify({'message': 'Invalid phone number or authentication credentials'}), 401
        
        # Attempt PIN authentication
        if has_pin:
            pin = data['pin'].strip()
            
            # Check if user has PIN auth enabled
            if not user.enable_pin_auth:
                log_login_attempt(phone, False)
                return jsonify({'message': 'This account does not have PIN authentication enabled'}), 401
            
            # Verify PIN
            if user.pin_hash and bcrypt.check_password_hash(user.pin_hash, pin):
                # PIN authentication successful
                log_login_attempt(phone, True)
                user_identity = str(user.id)
                access_token = create_access_token(identity=user_identity)
                refresh_token = create_refresh_token(identity=user_identity)
                
                return jsonify({
                    'message': 'Login successful',
                    'user_id': user.id,
                    'user_type': user.user_type,
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'auth_method': 'pin'
                }), 200
            else:
                # Invalid PIN
                log_login_attempt(phone, False)
                return jsonify({'message': 'Invalid PIN'}), 401
        
        # Attempt password authentication
        elif has_password:
            password = data['password']
            
            # Verify password using bcrypt
            if user.password_hash and bcrypt.check_password_hash(user.password_hash, password):
                # Password authentication successful
                log_login_attempt(phone, True)
                user_identity = str(user.id)
                access_token = create_access_token(identity=user_identity)
                refresh_token = create_refresh_token(identity=user_identity)
                
                return jsonify({
                    'message': 'Login successful',
                    'user_id': user.id,
                    'user_type': user.user_type,
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'auth_method': 'password'
                }), 200
            else:
                # Invalid password
                log_login_attempt(phone, False)
                return jsonify({'message': 'Invalid phone number or authentication credentials'}), 401
        
        log_login_attempt(phone, False)
        return jsonify({'message': 'Invalid phone number or authentication credentials'}), 401
        
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
        
        # Verify user still exists
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'message': 'User not found or has been deleted'}), 401
        
        # Ensure identity is a string for the new access token
        new_identity = str(current_user_id)
        print(f"Refresh: Creating new access token with identity: '{new_identity}' (type: {type(new_identity)})")
        access_token = create_access_token(identity=new_identity)
        
        return jsonify({
            'access_token': access_token
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
            'email': user.email,
            'phone_number': user.phone_number,
            'phone': user.phone_number,  # Add phone alias for consistency
            'user_type': user.user_type,
            'enable_pin_auth': user.enable_pin_auth,
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
    
    # Update email if provided
    if 'email' in data and data['email']:
        # Check if email already exists for another user
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({'message': 'Email already in use'}), 400
        user.email = data['email']
    
    # Update phone if provided
    if 'phone' in data and data['phone']:
        user.phone_number = data['phone']
    
    # Update age if provided (for adolescents)
    if 'age' in data and user.user_type == 'adolescent':
        # Age is stored in adolescent table via date_of_birth
        pass  # Handle through date_of_birth calculation if needed
    
    # Update password if provided
    if 'password' in data:
        is_valid, error_msg = validate_password_strength(data['password'])
        if not is_valid:
            return jsonify({'message': error_msg}), 400
        user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Update PIN if provided
    if 'pin' in data and data['pin']:
        is_valid, error_msg = validate_pin(data['pin'])
        if not is_valid:
            return jsonify({'message': error_msg}), 400
        user.pin_hash = bcrypt.generate_password_hash(data['pin'].strip()).decode('utf-8')
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
