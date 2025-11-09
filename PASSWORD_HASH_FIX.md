# Password Hash Authentication Fix

## Problem
Users were experiencing login errors with the message:
```
Login error: Invalid hash method ''.
```

## Root Cause
The error occurred because some users in the database had invalid password hashes. Specifically:

1. **Test Data Script Issue**: The `create_test_data.py` script was creating users with a plain string `'hashed_password'` instead of a proper bcrypt hash.

2. **Hash Validation**: When attempting to login, bcrypt and werkzeug's `check_password_hash` functions would fail when encountering:
   - Empty strings (`''`)
   - NULL values
   - Invalid hash formats (not starting with `$`)
   - Plain text placeholders like `'hashed_password'`

## Solutions Implemented

### 1. Enhanced Login Error Handling (`/backend/app/routes/auth.py`)

**Changes Made:**
- Added validation to check if `password_hash` is empty or NULL before attempting verification
- Improved exception handling for both bcrypt and werkzeug password checks
- Better error logging to identify the issue source
- Graceful fallback with informative error messages

**Code Changes:**
```python
# Before password verification, check hash validity
if not user.password_hash or len(user.password_hash.strip()) == 0:
    print(f"Password authentication failed - empty or null password_hash for user {user.id}")
    return jsonify({'message': 'Invalid phone number or password'}), 401

# Try bcrypt first with exception handling
try:
    password_valid = bcrypt.check_password_hash(user.password_hash, data['password'])
except (ValueError, Exception) as e:
    print(f"Bcrypt check failed: {str(e)}, trying werkzeug fallback")
    try:
        password_valid = check_password_hash(user.password_hash, data['password'])
    except (ValueError, Exception) as e2:
        print(f"Werkzeug check also failed: {str(e2)}")
        return jsonify({'message': 'Invalid password format or configuration'}), 401
```

### 2. Fixed Test Data Script (`/backend/create_test_data.py`)

**Changes Made:**
- Imported `bcrypt` from the app
- Generate proper bcrypt hashes for test users using `bcrypt.generate_password_hash()`
- Set default test password to `"password123"` with proper hashing

**Code Changes:**
```python
# Import bcrypt
from app import create_app, db, bcrypt

# Generate proper hash for test users
test_password_hash = bcrypt.generate_password_hash('password123').decode('utf-8')

# Use in test user data
test_users = [
    {
        'name': 'Alice Johnson',
        'password_hash': test_password_hash,  # Proper bcrypt hash
        # ... other fields
    }
]
```

### 3. Password Hash Fix Utility (`/backend/fix_password_hashes.py`)

Created a utility script to:
- Identify users with invalid password hashes
- Display detailed information about each user's hash status
- Optionally reset passwords for affected users to `"password123"`
- Provide fix options: reset, delete, or manual intervention

**Usage:**
```bash
cd backend
python3 fix_password_hashes.py
```

**Features:**
- Checks all users for invalid password hashes
- Identifies issues like:
  - NULL/empty hashes
  - Invalid formats (not starting with '$')
  - Non-standard hash strings
- Interactive fix options
- Safe database transaction handling

## How to Fix Existing Database

### Option 1: Run the Fix Script (Recommended)
```bash
cd /home/desire/My_Project/ladys_essenced/backend
python3 fix_password_hashes.py
```

Follow the prompts to:
1. View all users with invalid hashes
2. Choose to reset passwords to default (`password123`)
3. Notify users to change their passwords

### Option 2: Manual Database Update
If you need to manually fix specific users:

```python
from app import create_app, db, bcrypt
from app.models import User

app = create_app()
with app.app_context():
    # Find user
    user = User.query.filter_by(phone_number='USER_PHONE').first()
    
    # Reset password
    new_password = 'password123'
    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    
    db.session.commit()
    print(f"Password reset for {user.name}")
```

### Option 3: Re-register Users
If there are only a few test users:
1. Delete the users from the database
2. Re-register them through the registration endpoint with proper credentials

## Prevention

### For Future Test Data
Always use proper bcrypt hashing when creating test users:

```python
from app import bcrypt

# Generate hash
password_hash = bcrypt.generate_password_hash('password123').decode('utf-8')

# Use in user creation
user = User(
    name='Test User',
    password_hash=password_hash,  # Proper bcrypt hash
    # ... other fields
)
```

### For User Registration
The registration endpoint already handles this correctly:

```python
# In /api/auth/register
password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
```

## Valid Password Hash Format

A valid bcrypt hash looks like:
```
$2b$12$K4xJ5YqM.VXCKNlYxvxvYeH.SsQqXkQrDvJLQg3Qd.Sv7WqUVCpfS
```

Format breakdown:
- `$2b$` - bcrypt algorithm identifier
- `12` - cost factor (work factor)
- `$` - separator
- Rest - salt and hash combined

## Testing

After applying fixes:

1. **Test Login with Password:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"phone_number": "USER_PHONE", "password": "password123"}'
   ```

2. **Verify No Errors:**
   - Check backend logs for "Invalid hash method" errors
   - Confirm successful login response with tokens

3. **Test Registration:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "New User",
       "phone_number": "+250-123-456-789",
       "password": "securepassword123",
       "user_type": "parent"
     }'
   ```

## Summary

✅ **Fixed:**
- Login authentication now handles invalid password hashes gracefully
- Test data script generates proper bcrypt hashes
- Created utility to identify and fix existing invalid hashes

⚠️ **Action Required:**
1. Run `fix_password_hashes.py` to fix existing users
2. Notify affected users that their password was reset to `password123`
3. Ask users to change their passwords after logging in

🔒 **Security:**
- All new users will have proper bcrypt hashes
- Existing functionality for password and PIN authentication preserved
- Backward compatibility with werkzeug hashes maintained
