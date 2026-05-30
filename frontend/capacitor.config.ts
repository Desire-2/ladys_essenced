import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ladysessence.mobile',
  appName: "Lady's Essence",
  webDir: 'dist',
  server: {
    // Ensure we don't accidentally point to localhost in the packaged app
    url: process.env.NODE_ENV === 'production' ? undefined : process.env.CAPACITOR_SERVER_URL,
    cleartext: true, // Useful for testing, though Render uses HTTPS
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Geolocation: {
      timeout: 30000
    },
    Camera: {
      permissions: ['photos']
    },
    Keyboard: {
      resizeOnFullScreen: true,
      resize: 'native'
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#667eea'
    }
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
