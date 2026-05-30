# Android Login Fix - Testing Guide

## Problem Identified & Fixed ✅

**Issue**: Android app returned "credentials incorrect" while web app worked fine
**Root Cause**: `frontend/src/lib/axios.ts` was forcing the production Render backend for all mobile apps
**Database Mismatch**: Android was connecting to Render backend while credentials were in local dev backend

## Changes Made

### 1. Updated `frontend/src/lib/axios.ts` (Lines 1-37)
- **Before**: Hardcoded `isMobile` detection forcing Render backend
- **After**: Smart URL detection that:
  - Uses `VITE_API_URL` if provided (highest priority)
  - Detects Capacitor app vs web
  - For Android emulator development: uses `10.0.2.2:5001` (host machine)
  - For production: falls back to Render backend
  - Includes debug logging for troubleshooting

### 2. Updated `frontend/.env`
```env
VITE_API_URL=http://10.0.2.2:5001
```
- `10.0.2.2` = Android emulator's way to reference host machine
- `5001` = Flask backend development port

### 3. Created `frontend/android/app/src/main/res/xml/network_security_config.xml`
- Allows cleartext (HTTP) traffic to `10.0.2.2` for development
- Android 9+ blocks HTTP by default, this config enables it for localhost

### 4. Updated `frontend/android/app/src/main/AndroidManifest.xml`
- Referenced network security config: `android:networkSecurityConfig="@xml/network_security_config"`

### 5. Rebuilt and Synced ✅
```bash
npm run build:web
# Automatically synced to android/ and ios/ directories
```

---

## Testing Steps

### Prerequisites
1. **Backend running** on local machine (port 5001):
   ```bash
   cd backend
   python run.py
   # You should see: "Running on http://127.0.0.1:5001"
   ```

2. **Android Emulator running**:
   - Open Android Studio
   - Tools → Device Manager → Create/Start emulator (API 33+)
   - Or connect a real Android device (see below)

### Option A: Android Emulator (Easiest for Development)

1. **Open Android project in Android Studio**:
   ```bash
   npm run build:android
   # Or: cd frontend/android && open -a "Android Studio" .
   ```

2. **Build and run**:
   - Android Studio → Build → Build and Run
   - Or: `./gradlew installDebug` in `frontend/android/`

3. **Test login**:
   - App should open on emulator
   - Use credentials: 
     - Username: `1111111111` (or any test user)
     - Password: `testpass`
   - Should connect to `http://10.0.2.2:5001` (your local backend)
   - ✅ Login should succeed now

4. **Verify API connection** (Android Studio logcat):
   - Look for: `🚀 API Target: http://10.0.2.2:5001/api`
   - Look for: `📲 Is Capacitor: true`
   - Look for: `🎯 Environment: development`

### Option B: Real Android Device (On Same Network)

1. **Find your machine's local IP**:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Example output: inet 192.168.1.100
   ```

2. **Update `.env` for your device**:
   ```env
   VITE_API_URL=http://192.168.1.100:5001
   ```

3. **Rebuild**:
   ```bash
   npm run build:web
   ```

4. **Connect device via USB** or WiFi to Android Studio

5. **Test login** with same credentials

---

## Troubleshooting

### "Still getting credentials incorrect"

1. **Verify backend is running**:
   ```bash
   curl -X GET http://localhost:5001/health
   # Should return: {"status":"OK"}
   ```

2. **Check logcat for actual error** (Android Studio):
   ```
   Ctrl+6 (or Cmd+6) → Logcat tab
   Search for: "401" or "401: Unauthorized" or "credentials"
   ```

3. **Verify API URL in app** (Android Studio logcat):
   ```
   Logcat → Filter for "🚀 API Target"
   Should show: http://10.0.2.2:5001/api
   ```

4. **Test API directly from emulator**:
   ```bash
   # From Android Studio terminal
   adb shell
   curl -X POST http://10.0.2.2:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"phone_number":"1111111111","password":"testpass"}'
   ```

### Network Connection Failed

- **If using real device**: Ensure device and machine are on same WiFi network
- **If using emulator**: Ensure Android Studio is running and emulator is fully started
- **Check firewall**: Ensure port 5001 is open on your machine

### CORS Error

- **Check backend CORS config** (`backend/app/__init__.py`):
  ```python
  # Should include localhost or your IP
  CORS(app, origins=[...])
  ```

---

## Next Steps

1. ✅ **Test Android login** with these fixes
2. **If successful**: Repeat for iOS (if on macOS)
3. **If still failing**: Check Android Studio logcat for specific error
4. **For production**: Update `.env` to use Render backend URL

---

## Quick Reference Commands

```bash
# Full rebuild and sync
npm run build:web

# Open Android in Android Studio
npm run build:android

# Open iOS in Xcode
npm run build:ios

# Sync only Android
npm run sync:android

# Sync only iOS
npm run sync:ios

# Check backend health
curl http://localhost:5001/health
```

---

## Database Note

The test account exists on your **local backend** (`localhost:5001`):
- Phone: `1111111111`
- Password: `testpass`

If credentials still fail, verify the account exists in your local database by checking the backend logs or using the debug script.
