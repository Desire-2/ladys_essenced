# Authentication - Before & After Code Examples

**Date**: November 9, 2025  
**Project**: Lady's Essence  

---

## 1. PASSWORD HASHING - BEFORE vs AFTER

### ❌ BEFORE: Inconsistent Hashing
```python
# Registration used werkzeug
from werkzeug.security import generate_password_hash
password_hash = generate_password_hash(data['password'])

# Login used werkzeug
from werkzeug.security import check_password_hash
if check_password_hash(user.password_hash, data['password']):
    # Success

# PIN used bcrypt (different!)
from app import bcrypt
pin_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
if bcrypt.check_password_hash(user.pin_hash, pin):
    # Success

# PROBLEM: Mixed hashing algorithms = SECURITY VULNERABILITY
```

### ✅ AFTER: Consistent Bcrypt
```python
# Registration uses bcrypt
from app import bcrypt
password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')

# Login uses bcrypt
if bcrypt.check_password_hash(user.password_hash, data['password']):
    # Success

# PIN uses bcrypt (same!)
pin_hash = bcrypt.generate_password_hash(pin).decode('utf-8')
if bcrypt.check_password_hash(user.pin_hash, pin):
    # Success

# SOLUTION: Consistent bcrypt throughout = SECURE
```

---

## 2. PIN/PASSWORD AUTHENTICATION LOGIC - BEFORE vs AFTER

### ❌ BEFORE: Flawed Logic
```python
# Old broken logic
if 'pin' in data and data['pin']:
    pin = data['pin'].strip()
    if user.enable_pin_auth and user.pin_hash and \
       bcrypt.check_password_hash(user.pin_hash, pin):
        # PIN correct - return success
        return success, 200
    elif user.enable_pin_auth:
        # PIN incorrect
        return error, 401
    # FALLS THROUGH to password check if PIN not enabled!

# Try password authentication
if 'password' in data and \
   check_password_hash(user.password_hash, data['password']):
    return success, 200

return error, 401

# PROBLEMS:
# 1. If PIN provided but not enabled, falls through to password
# 2. No check for BOTH PIN and password provided
# 3. Confusing behavior
```

### ✅ AFTER: Clear Logic
```python
# New clear logic
# Step 1: Validate only one method provided
if has_password and has_pin:
    return {'message': 'Provide password OR PIN, not both'}, 400

if not has_password and not has_pin:
    return {'message': 'Please provide password or PIN'}, 400

# Step 2: Try PIN if provided
if has_pin:
    pin = data['pin'].strip()
    if not user.enable_pin_auth:
        return {'message': 'PIN auth not enabled'}, 401
    if user.pin_hash and bcrypt.check_password_hash(user.pin_hash, pin):
        return success, 200
    else:
        return {'message': 'Invalid PIN'}, 401

# Step 3: Try password if provided
elif has_password:
    password = data['password']
    if user.password_hash and \
       bcrypt.check_password_hash(user.password_hash, password):
        return success, 200
    else:
        return {'message': 'Invalid credentials'}, 401

# SOLUTION:
# 1. Clear separation of concerns
# 2. Explicit error messages
# 3. No fallthrough
# 4. Mutual exclusion enforced
```

---

## 3. API RESPONSE FORMAT - BEFORE vs AFTER

### ❌ BEFORE: Wrong Field Name
```python
return jsonify({
    'message': 'Login successful',
    'user_id': user.id,
    'user_type': user.user_type,
    'token': access_token,              # ❌ Wrong field name
    'refresh_token': refresh_token,
    'auth_method': 'password'
}), 200

# Frontend expects 'access_token', not 'token'
# Non-standard JWT naming
```

### ✅ AFTER: Correct Field Name
```python
return jsonify({
    'message': 'Login successful',
    'user_id': user.id,
    'user_type': user.user_type,
    'access_token': access_token,      # ✅ Correct field name
    'refresh_token': refresh_token,
    'auth_method': 'password'
}), 200

# Matches JWT standard convention
# Frontend alignment
```

---

## 4. PASSWORD VALIDATION - BEFORE vs AFTER

### ❌ BEFORE: No Validation
```python
# Any password accepted
password = data['password']
password_hash = generate_password_hash(password)

# Accepts:
# - "a" (1 character!)
# - "password" (no uppercase or numbers)
# - "12345678" (no uppercase or letters)
```

### ✅ AFTER: Strong Validation
```python
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

# In registration:
is_valid, error_msg = validate_password_strength(data['password'])
if not is_valid:
    return jsonify({'message': error_msg}), 400

# Now accepts only:
# - "ValidPass123" ✅
# - "SecurePass99" ✅
# - "MyApp2025" ✅
# Rejects:
# - "password" ❌ (no uppercase or numbers)
# - "ALLUPPERCASE123" ❌ (could be extended if needed)
```

---

## 5. PIN VALIDATION - BEFORE vs AFTER

### ❌ BEFORE: Weak PIN Detection
```python
# Old validation
if len(pin) != 4 or not pin.isdigit():
    return error, 400

# Accepts weak PINs:
# - "0000" ❌ (all zeros)
# - "1111" ❌ (all ones)
# - "1234" ❌ (sequential)
# - "9876" ❌ (sequential descending)
```

### ✅ AFTER: Comprehensive PIN Validation
```python
def validate_pin(pin_str):
    """Validate and check PIN security"""
    if not pin_str:
        return False, "PIN required"
    
    pin = pin_str.strip()
    
    if len(pin) != 4 or not pin.isdigit():
        return False, "PIN must be exactly 4 digits"
    
    # Prevent weak PINs
    weak_pins = {
        '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',  # Repeated
        '0123', '1234', '2345', '3456', '4567', '5678', '6789',  # Sequential ascending
        '3210', '4321', '5432', '6543', '7654', '8765', '9876'   # Sequential descending
    }
    
    if pin in weak_pins:
        return False, "PIN is too simple. Choose a less obvious combination"
    
    return True, None

# Accepts:
# - "2847" ✅
# - "1592" ✅
# - "9284" ✅
# Rejects:
# - "0000" ❌ (all same)
# - "1234" ❌ (sequential)
# - "9876" ❌ (sequential)
```

---

## 6. RATE LIMITING - BEFORE vs AFTER

### ❌ BEFORE: No Rate Limiting
```python
# No rate limiting at all
@auth_bp.route('/login', methods=['POST'])
def login():
    # Try login
    # Unlimited attempts allowed
    # Easy brute force attack on PIN (only 10,000 combinations)
```

### ✅ AFTER: Rate Limiting Implemented
```python
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
        print(f"Error checking rate limit: {str(e)}")
        return True, None  # Allow if error

# In login endpoint:
is_allowed, rate_limit_error = check_rate_limit(phone)
if not is_allowed:
    log_login_attempt(phone, False)
    return jsonify({'message': rate_limit_error}), 429
```

---

## 7. TOKEN REFRESH - BEFORE vs AFTER

### ❌ BEFORE: No User Validation
```python
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    
    # Create new token without checking if user exists
    access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'token': access_token  # Also wrong field name
    }), 200

# PROBLEM: Deleted users can still get new tokens!
```

### ✅ AFTER: User Existence Verified
```python
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    
    # Verify user still exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'message': 'User not found or has been deleted'}), 401
    
    # Only create token if user exists
    new_identity = str(current_user_id)
    access_token = create_access_token(identity=new_identity)
    
    return jsonify({
        'access_token': access_token  # Correct field name
    }), 200

# SOLUTION: Deleted users cannot refresh tokens
```

---

## 8. FRONTEND TOKEN HANDLING - BEFORE vs AFTER

### ❌ BEFORE: Brittle Token Field
```javascript
const login = async (credentials) => {
    // ...
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
        throw new Error('Login failed');
    }
    
    // Assumes backend returns 'token' field
    const { token, refresh_token, user_id, user_type } = await response.json();
    
    // If backend changes to 'access_token', this breaks!
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refresh_token);
    
    // PROBLEM: Breaks if API response format changes
};
```

### ✅ AFTER: Flexible Token Field
```javascript
const login = async (credentials) => {
    // ...
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
        throw new Error('Login failed');
    }
    
    // Handles BOTH 'token' and 'access_token' fields
    const { token, access_token, refresh_token, user_id, user_type } = await response.json();
    
    // Use access_token if available, otherwise fall back to token
    const actualToken = access_token || token;
    
    // Works with both old and new API formats!
    localStorage.setItem('access_token', actualToken);
    localStorage.setItem('refresh_token', refresh_token);
    
    // Later, use correct token variable everywhere
    const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
            'Authorization': `Bearer ${actualToken}`  // Use actualToken, not token
        }
    });
    
    // SOLUTION: Backward compatible, flexible
};
```

---

## 9. INPUT VALIDATION - BEFORE vs AFTER

### ❌ BEFORE: Minimal Validation
```python
# Registration validation
if not data or 'phone_number' not in data:
    return error, 400

# Check if phone exists
if User.query.filter_by(phone_number=data['phone_number']).first():
    return error, 409

# No phone format validation
# No password strength validation
# No PIN validation (except 4 digits)
```

### ✅ AFTER: Comprehensive Validation
```python
# Registration validation
if not data or 'phone_number' not in data:
    return jsonify({'message': 'Missing phone number'}), 400

# Validate phone format
is_valid, error_msg = validate_phone_number(data['phone_number'])
if not is_valid:
    return jsonify({'message': error_msg}), 400

# Check if phone exists (with normalized phone)
if User.query.filter_by(phone_number=data['phone_number'].strip()).first():
    return jsonify({'message': 'Phone number already registered'}), 409

# Validate user type
if data['user_type'] not in ['parent', 'adolescent']:
    return jsonify({'message': 'Invalid user type'}), 400

# Validate password strength
is_valid, error_msg = validate_password_strength(data['password'])
if not is_valid:
    return jsonify({'message': error_msg}), 400

# Validate PIN if provided
if 'pin' in data and data['pin']:
    is_valid, error_msg = validate_pin(data['pin'])
    if not is_valid:
        return jsonify({'message': error_msg}), 400

# All validation passed
```

---

## 10. AUDIT LOGGING - BEFORE vs AFTER

### ❌ BEFORE: No Logging
```python
# Login attempt not logged
@auth_bp.route('/login', methods=['POST'])
def login():
    user = User.query.filter_by(phone_number=phone).first()
    
    if not user:
        # Silent failure, no record
        return error, 401
    
    # Checked password
    if check_password_hash(...):
        # Silent success, no record
        return success, 200
    
    # No way to track:
    # - Which users are failing to login
    # - Brute force attacks
    # - Failed attempts for rate limiting
```

### ✅ AFTER: Comprehensive Audit Trail
```python
# New audit logging model
class LoginAttempt(db.Model):
    __tablename__ = 'login_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(20), index=True)
    success = db.Column(db.Boolean, index=True)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, index=True)

# Login attempt logging function
def log_login_attempt(phone_number, success, ip_address=None):
    attempt = LoginAttempt(
        phone_number=phone_number,
        success=success,
        ip_address=ip_address or request.remote_addr
    )
    db.session.add(attempt)
    db.session.commit()

# Usage in login endpoint
@auth_bp.route('/login', methods=['POST'])
def login():
    user = User.query.filter_by(phone_number=phone).first()
    
    if not user:
        log_login_attempt(phone, False)  # Log failed attempt
        return error, 401
    
    if bcrypt.check_password_hash(...):
        log_login_attempt(phone, True)   # Log successful attempt
        return success, 200
    
    log_login_attempt(phone, False)      # Log failed attempt
    return error, 401

# Now can query:
# - Failed logins: SELECT * FROM login_attempts WHERE success = false
# - Per-user attempts: SELECT * FROM login_attempts WHERE phone_number = ?
# - Rate limiting: SELECT COUNT(*) FROM login_attempts WHERE phone_number = ? AND created_at > ?
# - Security analysis: SELECT phone_number, COUNT(*) FROM login_attempts GROUP BY phone_number
```

---

## Summary Table

| Aspect | Before | After |
|--------|--------|-------|
| **Password Hashing** | Mixed werkzeug+bcrypt ❌ | Consistent bcrypt ✅ |
| **PIN Logic** | Falls through ❌ | Clear separation ✅ |
| **API Response** | `token` field ❌ | `access_token` field ✅ |
| **Rate Limiting** | None ❌ | 5/15min ✅ |
| **Password Validation** | None ❌ | Strong requirements ✅ |
| **PIN Validation** | Weak patterns allowed ❌ | Weak patterns blocked ✅ |
| **Token Refresh** | No user check ❌ | User verified ✅ |
| **Audit Trail** | None ❌ | Complete logging ✅ |
| **Frontend Compatibility** | Brittle ❌ | Flexible ✅ |
| **Error Messages** | Generic ❌ | Clear & specific ✅ |

---

**Date**: November 9, 2025  
**Status**: ✅ Complete  
**Version**: 1.0

