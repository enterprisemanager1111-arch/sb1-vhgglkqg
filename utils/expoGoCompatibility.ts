import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Utility to check if running in Expo Go
 */
export const isExpoGo = (): boolean => {
  return !Device.isDevice && Platform.OS !== 'web';
};

/**
 * Check if a native feature is available
 */
export const isFeatureAvailable = (feature: 'camera' | 'imageLibrary' | 'mediaLibrary'): boolean => {
  // In Expo Go, some features might be limited
  if (isExpoGo()) {
    switch (feature) {
      case 'camera':
        return Platform.OS !== 'web';
      case 'imageLibrary':
        return Platform.OS !== 'web';
      case 'mediaLibrary':
        return Platform.OS === 'ios' || Platform.OS === 'android';
      default:
        return false;
    }
  }
  
  // In development builds or production, assume all features are available
  return Platform.OS !== 'web';
};

/**
 * Show appropriate error message for unavailable features
 */
export const showFeatureUnavailableAlert = (feature: string) => {
  if (Platform.OS === 'web') {
    alert(`${feature} ist im Web nicht verfügbar. Verwenden Sie die mobile App.`);
  } else {
    alert(`${feature} ist in Expo Go eingeschränkt. Für volle Funktionalität erstellen Sie bitte einen Development Build.`);
  }
};