import PushNotification from 'react-native-push-notification';
import {Platform} from 'react-native';
import {canScheduleExactAlarms} from './permissions';

export function initNotifications(): void {
  PushNotification.configure({
    onRegister: () => {},
    onNotification: () => {},
    popInitialNotification: true,
    requestPermissions: true,
  });
}

export async function scheduleLocalNotification(date: Date, message: string): Promise<{success: boolean, error?: string}> {
  try {
    // Check if we can schedule exact alarms on Android 12+
    if (Platform.OS === 'android') {
      const canScheduleExact = await canScheduleExactAlarms();
      if (!canScheduleExact) {
        console.warn('Cannot schedule exact alarms - using inexact timing');
        // We could still try to schedule, but it may not be exact
      }
    }

    PushNotification.localNotificationSchedule({
      channelId: 'commute-reminder',
      message,
      date,
      allowWhileIdle: true,
      playSound: true,
    });

    return {success: true};
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function scheduleLocalNotificationSync(date: Date, message: string): void {
  // Legacy synchronous version for backward compatibility
  PushNotification.localNotificationSchedule({
    channelId: 'commute-reminder',
    message,
    date,
    allowWhileIdle: true,
    playSound: true,
  });
}

export function ensureDefaultChannel(): void {
  PushNotification.createChannel(
    {
      channelId: 'commute-reminder',
      channelName: 'Commute Reminder',
      importance: 4,
      vibrate: true,
    },
    () => {},
  );
}

