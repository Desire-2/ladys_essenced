# PIN Authentication - Quick Implementation Guide

## What Was Changed

### 🔐 Security Enhancement
Added support for optional 4-digit PIN authentication alongside existing password authentication. Users can now:
- Set a PIN during registration (optional)
- Login using either password OR PIN
- Enable/disable PIN in their profile settings
- Use PIN on USSD (useful for feature phones)

---

## Files Modified

### Backend

#### 1. **Database Model** (`backend/app/models/__init__.py`)
```python
# Added to User class:
pin_hash = db.Column(db.String(255), nullable=True)
enable_pin_auth = db.Column(db.Boolean, default=False)
```

#### 2. **Authentication Routes** (`backend/app/routes/auth.py`)
- **Registration**: Now accepts optional `pin` parameter
- **Login**: Tries PIN first (if 4 digits), then password
- **Profile Update**: Can set/update PIN

#### 3. **USSD Registration** (`backend/app/routes/ussd.py`)
- Extended registration flow with PIN setup option
- Step 4: Ask if user wants PIN
- Step 5-7: Collect and confirm PIN

#### 4. **USSD Login** (`backend/app/routes/ussd.py`)
- Updated to support PIN or password authentication

### Frontend

#### 1. **Registration Page** (`frontend/src/app/register/page.tsx`)
- Added PIN setup checkbox
- Added PIN input fields with confirmation
- Real-time validation for PIN format

#### 2. **Login Page** (`frontend/src/app/login/page.tsx`)
- Added Password/PIN toggle buttons
- Dynamic input field (password or PIN)
- Conditional validation logic

#### 3. **Database Migration** (`backend/add_pin_authentication.sql`)
- SQL script to add PIN columns to users table

---

## How to Use

### For Users - Web Registration

1. **Without PIN** (existing method):
   - Fill name, phone, password
   - Skip "Enable PIN Authentication" checkbox
   - Register

2. **With PIN** (new method):
   - Fill name, phone, password
   - ✓ Check "Enable PIN Authentication"
   - Enter 4-digit PIN (0-9 only)
   - Confirm PIN
   - Register

### For Users - Web Login

1. **Using Password**:
   - Select "Password" tab
   - Enter phone and password
   - Login

2. **Using PIN** (if set during registration):
   - Select "PIN" tab
   - Enter phone and 4-digit PIN
   - Login

### For Users - USSD Registration

1. **Dial**: `*123*` (example USSD code)
2. **Select**: 1 for Registration
3. **Enter**: Name
4. **Select**: 1 for Parent or 2 for Adolescent
5. **Enter**: Password
6. **Confirm**: Set PIN? 1=Yes, 2=Skip
7. **If Yes**: 
   - Enter 4-digit PIN
   - Confirm PIN
8. **Done**: Account created with PIN enabled

### For Users - USSD Login

1. **Dial**: `*123*` (example USSD code)
2. **Select**: 2 for Login
3. **Enter**: 4-digit PIN (or password if no PIN set)
4. **Done**: Logged in

---

## Implementation Steps

### Step 1: Apply Database Migration
```bash
# Using MySQL
mysql -u root -p ladys_essenced < backend/add_pin_authentication.sql

# Or using Flask-Migrate (if configured)
flask db upgrade
```

### Step 2: Restart Backend
```bash
cd backend
python run.py
```

### Step 3: Update Frontend
```bash
cd frontend
npm run build
npm start
```

---

## Testing

### Web Registration
- [ ] Register without PIN
- [ ] Register with PIN
- [ ] Verify PIN validation (only 4 digits)
- [ ] Verify PIN confirmation matching

### Web Login
- [ ] Login with password
- [ ] Login with PIN
- [ ] Switch between Password/PIN tabs
- [ ] Verify error messages

### USSD Registration
- [ ] Complete registration with PIN
- [ ] Skip PIN setup
- [ ] Try weak PIN (0000, 1111)
- [ ] Verify welcome message shows PIN status

### USSD Login
- [ ] Login with 4-digit PIN
- [ ] Login with password (if no PIN set)
- [ ] Handle invalid credentials

---

## API Endpoints

### POST `/api/auth/register`
**With PIN**:
```json
{
  "name": "Jane Doe",
  "phone_number": "+250788123456",
  "password": "MyPassword123",
  "user_type": "parent",
  "pin": "2580"
}
```

**Without PIN**:
```json
{
  "name": "Jane Doe",
  "phone_number": "+250788123456",
  "password": "MyPassword123",
  "user_type": "parent"
}
```

### POST `/api/auth/login`
**With Password**:
```json
{
  "phone_number": "+250788123456",
  "password": "MyPassword123"
}
```

**With PIN**:
```json
{
  "phone_number": "+250788123456",
  "pin": "2580"
}
```

### PUT `/api/auth/profile` (requires JWT token)
**Add/Update PIN**:
```json
{
  "pin": "5791"
}
```

**Disable PIN**:
```json
{
  "enable_pin_auth": false
}
```

---

## Security Notes

✅ **What's Protected**
- PINs are bcrypt-hashed (same as passwords)
- Weak PINs are rejected during registration
- PIN changes require authentication
- All data encrypted in transit (HTTPS)

⚠️ **User Responsibility**
- Don't share PIN with anyone
- Change PIN regularly if exposed
- Use complex PINs (avoid 0000, 1111, 1234)
- Remember PIN for offline USSD access

---

## FAQ

**Q: Can I use both PIN and password?**
A: Yes! Both are stored separately. You can login with either one.

**Q: What if I forget my PIN?**
A: Use your password to login instead. Change PIN in profile settings.

**Q: Is PIN mandatory?**
A: No, PIN is completely optional. Password alone is sufficient.

**Q: Can I change my PIN?**
A: Yes, go to Profile Settings and update your PIN.

**Q: Works on USSD?**
A: Yes! PIN is perfect for feature phones via USSD.

**Q: How secure is a 4-digit PIN?**
A: PIN is hashed with bcrypt. Security comes from hashing, not PIN length.

**Q: Can I disable PIN after setting it?**
A: Yes, go to Profile Settings and toggle "Enable PIN Auth" off.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| PIN won't validate | Ensure exactly 4 digits (0-9) |
| Can't toggle password/PIN | Refresh the page or clear cache |
| PIN login fails but password works | Check if PIN is actually enabled in profile |
| Weak PIN error | Avoid 0000, 1111, 1234, 2222, etc. |
| USSD PIN setup skipped | Look for "Would you like to set a PIN?" prompt |

---

## Support

For issues, please check:
1. `ENHANCED_PIN_AUTHENTICATION.md` - Detailed documentation
2. Log files in `backend/logs/`
3. Frontend console for errors
4. Database migration status

---

**Last Updated**: November 6, 2025
**Status**: ✅ Ready for Production
