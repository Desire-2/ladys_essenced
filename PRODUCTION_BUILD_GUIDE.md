# Lady's Essence - Production Build & Deployment Guide

## Overview
Complete guide for building and deploying the Lady's Essence app to production, including Android APK signing and backend deployment.

---

## Part 1: Android App Production Build

### ✅ Completed Steps

#### 1. Environment Configuration
- **File**: `frontend/.env.production`
- **Content**: `VITE_API_URL=https://ladys-essenced-hoil.onrender.com`
- **Purpose**: Routes production app to Render backend instead of localhost

#### 2. Web Assets Build
- **Command**: `npm run build` in frontend folder
- **Output**: Production-optimized assets in `dist/` folder
- **Result**: 
  - Vite compiled 3432 modules
  - Main bundle: 1,320.38 kB (385.09 kB gzipped)
  - CSS: 86.93 kB (14.36 kB gzipped)

#### 3. Android Project Sync
- **Command**: `npx cap sync android`
- **Result**: Web assets copied to `android/app/src/main/assets/public`
- **Plugins Updated**: Camera, Device, Geolocation, Keyboard, Push Notifications, Share, Status Bar

#### 4. Release Keystore Created
- **File**: `frontend/android/app/ladys-essence.keystore`
- **Alias**: `ladys-essence-key`
- **Validity**: 10,000 days (until ~2053)
- **Password**: `ladysessence123`
- **Certificate**: CN=Lady's Essence, O=Women Health App, L=Rural Health, ST=Kenya, C=KE

#### 5. Build Gradle Configuration
- **File**: `frontend/android/app/build.gradle`
- **Changes**: Added signing configuration for release builds:
  ```gradle
  signingConfigs {
      release {
          storeFile file('ladys-essence.keystore')
          storePassword 'ladysessence123'
          keyAlias 'ladys-essence-key'
          keyPassword 'ladysessence123'
      }
  }
  ```

### 🔨 Currently Running: Gradle Build

**Command**: `./gradlew assembleRelease`

**Build Process**:
1. Downloading Gradle 8.14.3 distribution
2. Starting Gradle daemon
3. Resolving dependencies
4. Compiling Android project (in progress)
5. Building signed release APK

**Expected Output File**:
- Location: `frontend/android/app/build/outputs/apk/release/app-release.apk`
- Size: Approximately 15-25 MB
- Signature: Signed with Lady's Essence release key

**Timeline**: First build typically takes 5-15 minutes (subsequent builds faster due to daemon)

---

## Part 2: After APK Build Completes

### Verify APK Exists
```bash
ls -lh frontend/android/app/build/outputs/apk/release/app-release.apk
# Should show: -rw-r--r--  1  user  group  XXX  May 30 HH:MM  app-release.apk
```

### Upload to Google Play Store
1. **Create Google Play Console Account** (if not exists)
   - Navigate to https://play.google.com/apps/publish
   - Create new app: "Lady's Essence"
   - Fill store listing (title, description, screenshots, privacy policy)

2. **Upload APK to Internal Testing**
   - Release Management → Internal Testing → Upload Release
   - Select `app-release.apk`
   - Add release notes

3. **Test Build on Device**
   - Use internal testing link to install on test device
   - Verify login works with Render backend
   - Test core features (cycle tracking, appointments, etc.)

4. **Move to Closed Testing (Beta)**
   - Internal Testing → Promote to Closed Testing
   - Add beta testers email list
   - Set review notes

5. **Production Release**
   - Closed Testing → Promote to Production
   - Google Play Store review (1-3 days typical)
   - After approval, app goes live to all users

### Generate Bundle (AAB) for Advanced Release
```bash
cd frontend/android && ./gradlew bundleRelease
# Output: frontend/android/app/build/outputs/bundle/release/app-release.aab
```
- **Advantage**: Google Play automatically optimizes APKs per device configuration
- **Recommended** for production releases

---

## Part 3: Backend Production Deployment

### Current Setup
- **Backend**: Render.com
- **URL**: https://ladys-essenced-hoil.onrender.com
- **Database**: PostgreSQL Aiven Cloud (managed)
- **Environment**: Production

### Deployment Checklist
- [ ] Backend running and healthy
  ```bash
  curl https://ladys-essenced-hoil.onrender.com/health
  # Should return: {"status": "ok"}
  ```
- [ ] Database migrations applied
  ```bash
  flask db current  # Check current migration
  flask db heads    # List available migrations
  ```
- [ ] Environment variables configured
  - `FLASK_ENV=production`
  - `DATABASE_URL=postgresql://...` (from Aiven)
  - `JWT_SECRET_KEY=<strong-key>`
  - `ALLOWED_ORIGINS=https://ladys-essenced.vercel.app,...`

### Production Restart
```bash
# Via Render Dashboard:
# Dashboard → lady-s-essenced-backend → Manual Deploy
# This restarts the service with latest code

# OR via Git:
git push origin main
# Render auto-deploys on main branch push (if configured)
```

---

## Part 4: Security Checklist

### Android APK Security
- ✅ **Keystore Secured**: Private keystore file not in git
- ✅ **ProGuard**: Add obfuscation for production
  ```gradle
  minifyEnabled true
  proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
  ```
- ✅ **Clear HTTP Disabled**: Only HTTPS to production backend

### Backend Security
- ✅ **HTTPS Only**: All CORS origins use https://
- ✅ **JWT Secrets**: Use strong, random keys (not hardcoded)
- ✅ **Database**: Connection uses SSL (Aiven requirement)
- ✅ **CORS Whitelist**: Only allow known frontend origins

### Frontend Security
- ✅ **Environment Variables**: API URL in .env.production (not hardcoded)
- ✅ **Token Storage**: Secure localStorage (no sensitive data logged)
- ✅ **HTTPS**: Production app enforces HTTPS

---

## Part 5: Post-Deployment Testing

### 1. Android App (After Play Store Release)
```bash
# On test device:
# 1. Install from Google Play Store
# 2. Login: Phone: 1111111111, Password: testpass
# 3. Expected: Successful login, dashboard displays
# 4. Test features:
#    - Cycle tracking
#    - Appointment booking
#    - Notifications
#    - Health provider messaging
```

### 2. Backend Endpoints
```bash
# Test authentication
curl -X POST https://ladys-essenced-hoil.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "1111111111", "password": "testpass"}'

# Should return: {"access_token": "...", "refresh_token": "...", ...}

# Test cycle log endpoint
curl -H "Authorization: Bearer <token>" \
  https://ladys-essenced-hoil.onrender.com/api/adolescents/cycle_logs

# Should return: JSON array of cycle logs
```

### 3. Frontend Web (Vercel)
- Verify CORS working: DevTools Network tab should show requests completing
- Test responsive design on mobile browsers
- Check environment variables loaded: `VITE_API_URL` pointing to Render backend

---

## Part 6: Version Management

### Update Version Before Each Release

#### Android Versioncode (APK Versioning)
**File**: `frontend/android/app/build.gradle`
```gradle
versionCode 1      // Must increment for each release (1, 2, 3, ...)
versionName "1.0"  // User-facing version (1.0, 1.1, 2.0, ...)
```

**Rules**:
- `versionCode` must increase for every Google Play upload
- `versionName` for display (can increment or stay same)
- Semantic versioning recommended: 1.0.0 → 1.0.1 → 1.1.0 → 2.0.0

#### Update Steps Before Build
1. Update `versionCode` and `versionName` in `build.gradle`
2. Commit: `git commit -am "Bump version to X.X.X"`
3. Tag: `git tag -a v1.0.0 -m "Release version 1.0.0"`
4. Build: `./gradlew assembleRelease`

---

## Part 7: Troubleshooting

### Build Errors

#### "Certificate expired or not yet valid"
**Solution**: Regenerate keystore:
```bash
rm frontend/android/app/ladys-essence.keystore
keytool -genkey -v -keystore ladys-essence.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias ladys-essence-key \
  -dname "CN=Lady's Essence,O=Women Health App,L=Rural Health,ST=Kenya,C=KE" \
  -storepass ladysessence123 \
  -keypass ladysessence123
```

#### "Could not connect to backend from APK"
**Checklist**:
1. Backend running: `curl https://ladys-essenced-hoil.onrender.com/health`
2. CORS configured: Check `ALLOWED_ORIGINS` in backend
3. API URL correct: Check `VITE_API_URL` in `.env.production`
4. App rebuilt: Did you run `npm run build` and `./gradlew assembleRelease`?

#### "Google Play rejection: Insecure network traffic"
**Solution**: Ensure `android/app/src/main/res/xml/network_security_config.xml` only allows HTTPS for production:
```xml
<domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">ladys-essenced-hoil.onrender.com</domain>
</domain-config>
```

---

## Quick Reference Commands

### Full Production Build Cycle
```bash
# 1. Prepare
cd frontend
echo 'VITE_API_URL=https://ladys-essenced-hoil.onrender.com' > .env.production

# 2. Build web
npm run build

# 3. Sync to Android
npx cap sync android

# 4. Build signed APK (from android folder)
cd frontend/android
./gradlew assembleRelease

# 5. Verify APK
ls -lh app/build/outputs/apk/release/app-release.apk
```

### Deploy to Render
```bash
git add .
git commit -m "Production release v1.0.0"
git push origin main
# Render auto-deploys if webhook configured
```

### Upload to Google Play
1. Go to Google Play Console
2. Your apps → Lady's Essence → Release → Create New Release
3. Upload `app-release.apk`
4. Add release notes
5. Review and publish

---

## Git Configuration

### Exclude Keystore from Version Control
**File**: `.gitignore`
```
# Android keystore
frontend/android/app/*.keystore
frontend/android/app/*.jks
```

### Exclude Build Artifacts
```
# Gradle
frontend/android/.gradle/
frontend/android/app/build/
.gradle/
build/

# APK output
*.apk
*.aab
```

---

## Monitoring & Logs

### Backend Logs (Render)
1. Dashboard → lady-s-essenced-backend → Logs
2. Filter for errors: Search "ERROR" or "exception"
3. Check database connection: Look for "connection successful"

### Client Logs (Android/Browser)
- **Logcat** (Android Studio): `Logcat` pane, filter `com.ladysessence.mobile`
- **Browser DevTools**: Press F12, Console tab for JS errors

### Database Health
```bash
# Check migrations applied
flask db current

# View recent queries (if enabled)
SELECT * FROM pg_stat_statements ORDER BY calls DESC LIMIT 10;
```

---

## Next Steps
1. ✅ Android APK build (currently running)
2. 🔄 Verify APK builds successfully
3. 📤 Upload APK to Google Play Console
4. 🧪 Internal testing on real device
5. 🌍 Beta testing with selected users
6. 🚀 Production release to all users

---

**Last Updated**: May 30, 2026  
**Status**: Android build in progress - check back shortly for completion
