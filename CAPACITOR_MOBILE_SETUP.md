# Lady's Essence - Capacitor Mobile Setup Guide

## Overview
This project has been configured to build iOS and Android apps using Capacitor. Your existing web app (React/Vite) is now ready to be deployed as native mobile applications.

## Project Structure
```
frontend/
├── src/                    # React source code (shared between web and mobile)
├── dist/                   # Built web files (deployed to mobile)
├── android/                # Android project (Gradle-based)
│   └── app/
│       └── src/
│           └── main/
│               ├── AndroidManifest.xml
│               └── java/
├── ios/                    # iOS project (Xcode)
│   └── App/
│       ├── App.xcworkspace
│       └── Podfile
├── capacitor.config.ts     # Capacitor configuration
└── package.json            # npm scripts for mobile builds
```

## Prerequisites

### For Both Platforms
- Node.js 16+ 
- npm or yarn
- `npx cap` CLI (already installed)

### For Android Development
- **JDK 17+** (OpenJDK recommended)
- **Android SDK** with SDK version 33+
- **Android NDK** (for some plugins)
- **Android Studio** (recommended for IDE)
- Environment variables:
  ```bash
  export JAVA_HOME=/path/to/jdk
  export ANDROID_HOME=$HOME/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/33.0.0
  ```

### For iOS Development
- **macOS** (Xcode development requires Mac)
- **Xcode** 14+ with Command Line Tools
- **CocoaPods**: `sudo gem install cocoapods`
- **iOS Deployment Target**: 13.0+

## Setup Instructions

### 1. Initial Setup

```bash
cd frontend

# Install dependencies
npm install

# Build the web app
npm run build

# Sync to both platforms
npm run cap:sync
```

### 2. Environment Configuration

Create `.env.local` for development:
```env
VITE_API_URL=http://localhost:5001
CAPACITOR_SERVER_URL=http://localhost:5001
NODE_ENV=development
```

Create `.env.production` for production:
```env
VITE_API_URL=https://api.ladysessence.com
CAPACITOR_SERVER_URL=https://api.ladysessence.com
NODE_ENV=production
```

## Android Development

### Quick Start

```bash
# Open Android project in Android Studio
npm run build:android

# Or manually:
cd frontend/android
./gradlew build        # Build APK
./gradlew assembleDebug  # Debug APK
./gradlew assembleRelease # Release APK (requires signing)
```

### Building APK (Debug)
```bash
cd frontend/android
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Building AAB (Play Store Release)
```bash
cd frontend/android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

### Required Permissions (AndroidManifest.xml)
The app requires these permissions for full functionality:

```xml
<!-- Location for health data mapping -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Camera for profile pictures -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Network -->
<uses-permission android:name="android.permission.INTERNET" />
```

### Testing on Device/Emulator
```bash
# List connected devices
adb devices

# Install debug APK
adb install app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat
```

## iOS Development

### Quick Start

```bash
# Open iOS project in Xcode
npm run build:ios

# Or manually:
cd frontend/ios/App
open App.xcworkspace  # Use .xcworkspace, NOT .xcodeproj
```

### Building from Command Line
```bash
cd frontend/ios/App

# Build for simulator
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -derivedDataPath build \
  -arch x86_64

# Build for device
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -derivedDataPath build \
  -arch arm64 \
  CODE_SIGN_IDENTITY="iPhone Developer"
```

### Required Permissions (Info.plist)
The app requires these permissions:

```xml
<!-- Location -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location is used to provide health recommendations based on your area</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Location is used to provide health recommendations</string>

<!-- Camera -->
<key>NSCameraUsageDescription</key>
<string>Camera is used for profile pictures</string>

<!-- Photo Library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo library access for health records</string>

<!-- Notifications -->
<key>UIRemoteNotificationTypes</key>
<array>
  <string>alert</string>
  <string>badge</string>
  <string>sound</string>
</array>
```

### Signing & Provisioning
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select "App" target
3. Go to **Signing & Capabilities** tab
4. Select your Team
5. Create provisioning profiles for Development and Release
6. Add capabilities as needed (Push Notifications, Health Kit, etc.)

### Testing on Device
```bash
# Connect iPhone via USB
# In Xcode: Select device from top toolbar
# Click Play button to build and run
# Or from CLI:
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination 'id=<device_uuid>'
```

## Native Plugins Available

### 1. Push Notifications (`@capacitor/push-notifications`)
```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Register for push notifications
await PushNotifications.requestPermissions();
await PushNotifications.register();

// Listen for notifications
PushNotifications.addListener('pushNotificationReceived', notification => {
  console.log('Notification received:', notification);
});
```

**Android Config** (AndroidManifest.xml):
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

**iOS Config** (Info.plist): Add push notification entitlements in Xcode

### 2. Geolocation (`@capacitor/geolocation`)
```typescript
import { Geolocation } from '@capacitor/geolocation';

const position = await Geolocation.getCurrentPosition();
console.log('Current position:', position.coords);
```

### 3. Camera (`@capacitor/camera`)
```typescript
import { Camera, CameraResultType } from '@capacitor/camera';

const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  resultType: CameraResultType.Base64
});
```

### 4. Device Info (`@capacitor/device`)
```typescript
import { Device } from '@capacitor/device';

const info = await Device.getId();
console.log('Device ID:', info.identifier);
```

### 5. Share (`@capacitor/share`)
```typescript
import { Share } from '@capacitor/share';

await Share.share({
  title: 'Check Lady\'s Essence',
  text: 'Health tracking app',
  url: 'https://ladysessence.app'
});
```

### 6. Keyboard (`@capacitor/keyboard`)
```typescript
import { Keyboard } from '@capacitor/keyboard';

Keyboard.addListener('keyboardWillShow', info => {
  console.log('Keyboard height:', info.keyboardHeight);
});
```

### 7. Status Bar (`@capacitor/status-bar`)
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

await StatusBar.setStyle({ style: Style.Light });
await StatusBar.setBackgroundColor({ color: '#667eea' });
```

## API Configuration

### Backend Integration
The app connects to your Flask backend (running on port 5001):

**Development** (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:5001
```

**Production** (`frontend/.env.production`):
```env
VITE_API_URL=https://api.yourdomain.com
```

Mobile apps use the same API endpoints as the web version. Token-based authentication (JWT) works identically.

## Building & Deploying

### Android: Google Play Store
1. Build release AAB:
   ```bash
   cd frontend/android
   ./gradlew bundleRelease
   ```

2. Sign the AAB:
   - Create or use existing keystore
   - Configure signing in `android/app/build.gradle`

3. Upload to Google Play Console:
   - Internal testing → Closed testing → Production

### iOS: Apple App Store
1. Build release archive:
   ```bash
   cd frontend/ios/App
   xcodebuild -workspace App.xcworkspace \
     -scheme App \
     -configuration Release \
     -archivePath build/App.xcarchive \
     archive
   ```

2. Export for distribution:
   - Open App.xcarchive in Xcode
   - "Distribute App" → "App Store Connect"

3. Upload to App Store Connect:
   - Wait for processing
   - Submit for review

## Troubleshooting

### Android

**Issue**: "Command failed: ./gradlew assembleDebug"
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

**Issue**: "Cannot find JAVA_HOME"
```bash
export JAVA_HOME=$(/usr/libexec/java_home)
```

**Issue**: API call fails on device but works on emulator
- Check `android/app/src/main/AndroidManifest.xml` for `android:usesCleartextTraffic="true"`
- For production HTTPS API, ensure certificates are valid

### iOS

**Issue**: "Pod install failed"
```bash
cd ios/App
rm -rf Pods Podfile.lock
pod install
```

**Issue**: "Code signing required"
- In Xcode: Select Team in Signing & Capabilities
- Ensure device is registered in Apple Developer Account

**Issue**: App crashes on launch
- Check Console.app for logs: Cmd+Space → Console
- Run in Xcode debugger for stack trace

## Development Workflow

### Typical Development Cycle
```bash
cd frontend

# Make changes to React components
# Edit src/ files...

# Rebuild web app
npm run build

# Sync to platforms
npm run cap:sync

# Test on Android
cd ../frontend/android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk

# Or test on iOS
cd ../frontend/ios/App
open App.xcworkspace
# Click Play in Xcode
```

### Live Reload (Development Only)
For faster development iterations, set up local server:

```bash
# Terminal 1: Start dev server
cd frontend
npm run dev

# Terminal 2: Configure Capacitor to use local server
export CAPACITOR_SERVER_URL=http://192.168.1.X:3000  # Your IP
npx cap sync

# Then build and run Android/iOS
```

## Performance Optimization

### Bundle Size
The production build includes:
- React + React DOM: ~42KB
- Capacitor plugins: ~15KB
- App code: ~300KB

### Optimization Tips
1. **Code splitting**: Use dynamic `import()` for routes
2. **Lazy load components**: Use React.lazy()
3. **Optimize images**: Compress before including in app
4. **Remove console logs**: Enabled in production build

### App Size Estimates
- **Android APK**: ~50MB (compressed)
- **iOS IPA**: ~80MB (compressed)

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Documentation](https://developer.android.com/studio/docs)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

## Support

For issues or questions:
1. Check Capacitor docs: https://capacitorjs.com
2. Review platform-specific logs (adb logcat / Xcode Console)
3. Check native plugin documentation for permission issues
