/**
 * Capacitor Plugins Initialization
 * This file initializes all native Capacitor plugins for the mobile app
 * Web version can ignore these safely
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation, GeolocationOptions } from '@capacitor/geolocation';
import { Camera, CameraOptions, CameraResultType } from '@capacitor/camera';
import { Device } from '@capacitor/device';
import { Share } from '@capacitor/share';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';

const platform = Capacitor.getPlatform();
const isNative = platform === 'ios' || platform === 'android';

/**
 * Initialize all Capacitor plugins
 * Call this once when app starts
 */
export async function initializeCapacitorPlugins() {
  if (!isNative) {
    console.log('Running on web, Capacitor plugins disabled');
    return;
  }

  console.log(`Initializing Capacitor plugins for ${platform}`);

  try {
    // Initialize Status Bar
    await initializeStatusBar();

    // Initialize Keyboard
    await initializeKeyboard();

    // Initialize Push Notifications
    await initializePushNotifications();

    console.log('Capacitor plugins initialized successfully');
  } catch (error) {
    console.error('Error initializing Capacitor plugins:', error);
  }
}

/**
 * Status Bar Configuration
 */
async function initializeStatusBar() {
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#667eea' });
  } catch (error) {
    console.warn('Status Bar initialization failed:', error);
  }
}

/**
 * Keyboard Configuration
 */
async function initializeKeyboard() {
  try {
    // Listen for keyboard events
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });
  } catch (error) {
    console.warn('Keyboard initialization failed:', error);
  }
}

/**
 * Push Notifications Setup
 */
async function initializePushNotifications() {
  try {
    // Request permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permissions not granted');
      return;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Handle incoming notifications
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: any) => {
        console.log('Notification received:', notification);
        // Dispatch to your app's notification handler
        handleNotificationReceived(notification);
      }
    );

    // Handle notification action (tap)
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: any) => {
        console.log('Notification action performed:', notification);
        handleNotificationAction(notification);
      }
    );

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push notification registration error:', error);
    });
  } catch (error) {
    console.warn('Push notifications initialization failed:', error);
  }
}

/**
 * Handle incoming push notification
 */
function handleNotificationReceived(notification: any) {
  const { title, body, data } = notification.message;

  // You can dispatch to Redux/Context here
  console.log(`Notification: ${title} - ${body}`);

  // Store notification for later access if needed
  localStorage.setItem(
    'last_notification',
    JSON.stringify({ title, body, data, timestamp: Date.now() })
  );
}

/**
 * Handle notification tap/action
 */
function handleNotificationAction(notification: any) {
  const { data } = notification.notification;

  // Navigate based on notification data
  if (data?.screen) {
    // Use your router to navigate
    window.location.hash = `#${data.screen}`;
  }
}

/**
 * Geolocation Service
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!isNative) return null;

  try {
    const options: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 3000
    };

    const coordinates = await Geolocation.getCurrentPosition(options);
    return {
      lat: coordinates.coords.latitude,
      lng: coordinates.coords.longitude
    };
  } catch (error) {
    console.error('Geolocation error:', error);
    return null;
  }
}

/**
 * Watch location changes
 */
export function watchLocation(callback: (position: { lat: number; lng: number }) => void) {
  if (!isNative) return;

  const options: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0
  };

  Geolocation.watchPosition(options, (position: any) => {
    if (position?.coords) {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    }
  });
}

/**
 * Camera Service
 */
export async function capturePhoto(): Promise<string | null> {
  if (!isNative) return null;

  try {
    const options: CameraOptions = {
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      width: 400,
      height: 400
    };

    const photo = await Camera.getPhoto(options);
    return `data:image/${photo.format};base64,${photo.base64String}`;
  } catch (error) {
    console.error('Camera error:', error);
    return null;
  }
}

/**
 * Pick photo from gallery
 */
export async function pickPhoto(): Promise<string | null> {
  if (!isNative) return null;

  try {
    const options: CameraOptions = {
      quality: 90,
      resultType: CameraResultType.Base64,
      source: 'Photos',
      width: 400,
      height: 400
    };

    const photo = await Camera.getPhoto(options);
    return `data:image/${photo.format};base64,${photo.base64String}`;
  } catch (error) {
    console.error('Photo picker error:', error);
    return null;
  }
}

/**
 * Device Information
 */
export async function getDeviceInfo() {
  if (!isNative) return null;

  try {
    const [info, id] = await Promise.all([
      Device.getInfo(),
      Device.getId()
    ]);

    return {
      platform: info.platform,
      osVersion: info.osVersion,
      appVersion: info.appVersion,
      webViewVersion: info.webViewVersion,
      deviceId: id.identifier,
      isVirtual: info.isVirtual
    };
  } catch (error) {
    console.error('Device info error:', error);
    return null;
  }
}

/**
 * Share Content
 */
export async function shareContent(
  title: string,
  text: string,
  url?: string
): Promise<boolean> {
  if (!isNative) return false;

  try {
    const result = await Share.share({
      title,
      text,
      url: url || window.location.href,
      dialogTitle: 'Share with'
    });

    return result.activityType !== null;
  } catch (error) {
    console.error('Share error:', error);
    return false;
  }
}

/**
 * Check if running on native platform
 */
export function isRunningOnNative(): boolean {
  return isNative;
}

/**
 * Get platform type
 */
export function getPlatformType(): 'ios' | 'android' | 'web' {
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}

/**
 * Check platform-specific conditions
 */
export const platformUtils = {
  isIOS: platform === 'ios',
  isAndroid: platform === 'android',
  isWeb: !isNative,
  isNative
};

export default {
  initializeCapacitorPlugins,
  getCurrentLocation,
  watchLocation,
  capturePhoto,
  pickPhoto,
  getDeviceInfo,
  shareContent,
  isRunningOnNative,
  getPlatformType,
  platformUtils
};
