import {NativeModules, Platform} from 'react-native';
import PushNotification from 'react-native-push-notification';
import {canScheduleExactAlarms} from './permissions';
import {Destination} from './database';
import {CommuteResult, getWeatherIcon} from './commute';

interface AlarmManagerModule {
  scheduleExactAlarm: (alarmId: string, triggerTime: number, title: string, message: string) => Promise<boolean>;
  cancelAlarm: (alarmId: string) => Promise<void>;
  canScheduleExactAlarms: () => Promise<boolean>;
}

const {AlarmManager} = NativeModules as {AlarmManager?: AlarmManagerModule};

export interface ScheduledAlarm {
  id: string;
  destinationId: string;
  triggerTime: number; // Unix timestamp in milliseconds
  title: string;
  message: string;
  isActive: boolean;
}

export class CommuteAlarmManager {
  private scheduledAlarms: Map<string, ScheduledAlarm> = new Map();

  async scheduleCommuteAlarm(
    destination: Destination,
    commuteResult: CommuteResult
  ): Promise<boolean> {
    try {
      const alarmId = `commute_${destination.id}`;
      const triggerTime = this.calculateTriggerTime(commuteResult.leaveTime);
      
      const weatherIcon = getWeatherIcon(commuteResult.weatherCondition);
      const title = `Time to leave for ${destination.name}! 🚗`;
      const message = `ETA: ${Math.round(commuteResult.duration / 60)} mins (${weatherIcon} ${commuteResult.weatherCondition})`;

      // Cancel existing alarm for this destination
      await this.cancelAlarm(alarmId);

      let success = false;

      if (Platform.OS === 'android' && AlarmManager) {
        // Try to use native AlarmManager for exact alarms
        const canUseExactAlarms = await canScheduleExactAlarms();
        
        if (canUseExactAlarms) {
          success = await AlarmManager.scheduleExactAlarm(alarmId, triggerTime, title, message);
          console.log(`Exact alarm scheduled: ${success ? 'Success' : 'Failed'}`);
        } else {
          console.warn('Exact alarms not available, falling back to notification scheduling');
          success = false;
        }
      }

      // Fallback to react-native-push-notification
      if (!success) {
        success = await this.scheduleWithPushNotification(alarmId, triggerTime, title, message);
      }

      if (success) {
        this.scheduledAlarms.set(alarmId, {
          id: alarmId,
          destinationId: destination.id,
          triggerTime,
          title,
          message,
          isActive: true,
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to schedule commute alarm:', error);
      return false;
    }
  }

  private async scheduleWithPushNotification(
    alarmId: string,
    triggerTime: number,
    title: string,
    message: string
  ): Promise<boolean> {
    try {
      const triggerDate = new Date(triggerTime);
      
      // Don't schedule if the time is in the past
      if (triggerDate.getTime() <= Date.now()) {
        console.warn('Cannot schedule alarm in the past');
        return false;
      }

      PushNotification.localNotificationSchedule({
        id: alarmId,
        channelId: 'commute-reminder',
        title,
        message,
        date: triggerDate,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 1000,
        actions: ['Snooze', 'Dismiss'],
        userInfo: {
          destinationId: alarmId.replace('commute_', ''),
          type: 'commute_reminder',
        },
      });

      console.log(`Push notification scheduled for ${triggerDate.toLocaleString()}`);
      return true;
    } catch (error) {
      console.error('Failed to schedule push notification:', error);
      return false;
    }
  }

  async cancelAlarm(alarmId: string): Promise<void> {
    try {
      // Cancel native AlarmManager alarm
      if (Platform.OS === 'android' && AlarmManager) {
        await AlarmManager.cancelAlarm(alarmId);
      }

      // Cancel push notification
      PushNotification.cancelLocalNotification(alarmId);

      // Remove from our tracking
      this.scheduledAlarms.delete(alarmId);

      console.log(`Alarm cancelled: ${alarmId}`);
    } catch (error) {
      console.error('Failed to cancel alarm:', error);
    }
  }

  async cancelAllDestinationAlarms(destinationId: string): Promise<void> {
    const alarmId = `commute_${destinationId}`;
    await this.cancelAlarm(alarmId);
  }

  async cancelAllAlarms(): Promise<void> {
    const alarmIds = Array.from(this.scheduledAlarms.keys());
    
    for (const alarmId of alarmIds) {
      await this.cancelAlarm(alarmId);
    }
  }

  private calculateTriggerTime(leaveTime: string): number {
    const [hours, minutes] = leaveTime.split(':').map(Number);
    const today = new Date();
    const triggerDate = new Date(today);
    
    triggerDate.setHours(hours, minutes, 0, 0);

    // If the time is in the past, schedule for tomorrow
    if (triggerDate.getTime() <= today.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    return triggerDate.getTime();
  }

  getScheduledAlarms(): ScheduledAlarm[] {
    return Array.from(this.scheduledAlarms.values());
  }

  getAlarmForDestination(destinationId: string): ScheduledAlarm | undefined {
    const alarmId = `commute_${destinationId}`;
    return this.scheduledAlarms.get(alarmId);
  }

  async rescheduleAllAlarms(destinations: Destination[], commuteResults: Map<string, CommuteResult>): Promise<void> {
    console.log('Rescheduling all alarms...');
    
    for (const destination of destinations) {
      const commuteResult = commuteResults.get(destination.id);
      if (commuteResult) {
        await this.scheduleCommuteAlarm(destination, commuteResult);
      }
    }
  }

  async testAlarm(title: string = 'Test Alarm', message: string = 'This is a test notification'): Promise<boolean> {
    const testId = 'test_alarm';
    const triggerTime = Date.now() + 10000; // 10 seconds from now
    
    return await this.scheduleWithPushNotification(testId, triggerTime, title, message);
  }
}

export const commuteAlarmManager = new CommuteAlarmManager();
