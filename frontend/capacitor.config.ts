import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ladysessence.mobile',
  appName: "Lady's Essence",
  webDir: 'dist',
  server: {
    url: process.env.CAPACITOR_SERVER_URL,
    cleartext: process.env.NODE_ENV === 'development',
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
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development'
  }
};

export default config;
