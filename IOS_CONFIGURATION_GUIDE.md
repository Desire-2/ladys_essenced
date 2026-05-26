# iOS Configuration Guide for Lady's Essence

## Prerequisites for macOS

### Required Tools
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# Verify installation
xcode-select --print-path
pod --version
```

### System Requirements
- **macOS**: 12.0 or later
- **Xcode**: 14.0 or later
- **iOS Deployment Target**: 13.0 minimum
- **Swift**: 5.7 or later

## Project Structure
```
ios/
├── App/
│   ├── App.xcworkspace/           # Workspace (OPEN THIS)
│   ├── App.xcodeproj/             # Project (DO NOT OPEN)
│   ├── Podfile                    # CocoaPods dependencies
│   ├── Podfile.lock               # Locked pod versions
│   ├── Pods/                      # CocoaPods dependencies
│   ├── App/
│   │   ├── Info.plist             # App configuration & permissions
│   │   ├── AppDelegate.swift      # App lifecycle
│   │   ├── SceneDelegate.swift    # Scene lifecycle
│   │   ├── Assets.xcassets/       # Icons, images
│   │   ├── LaunchScreen.storyboard
│   │   └── Base.lproj/
│   │       └── Main.storyboard
│   ├── App.entitlements           # App capabilities/entitlements
│   └── unit_tests/
├── Podfile
└── Podfile.lock
```

## Opening Xcode Project

⚠️ **IMPORTANT**: Always open `App.xcworkspace`, NOT `App.xcodeproj`

```bash
cd frontend/ios/App
open App.xcworkspace  # Correct! Opens workspace with pods
# NOT: open App.xcodeproj  # Wrong! Won't have dependencies
```

## Permissions Configuration (Info.plist)

Edit `ios/App/App/Info.plist` to add required permissions:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Location Permissions -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Location helps us provide health recommendations tailored to your area and connect with nearby health providers</string>
    
    <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
    <string>Location helps us provide health recommendations tailored to your area</string>
    
    <key>NSLocationAlwaysUsageDescription</key>
    <string>Location helps us provide health recommendations</string>
    
    <!-- Camera Permissions -->
    <key>NSCameraUsageDescription</key>
    <string>Camera is used to capture your profile picture for your health profile</string>
    
    <!-- Photo Library Permissions -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Photo library access allows you to upload health records and profile pictures</string>
    
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>We'd like to save health reports to your photo library</string>
    
    <!-- Health Kit (if using) -->
    <key>NSHealthSharingUsageDescription</key>
    <string>Lady's Essence can read your health data to provide better insights</string>
    
    <key>NSHealthUpdateUsageDescription</key>
    <string>Lady's Essence can save your health data to Apple Health</string>
    
    <!-- Microphone (if audio features added) -->
    <key>NSMicrophoneUsageDescription</key>
    <string>Microphone is used for audio consultations with health providers</string>
    
    <!-- Calendar (if appointment features added) -->
    <key>NSCalendarsUsageDescription</key>
    <string>Calendar access allows you to sync appointments with your device calendar</string>
    
    <!-- Contacts (if emergency contact needed) -->
    <key>NSContactsUsageDescription</key>
    <string>Contacts access helps you quickly share health data with trusted contacts</string>
    
    <!-- Standard Configuration -->
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Lady's Essence</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    
    <!-- Network Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSExceptionDomains</key>
        <dict>
            <!-- Allow localhost for development -->
            <key>localhost</key>
            <dict>
                <key>NSIncludesSubdomains</key>
                <true/>
                <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
                <true/>
            </dict>
            <!-- Production domain -->
            <key>api.ladysessence.com</key>
            <dict>
                <key>NSIncludesSubdomains</key>
                <true/>
                <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
                <false/>
            </dict>
        </dict>
    </dict>
</dict>
</plist>
```

## Capabilities & Entitlements

### Enable Push Notifications

1. In Xcode, select **App** target
2. Go to **Signing & Capabilities** tab
3. Click **+ Capability**
4. Add **Push Notifications**
5. Add **Remote Notifications** (Background Modes)

This creates/updates `App.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>aps-environment</key>
    <string>production</string>
    
    <key>com.apple.developer.usernotifications.filtering</key>
    <true/>
</dict>
</plist>
```

### Other Useful Capabilities
- **HealthKit**: For health data integration
- **HomeKit**: If smart health devices needed
- **SiriKit**: For voice commands
- **App Groups**: For sharing data between apps/extensions
- **Wallet**: For health cards/passes

## Signing & Code Signing

### Development Signing

1. In Xcode, select **App** target
2. Go to **Signing & Capabilities** tab
3. Under **Signing** section:
   - **Team**: Select your Apple Developer Team
   - **Bundle Identifier**: `com.ladysessence.mobile`
   - Xcode auto-generates provisioning profiles

### Production Signing (App Store)

1. Ensure you're in a Developer/Organization account
2. Create App Store provisioning profile:
   - Go to developer.apple.com
   - Certificates, IDs & Profiles → Provisioning Profiles
   - Create new "App Store" profile
3. In Xcode:
   - **Team**: Select your Organization
   - **Build Configuration**: Release
   - **Provisioning Profile**: Select the App Store profile

## Building & Archiving

### Build for Simulator (Testing)
```bash
cd frontend/ios/App

xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -derivedDataPath build \
  -arch x86_64 \
  -sdk iphonesimulator

# Or from Xcode: Select simulator, press Cmd+R
```

### Build for Device (Testing)
```bash
xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -derivedDataPath build \
  -arch arm64 \
  -sdk iphoneos
```

### Create Archive (App Store Release)
```bash
xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive

# Or from Xcode:
# 1. Select "Any iOS Device (arm64)" from device selector
# 2. Product → Archive
# 3. In Organizer: Distribute App → App Store Connect
```

### Export IPA
```bash
xcodebuild \
  -exportArchive \
  -archivePath build/App.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/ipa

# ExportOptions.plist for App Store:
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
</dict>
</plist>
```

## Submitting to App Store

### Preparation Checklist
- [ ] App displays correctly on all iPhones
- [ ] All features work without errors
- [ ] Permissions prompts appear correctly
- [ ] Test on both dark and light modes
- [ ] Test on iOS versions 13-latest
- [ ] Comply with App Store Review Guidelines
- [ ] Add app privacy policy
- [ ] Configure app screenshots for App Store listing

### Steps to Submit

1. **Create App on App Store Connect**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Apps → Create App
   - Bundle ID: `com.ladysessence.mobile`

2. **Fill App Information**
   - Privacy Policy: URL
   - Contact Email
   - Support URL
   - Marketing URL

3. **Add App Listing**
   - Name: "Lady's Essence"
   - Subtitle: "Women's Health Companion"
   - Keywords: health, women, cycle, pregnancy, wellness
   - Description: Full feature description
   - Support URL, Marketing URL
   - Category: Health & Fitness

4. **Add Screenshots**
   - 5-8 screenshots per device (iPhone, iPad if applicable)
   - Recommended sizes:
     - iPhone 14 Pro Max: 1284x2778 px
     - iPhone SE: 1242x2208 px
   - Use mockups/screenshots from app

5. **Add Preview Video** (Optional)
   - 15-30 second video of app features
   - Format: MP4 or MOV

6. **Upload Build**
   - Xcode → Organizer → App.xcarchive → Distribute App
   - Select "App Store Connect"
   - Upload will be validated

7. **Submit for Review**
   - In App Store Connect: Build → Release
   - Fill build information
   - Submit for Review

### Review Guidelines
Main things Apple checks:
- **Functionality**: App must work as described
- **Privacy**: Explain all data collection
- **Permissions**: Must justify all permission requests
- **Content**: No offensive, inappropriate content
- **Performance**: No crashes or performance issues
- **UI/UX**: Follows Apple Human Interface Guidelines

Typical review time: 24-48 hours

## Debugging

### Enable Console Logging
```swift
// AppDelegate.swift
import os.log

let log = OSLog(subsystem: "com.ladysessence.mobile", category: "app")
os.log("App initialized", log: log)
```

### View Logs
1. Open **Console.app** (Spotlight → Console)
2. Filter by app name: "Lady's Essence"
3. Run app and view real-time logs

### Debug with Xcode
```bash
# In Xcode:
# 1. Click Play button to build and run
# 2. Set breakpoints (click line numbers)
# 3. Use Debug navigator (Cmd+6) to inspect variables
# 4. Use console (Cmd+Shift+C) for LLDB commands
```

### Common Issues

**Issue**: "Could not find a signing identity matching 'iPhone Distribution'"
```bash
# Regenerate provisioning profiles:
# developer.apple.com → Certificates, IDs & Profiles
# Recreate Distribution profile
```

**Issue**: Pod dependency conflicts
```bash
cd ios/App
rm -rf Pods Podfile.lock
pod install
```

**Issue**: App crashes on launch
1. Check console logs (Console.app)
2. Check Xcode debugger
3. Verify Info.plist permissions
4. Check bundle identifier matches

## App Thinning

Apple automatically provides:
- **Bitcode slicing**: Only device-specific code
- **On-Demand Resources**: Download features as needed
- **App Clips**: Small app previews

To support:
- Keep images in Assets.xcassets (auto-optimized)
- Use PDFs for vector graphics
- Enable Bitcode (Xcode default)

## Performance Tips

- **Use LazyVStack** for long lists
- **Lazy load images** with AsyncImage
- **Cache API responses** locally
- **Use BackgroundTasks** for sync
- **Profile with Instruments**: Xcode → Product → Profile

## References
- [Apple Developer Documentation](https://developer.apple.com/documentation)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [TestFlight Guide](https://developer.apple.com/testflight/)
