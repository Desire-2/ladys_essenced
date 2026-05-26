# Lady's Essence - Capacitor Mobile Development Quick Reference

## Quick Start (5 minutes)

### 1. Initial Setup
```bash
# Navigate to project
cd /home/desire/My_Project/Client_Project/ladys_essenced

# Make build script executable
chmod +x mobile-build.sh

# Run setup
./mobile-build.sh setup
```

### 2. Build Web App
```bash
cd frontend
npm run build
```

### 3. Choose Your Platform

#### Android Development (Linux/Mac/Windows)
```bash
cd frontend
npm run build:android    # Opens Android Studio
# OR
npm run sync:android && cd android && ./gradlew assembleDebug
```

#### iOS Development (macOS only)
```bash
cd frontend
npm run build:ios        # Opens Xcode
# OR
npm run sync:ios && cd ios/App && open App.xcworkspace
```

## Useful npm Scripts

```bash
# In frontend/ directory

npm run dev                  # Development web server (port 3000)
npm run build               # Build web app for production
npm run build:web           # Build web + sync to platforms
npm run build:android       # Build web + open Android
npm run build:ios           # Build web + open iOS
npm run sync:android        # Sync web files to Android
npm run sync:ios            # Sync web files to iOS
npm run cap:sync            # Sync to all platforms
npm run cap:add:android     # Add Android platform
npm run cap:add:ios         # Add iOS platform
```

## Project Architecture

```
frontend/                        # React + Vite + Capacitor
├── src/                         # React source code
├── dist/                        # Built web app (deployed to mobile)
├── android/                     # Android project
├── ios/                         # iOS project
├── capacitor.config.ts          # Capacitor config
└── package.json                 # npm scripts

backend/                         # Flask API
├── run.py                       # Start server (port 5001)
└── app/
    ├── models/                  # Database models
    └── routes/                  # API endpoints
```

## API Configuration

### Development
```bash
# Backend (Terminal 1)
cd backend
python run.py                       # Runs on http://localhost:5001

# Frontend (Terminal 2)
cd frontend
npm run dev                         # Runs on http://localhost:3000

# Mobile simulator/device connects to localhost:5001
# or configure API_URL in environment
```

### Production
Update `frontend/.env.production`:
```env
VITE_API_URL=https://api.yourdomain.com
```

## Native Plugins Guide

### Push Notifications
```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Request permission and register
await PushNotifications.requestPermissions();
await PushNotifications.register();

// Listen for notifications
PushNotifications.addListener(
  'pushNotificationReceived',
  (notification) => console.log('Received:', notification)
);
```

### Geolocation
```typescript
import { Geolocation } from '@capacitor/geolocation';

const position = await Geolocation.getCurrentPosition();
console.log('Lat:', position.coords.latitude);
console.log('Lng:', position.coords.longitude);
```

### Camera
```typescript
import { Camera, CameraResultType } from '@capacitor/camera';

const photo = await Camera.getPhoto({
  quality: 90,
  resultType: CameraResultType.Base64
});
console.log('Photo:', photo.base64String);
```

### Device Info
```typescript
import { Device } from '@capacitor/device';

const info = await Device.getId();
console.log('Device ID:', info.identifier);

const details = await Device.getInfo();
console.log('Platform:', details.platform); // 'ios', 'android', or 'web'
```

## Debugging

### Android Debugging
```bash
# View real-time logs
adb logcat | grep "ladysessence"

# Install APK on device
adb install app/build/outputs/apk/debug/app-debug.apk

# View app screens
adb shell screencap -p > screenshot.png
```

### iOS Debugging
```bash
# View Console logs
open /Applications/Utilities/Console.app

# Search for: "Lady's Essence"

# In Xcode:
# 1. Open ios/App/App.xcworkspace
# 2. Click Play to build and run
# 3. Use Xcode debugger for breakpoints
```

## Building for Release

### Android Play Store
```bash
cd frontend/android

# Build release AAB
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
# Upload to Google Play Console
```

### iOS App Store
```bash
cd frontend/ios/App

# Create archive
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive

# Export for App Store
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/ipa

# Upload via App Store Connect
```

## File Structure Reference

```
frontend/
├── src/
│   ├── App.tsx                          # Main app component
│   ├── main.tsx                         # Entry point
│   ├── services/
│   │   ├── api.ts                       # API client
│   │   └── capacitorPlugins.ts          # NEW: Native plugin initialization
│   ├── stores/                          # Zustand state management
│   ├── hooks/                           # Custom React hooks
│   ├── components/                      # Reusable components
│   ├── pages/                           # Route pages
│   └── types/                           # TypeScript types
│
├── android/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml      # Permissions
│   │   │   └── java/
│   │   └── build.gradle                 # Build config
│   └── build.gradle                     # Project config
│
├── ios/
│   └── App/
│       ├── App.xcworkspace/             # OPEN THIS in Xcode
│       ├── App/
│       │   ├── Info.plist               # Permissions
│       │   ├── App.entitlements         # Capabilities
│       │   └── Assets.xcassets/         # Icons
│       ├── Podfile                      # CocoaPods deps
│       └── Pods/                        # Dependencies
│
├── capacitor.config.ts                  # Capacitor config
├── package.json                         # npm scripts
├── vite.config.ts                       # Vite build config
└── tsconfig.json                        # TypeScript config
```

## Environment Variables

### Development (.env.local)
```env
VITE_API_URL=http://localhost:5001
CAPACITOR_SERVER_URL=http://localhost:5001
NODE_ENV=development
VITE_DEBUG_MODE=true
```

### Production (.env.production)
```env
VITE_API_URL=https://api.ladysessence.com
CAPACITOR_SERVER_URL=https://api.ladysessence.com
NODE_ENV=production
VITE_DEBUG_MODE=false
```

## Common Commands Cheatsheet

```bash
# Setup & Build
npm install                 # Install dependencies
npm run build              # Build web app
npm run cap:sync           # Sync to all platforms

# Android
npm run build:android      # Build & open Android Studio
./gradlew assembleDebug    # Build APK
./gradlew bundleRelease    # Build AAB for Play Store
adb install app/build/...  # Install on device
adb logcat                 # View logs

# iOS (macOS only)
npm run build:ios          # Build & open Xcode
open App.xcworkspace       # Open in Xcode
xcodebuild archive         # Create archive for App Store

# Development
npm run dev                # Start dev server
npm run lint               # Run linter

# Cleanup
npm run clean              # Remove build artifacts
./gradlew clean            # Android clean
rm -rf build Pods          # iOS clean
```

## Permission Requirements

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### iOS (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<key>NSLocationWhenInUseUsageDescription</key>
<key>NSPhotoLibraryUsageDescription</key>
```

## App Store Submission Checklist

### Android (Google Play)
- [ ] App builds successfully
- [ ] All features tested on real devices
- [ ] Minimum API level: 21
- [ ] Target API level: 33+
- [ ] Privacy policy URL configured
- [ ] Screenshots uploaded (2 MB max)
- [ ] Feature graphic (1024x500 PNG)
- [ ] App icon (512x512 PNG)
- [ ] Generate release keystore
- [ ] Build AAB for submission

### iOS (App Store)
- [ ] App builds successfully
- [ ] All features tested on real devices
- [ ] Minimum iOS: 13.0
- [ ] Screenshots (1284x2778 for Pro Max)
- [ ] Preview video (optional)
- [ ] Privacy policy URL configured
- [ ] Sign with Development/Distribution cert
- [ ] Create archive and validate
- [ ] Submit for review

## Performance Targets

- **Android APK**: < 60 MB
- **iOS IPA**: < 100 MB
- **Startup time**: < 3 seconds
- **API response**: < 500 ms
- **Bundle size**: < 400 KB (JS)

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Xcode Documentation](https://developer.apple.com/xcode/)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Google Play Console Help](https://support.google.com/googleplay)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

## Support & Troubleshooting

See detailed guides:
- [CAPACITOR_MOBILE_SETUP.md](./CAPACITOR_MOBILE_SETUP.md) - Complete setup guide
- [ANDROID_CONFIGURATION_GUIDE.md](./ANDROID_CONFIGURATION_GUIDE.md) - Android-specific config
- [IOS_CONFIGURATION_GUIDE.md](./IOS_CONFIGURATION_GUIDE.md) - iOS-specific config

## Next Steps

1. ✅ Capacitor initialized and configured
2. ✅ Android and iOS platforms added
3. ✅ Native plugins installed
4. 📝 Configure signing keys for Play Store & App Store
5. 📝 Add Firebase for push notifications
6. 📝 Test on real devices
7. 📝 Submit for app store review
