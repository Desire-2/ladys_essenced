# Authentication Testing Guide

## Updated November 9, 2025

### Changes Made

#### Backend (`backend/app/routes/auth.py`)
1. ✅ **Consistent Bcrypt Hashing**: Changed from werkzeug to bcrypt for both passwords
2. ✅ **Fixed PIN Logic**: Clear separation between PIN and password authentication
3. ✅ **API Response Format**: Changed from `'token'` to `'access_token'`
4. ✅ **Rate Limiting**: Added rate limit checks (5 attempts per 15 minutes)
5. ✅ **Input Validation**: 
   - Phone number: 10+ digits with optional + prefix
   - Password: min 8 chars, 1 uppercase, 1 digit
   - PIN: 4 digits, no weak patterns (0000, 1111, 1234, etc.)
6. ✅ **User Existence Check**: Refresh endpoint now verifies user still exists
7. ✅ **Audit Logging**: LoginAttempt model tracks all authentication attempts

#### Frontend (`frontend/src/contexts/AuthContext.js`)
1. ✅ **Token Field Handling**: Support both `access_token` and `token` (backward compatible)
2. ✅ **Consistent Token Usage**: All profile fetches use the correct token variable

#### Database
1. ✅ **New Model**: LoginAttempt model for rate limiting and audit trail
2. ✅ **Migration**: Created `b2f8e7d9c1a3_add_login_attempt_model.py`

---

## Testing Instructions

### 1. Database Migration
Before running tests, apply the database migration:

```bash
cd /home/desire/My_Project/ladys_essenced/backend
python -m flask db upgrade
```

Expected output:
```
INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade a7f9c2e3b1d4 -> b2f8e7d9c1a3, Add LoginAttempt model for authentication audit and rate limiting
```

### 2. Test Password Validation

#### 2.1 Test Weak Password During Registration
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone_number": "1234567890",
    "password": "weak",
    "user_type": "parent"
  }'
```

**Expected**: 400 with message "Password must be at least 8 characters long"

#### 2.2 Test Password Without Uppercase
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone_number": "1234567890",
    "password": "weakpass123",
    "user_type": "parent"
  }'
```

**Expected**: 400 with message "Password must contain at least one uppercase letter"

#### 2.3 Test Valid Password Registration
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone_number": "1234567890",
    "password": "ValidPass123",
    "user_type": "parent"
  }'
```

**Expected**: 201 with user_id and message "User registered successfully"

### 3. Test PIN Validation

#### 3.1 Test Weak PIN (All same digits)
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone_number": "9876543210",
    "password": "ValidPass123",
    "pin": "0000",
    "user_type": "adolescent"
  }'
```

**Expected**: 400 with message "PIN is too simple..."

#### 3.2 Test Weak PIN (Sequential)
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone_number": "9876543210",
    "password": "ValidPass123",
    "pin": "1234",
    "user_type": "adolescent"
  }'
```

**Expected**: 400 with message "PIN is too simple..."

#### 3.3 Test Valid PIN Registration
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone_number": "5555555555",
    "password": "ValidPass123",
    "pin": "2847",
    "user_type": "adolescent"
  }'
```

**Expected**: 201 with user_id, message "User registered successfully", and pin_enabled: true

### 4. Test Password Authentication

#### 4.1 Test Login with Correct Password
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567890",
    "password": "ValidPass123"
  }'
```

**Expected**: 200 with access_token, refresh_token, user_id, user_type, auth_method: "password"

**Response should look like:**
```json
{
  "message": "Login successful",
  "user_id": 1,
  "user_type": "parent",
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "auth_method": "password"
}
```

#### 4.2 Test Login with Wrong Password
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567890",
    "password": "WrongPass123"
  }'
```

**Expected**: 401 with message "Invalid phone number or authentication credentials"

### 5. Test PIN Authentication

#### 5.1 Test Login with Correct PIN
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "5555555555",
    "pin": "2847"
  }'
```

**Expected**: 200 with access_token, refresh_token, auth_method: "pin"

#### 5.2 Test Login with Wrong PIN
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "5555555555",
    "pin": "1234"
  }'
```

**Expected**: 401 with message "Invalid PIN"

#### 5.3 Test PIN on Account Without PIN Enabled
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567890",
    "pin": "0000"
  }'
```

**Expected**: 401 with message "This account does not have PIN authentication enabled"

### 6. Test Authentication Methods Validation

#### 6.1 Test Providing Both PIN and Password
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567890",
    "password": "ValidPass123",
    "pin": "2847"
  }'
```

**Expected**: 400 with message "Please provide either password OR PIN, not both"

#### 6.2 Test Providing Neither PIN nor Password
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567890"
  }'
```

**Expected**: 400 with message "Please provide either password or PIN"

### 7. Test Rate Limiting

#### 7.1 Trigger Rate Limit (5 failed attempts)
Run this command 5 times with a wrong PIN:
```bash
for i in {1..5}; do
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "phone_number": "5555555555",
      "pin": "0000"
    }'
  echo "\nAttempt $i"
done
```

#### 7.2 Attempt After Rate Limit
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "5555555555",
    "pin": "2847"
  }'
```

**Expected**: 429 with message "Too many login attempts. Please try again in 15 minutes"

### 8. Test Token Refresh

#### 8.1 Get Initial Token
```bash
RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567890",
    "password": "ValidPass123"
  }')

REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')
echo "Refresh Token: $REFRESH_TOKEN"
```

#### 8.2 Refresh Token
```bash
curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

**Expected**: 200 with new access_token

**Response should look like:**
```json
{
  "access_token": "eyJhbGc..."
}
```

### 9. Test User Profile Access

#### 9.1 Get Profile with Valid Token
```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567890",
    "password": "ValidPass123"
  }' | jq -r '.access_token')

curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 200 with user profile data including:
- id
- name
- phone_number
- user_type
- enable_pin_auth
- children (if parent)
- parents (if adolescent)

#### 9.2 Try Profile with Invalid Token
```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected**: 422 with JWT verification error

### 10. Test Audit Logging

#### 10.1 Check Login Attempts in Database
```bash
# Login to database
psql -U your_db_user -d your_db_name

# Query login attempts
SELECT * FROM login_attempts ORDER BY created_at DESC LIMIT 10;

# Query failed attempts
SELECT * FROM login_attempts WHERE success = false ORDER BY created_at DESC LIMIT 10;

# Count attempts by phone number in last 15 minutes
SELECT phone_number, COUNT(*) as attempts, 
       SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful
FROM login_attempts 
WHERE created_at > NOW() - INTERVAL '15 minutes'
GROUP BY phone_number;
```

---

## Frontend Testing

### 1. Test Login Form UI

Go to `http://localhost:3000/login` and verify:
- ✅ Phone number field visible
- ✅ Authentication method selector (Password vs PIN)
- ✅ Password field shows/hides password
- ✅ PIN field shows 4-digit indicator circles
- ✅ PIN field filters to only digits
- ✅ Error messages display properly
- ✅ Loading state shows "Authenticating..."

### 2. Test Password Login Flow

1. Enter phone: 1234567890
2. Select "Password" method
3. Enter password: ValidPass123
4. Click Sign In
5. Verify redirected to dashboard
6. Check localStorage has: access_token, refresh_token, user_id, user_type

### 3. Test PIN Login Flow

1. Enter phone: 5555555555
2. Select "4-Digit PIN" method
3. Enter PIN: 2847
4. Click Sign In
5. Verify redirected to dashboard
6. Check localStorage has tokens

### 4. Test Error Handling

1. Try login with wrong password
2. Verify error message displays
3. Try login with wrong PIN
4. Verify error message displays
5. Try login with invalid phone
6. Verify error message displays

### 5. Test Method Switching

1. Start with "Password" method
2. Switch to "PIN" method
3. Verify password field disappears
4. Verify PIN field appears
5. Verify PIN indicator circles show
6. Switch back to Password
7. Verify PIN field disappears

---

## Troubleshooting

### Issue: "generate_password_hash is not defined"
**Solution**: Already fixed in the code - uses bcrypt consistently

### Issue: "LoginAttempt not found"
**Solution**: Run migration:
```bash
cd backend
python -m flask db upgrade
```

### Issue: Tokens show in frontend but login fails
**Solution**: Check that backend returns `access_token` not `token` (fixed)

### Issue: Rate limiting not working
**Solution**: Ensure LoginAttempt table exists and check IP address tracking

---

## Security Checklist

- ✅ Passwords hashed with bcrypt (not stored in plain text)
- ✅ PINs hashed with bcrypt
- ✅ Weak PINs rejected (0000, 1111, 1234, etc.)
- ✅ Password strength enforced (min 8 chars, uppercase, digit)
- ✅ Rate limiting implemented (5 attempts per 15 min)
- ✅ Phone number validation
- ✅ User existence check on token refresh
- ✅ Clear authentication error messages (no user existence leak)
- ✅ JWT tokens used for API authentication
- ✅ Tokens stored in localStorage
- ⚠️ TODO: Add HTTPS enforcement in production
- ⚠️ TODO: Add CSRF tokens for form submissions
- ⚠️ TODO: Implement password reset flow
- ⚠️ TODO: Add 2FA support

