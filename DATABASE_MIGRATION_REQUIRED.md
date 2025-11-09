# Database Migration Required - URGENT

## Issue
The `login_attempts` table doesn't exist in the database, causing the rate limiting to fail.

**Error**: `psycopg2.errors.UndefinedTable: relation "login_attempts" does not exist`

## Solution

### Step 1: Stop the Flask Application
Press `Ctrl+C` in the terminal where Flask is running.

### Step 2: Apply the Database Migration

Run the following commands in the backend directory:

```bash
cd /home/desire/My_Project/ladys_essenced/backend
source venv/bin/activate
python -m flask db upgrade
```

Expected output:
```
INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade a7f9c2e3b1d4 -> b2f8e7d9c1a3, Add LoginAttempt model for authentication audit and rate limiting
```

### Step 3: Verify the Migration

Check if the table was created:

```bash
python -m flask db current
```

Expected output:
```
b2f8e7d9c1a3
```

### Step 4: Restart the Flask Application

```bash
python run.py
```

---

## How to Check if Migration Succeeded

### Option 1: Check with Flask-Migrate
```bash
python -m flask db history
```

You should see:
```
<base> -> a7f9c2e3b1d4 (head), add_pin_authentication_fields
a7f9c2e3b1d4 -> b2f8e7d9c1a3 (head), Add LoginAttempt model for authentication audit and rate limiting
```

### Option 2: Check Database Directly

If you have psql installed:
```bash
psql -U avnadmin -h pg-37c00c3-ladysessence1-f451.k.aivencloud.com:18118 -d defaultdb

# In psql, run:
\dt login_attempts
```

You should see:
```
           List of relations
 Schema |      Name       | Type  | Owner
--------+-----------------+-------+--------
 public | login_attempts  | table | avnadmin
```

---

## Alternative: If Migration Fails

### 1. Check Migration History
```bash
python -m flask db current
python -m flask db history
```

### 2. If stuck in failed transaction, restart the database connection:
```bash
python -m flask db heads
python -m flask db branches
```

### 3. Manual Fix (If Needed)

Connect to the database and check existing tables:
```sql
\dt
```

If `login_attempts` table exists but migration didn't mark as applied, run:
```bash
python -m flask db stamp b2f8e7d9c1a3
```

---

## Testing After Migration

Once migration is applied, test the login endpoint:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+250780784924",
    "password": "YourPassword123"
  }'
```

Expected response:
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

No error about undefined table = Migration successful! ✅

---

## Summary

| Step | Command | Expected Output |
|------|---------|-----------------|
| 1 | `python -m flask db upgrade` | Running upgrade a7f9c2e3b1d4 -> b2f8e7d9c1a3 |
| 2 | `python -m flask db current` | b2f8e7d9c1a3 |
| 3 | `python run.py` | Flask runs without UndefinedTable errors |

After these steps, the authentication system will work properly with rate limiting! ✅

