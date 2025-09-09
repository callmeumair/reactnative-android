import {Platform, Linking, NativeModules} from 'react-native';
import {PERMISSIONS, request, check, RESULTS} from 'react-native-permissions';

export async function ensureLocationPermission(): Promise<boolean> {
  const perm = Platform.select({
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  });
  if (!perm) return false;
  const status = await check(perm);
  if (status === RESULTS.GRANTED) return true;
  const next = await request(perm);
  return next === RESULTS.GRANTED;
}

export async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  
  const sdkInt = Number(Platform.Version);
  if (sdkInt < 31) return true; // Android 12+ requirement
  
  try {
    // For Android 12+, check if exact alarms can be scheduled
    // This requires checking the AlarmManager.canScheduleExactAlarms() method
    const {AlarmManager} = NativeModules;
    if (AlarmManager && AlarmManager.canScheduleExactAlarms) {
      return await AlarmManager.canScheduleExactAlarms();
    }
    
    // Fallback: assume true and let the alarm scheduling handle the error
    return true;
  } catch (error) {
    console.warn('Error checking exact alarm permission:', error);
    return true; // Fallback to attempting
  }
}

export async function requestExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  
  const sdkInt = Number(Platform.Version);
  if (sdkInt < 31) return true;
  
  try {
    // For Android 12+, we need to direct users to settings
    // since there's no runtime permission dialog for exact alarms
    const canSchedule = await canScheduleExactAlarms();
    if (!canSchedule) {
      // Open the exact alarm settings
      await Linking.openSettings();
      return false; // User needs to manually grant in settings
    }
    return true;
  } catch (error) {
    console.warn('Error requesting exact alarm permission:', error);
    return false;
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  
  const status = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
  if (status === RESULTS.GRANTED) return true;
  
  const next = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
  return next === RESULTS.GRANTED;
}

