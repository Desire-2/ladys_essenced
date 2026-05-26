# Android Configuration Guide for Lady's Essence

## Project Structure
```
android/
├── app/
│   ├── build.gradle                    # App build configuration
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml     # App permissions & metadata
│   │   │   ├── java/
│   │   │   │   └── com/ladysessence/
│   │   │   │       └── mobile/
│   │   │   │           └── MainActivity.java
│   │   │   ├── res/
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   ├── colors.xml
│   │   │   │   │   └── styles.xml
│   │   │   │   └── drawable/
│   │   │   │       ├── ic_launcher_foreground.png
│   │   │   │       └── ic_launcher_background.png
│   │   │   └── assets/public/          # Web app files (from dist/)
│   └── build/outputs/                  # Build output (APK/AAB)
├── gradle/
└── settings.gradle
```

## Permissions Configuration

### AndroidManifest.xml
Add required permissions based on features:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.ladysessence.mobile">

    <!-- Location Services -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    
    <!-- Camera -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- Storage (if needed) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <!-- Notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Internet -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name="com.getcapacitor.MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/app_name"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Firebase Cloud Messaging Service -->
        <service
            android:name=".services.MyMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

### Runtime Permissions
For Android 6.0+ (API 23+), request permissions at runtime:

```kotlin
// MainActivity.kt example
import android.Manifest
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    
    private val PERMISSION_REQUESTS = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.POST_NOTIFICATIONS
    )
    
    private val REQUEST_CODE = 1001
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Request permissions if needed
        requestPermissionsIfNeeded()
    }
    
    private fun requestPermissionsIfNeeded() {
        val permissionsToRequest = PERMISSION_REQUESTS.filter { permission ->
            ContextCompat.checkSelfPermission(this, permission) 
                != PackageManager.PERMISSION_GRANTED
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this, 
                permissionsToRequest.toTypedArray(),
                REQUEST_CODE
            )
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            REQUEST_CODE -> {
                for (i in permissions.indices) {
                    if (grantResults[i] == PackageManager.PERMISSION_GRANTED) {
                        Log.d("Permissions", "${permissions[i]} granted")
                    }
                }
            }
        }
    }
}
```

## Build Configuration

### app/build.gradle
```gradle
plugins {
    id 'com.android.application'
    id 'com.google.gms.google-services'
}

android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.ladysessence.mobile"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
    
    signingConfigs {
        release {
            storeFile file("../keystore.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
            minifyEnabled false
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Capacitor
    implementation 'com.getcapacitor:android:5.0.0'
    implementation 'com.getcapacitor.plugins:keyboard:5.0.0'
    implementation 'com.getcapacitor.plugins:splash-screen:5.0.0'
    
    // Firebase
    implementation platform('com.google.firebase:firebase-bom:32.0.0')
    implementation 'com.google.firebase:firebase-messaging'
    
    // AndroidX
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    
    // Testing
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
```

## Signing for Play Store

### Generate Keystore
```bash
keytool -genkey -v -keystore keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias ladysessence-key
```

### Build Signed Release
```bash
cd android

# Set environment variables
export KEYSTORE_PASSWORD="your_keystore_password"
export KEY_ALIAS="ladysessence-key"
export KEY_PASSWORD="your_key_password"

# Build
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

### Upload to Google Play Store
1. Create app on [Google Play Console](https://play.google.com/console)
2. Prepare app listing:
   - Title, short description, full description
   - Screenshots (5-8 per device type)
   - Feature graphic (1024x500 PNG)
   - Icon (512x512 PNG)
   - Privacy policy URL
3. Upload app bundle (AAB file)
4. Submit for review

## Resources & Icons

### App Icon Sizes (Required)
- **mdpi** (160 dpi): 48x48 px
- **hdpi** (240 dpi): 72x72 px
- **xhdpi** (320 dpi): 96x96 px
- **xxhdpi** (480 dpi): 144x144 px
- **xxxhdpi** (640 dpi): 192x192 px

### Generate Icons
```bash
# Using Android Studio
# Right-click res/ → New → Image Asset → select icon file
# Automatically scales to all densities
```

## Debugging

### Enable USB Debugging
1. Settings → Developer options → USB debugging
2. Allow USB debugging when prompted

### View Logs
```bash
# Connect device/emulator
adb logcat

# Filter by app
adb logcat | grep "ladysessence"

# Clear logs
adb logcat -c
```

### Debug with Android Studio
1. Open `android/` folder in Android Studio
2. Connect device/emulator
3. Run → Debug 'app'

## Performance Optimization

### Enable ProGuard/R8
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### ProGuard Rules (proguard-rules.pro)
```proguard
# Keep Capacitor plugins
-keep class com.getcapacitor.** { *; }
-keep class com.capacitor.** { *; }

# Keep app-specific classes
-keep class com.ladysessence.** { *; }

# Keep Firebase
-keep class com.google.firebase.** { *; }

# Keep Kotlin
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
```

## App Size Reduction

- **Enable shrinking**: minifyEnabled = true
- **Remove unused resources**: shrinkResources = true  
- **Vector drawables**: Use SVG instead of PNG
- **Code splitting**: Use dynamic feature modules
- **Compress assets**: Reduce image quality if possible

## Common Issues

### Issue: "android:usesCleartextTraffic" error
**Solution**: Add `android:usesCleartextTraffic="true"` in AndroidManifest.xml for development
(Remove for production with HTTPS)

### Issue: APK installation fails
```bash
# Clear app data
adb shell pm clear com.ladysessence.mobile

# Reinstall
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Issue: WebView crashes
- Update Chrome/WebView: Settings → Apps → Android System WebView → Update
- Check console logs in Android Studio
- Verify JavaScript compatibility

## References
- [Android Documentation](https://developer.android.com/docs)
- [Google Play Console Help](https://support.google.com/googleplay)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
