import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification storage keys
const NOTIFICATION_STORAGE_KEYS = {
  SETTINGS: 'notification_settings',
  SCHEDULED_NOTIFICATIONS: 'scheduled_notifications',
};

// Default notification settings
const DEFAULT_SETTINGS = {
  enabled: true,
  sound: true,
  vibration: true,
  morningCommute: true,
  eveningCommute: true,
  weatherAlerts: true,
  trafficAlerts: true,
  advanceNoticeTime: 15, // minutes before suggested departure
};

/**
 * Initialize push notifications
 */
export const initializeNotifications = () => {
  PushNotification.configure({
    // Called when token is generated (iOS and Android)
    onRegister: function (token) {
      console.log('Push notification token:', token);
    },

    // Called when a remote is received or opened, or local notification is opened
    onNotification: function (notification) {
      console.log('Notification received:', notification);

      if (notification.userInteraction) {
        // User tapped the notification
        handleNotificationTap(notification);
      }

      // Required on iOS only
      if (Platform.OS === 'ios') {
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      }
    },

    // Should the initial notification be popped automatically (iOS)
    popInitialNotification: true,

    // Permissions
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    // IOS ONLY: Should the initial notification be popped automatically
    requestPermissions: Platform.OS === 'ios',
  });

  // Android specific configuration
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'commute-timely-default',
        channelName: 'CommuteTimely Notifications',
        channelDescription: 'Notifications for commute timing and weather alerts',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log('Notification channel created:', created)
    );

    PushNotification.createChannel(
      {
        channelId: 'commute-timely-weather',
        channelName: 'Weather Alerts',
        channelDescription: 'Weather-related commute alerts',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log('Weather channel created:', created)
    );
  }
};

/**
 * Handle notification tap events
 * @param {Object} notification - Notification object
 */
const handleNotificationTap = (notification) => {
  const { type, data } = notification;

  switch (type) {
    case 'commute_reminder':
      // Navigate to home screen with route details
      break;
    case 'weather_alert':
      // Navigate to weather details
      break;
    case 'traffic_alert':
      // Navigate to route with traffic information
      break;
    default:
      // Default behavior
      break;
  }
};

/**
 * Schedule a local notification
 * @param {Object} notificationData - Notification configuration
 */
export const scheduleLocalNotification = (notificationData) => {
  const {
    id,
    title,
    message,
    date,
    type = 'commute_reminder',
    data = {},
    sound = 'default',
    vibrate = true,
  } = notificationData;

  const notificationConfig = {
    id: id || Date.now().toString(),
    title,
    message,
    date: new Date(date),
    soundName: sound,
    vibrate,
    playSound: true,
    userInfo: {
      type,
      ...data,
    },
  };

  if (Platform.OS === 'android') {
    notificationConfig.channelId = type === 'weather_alert' ? 'commute-timely-weather' : 'commute-timely-default';
  }

  PushNotification.localNotificationSchedule(notificationConfig);
  
  // Save scheduled notification for tracking
  saveScheduledNotification(notificationConfig);
};

/**
 * Send immediate local notification
 * @param {Object} notificationData - Notification configuration
 */
export const sendLocalNotification = (notificationData) => {
  const {
    title,
    message,
    type = 'commute_reminder',
    data = {},
    sound = 'default',
    vibrate = true,
  } = notificationData;

  const notificationConfig = {
    title,
    message,
    soundName: sound,
    vibrate,
    playSound: true,
    userInfo: {
      type,
      ...data,
    },
  };

  if (Platform.OS === 'android') {
    notificationConfig.channelId = type === 'weather_alert' ? 'commute-timely-weather' : 'commute-timely-default';
  }

  PushNotification.localNotification(notificationConfig);
};

/**
 * Cancel a scheduled notification
 * @param {string} notificationId - ID of notification to cancel
 */
export const cancelNotification = (notificationId) => {
  PushNotification.cancelLocalNotifications({ id: notificationId });
  removeScheduledNotification(notificationId);
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications();
  clearScheduledNotifications();
};

/**
 * Create commute reminder notification
 * @param {Object} commuteData - Commute information
 * @param {Date} notificationTime - When to send the notification
 */
export const scheduleCommuteReminder = (commuteData, notificationTime) => {
  const { duration, route, weather, leaveTime } = commuteData;
  
  let message = `Time to leave for your commute! Estimated travel time: ${Math.ceil(duration / 60)} minutes.`;
  
  if (weather && weather.impactLevel !== 'none') {
    message += ` ${weather.description}`;
  }

  scheduleLocalNotification({
    id: `commute_${Date.now()}`,
    title: '🚗 CommuteTimely Reminder',
    message,
    date: notificationTime,
    type: 'commute_reminder',
    data: {
      route,
      duration,
      weather,
      leaveTime,
    },
  });
};

/**
 * Create weather alert notification
 * @param {Object} weatherData - Weather information
 */
export const sendWeatherAlert = (weatherData) => {
  const { description, impactLevel } = weatherData;
  
  if (impactLevel === 'none') return;

  const urgencyEmoji = {
    low: '⚠️',
    medium: '🌧️',
    high: '🚨',
  };

  sendLocalNotification({
    title: `${urgencyEmoji[impactLevel]} Weather Alert`,
    message: description,
    type: 'weather_alert',
    data: weatherData,
  });
};

/**
 * Create traffic alert notification
 * @param {Object} trafficData - Traffic information
 */
export const sendTrafficAlert = (trafficData) => {
  const { description, severity, duration } = trafficData;

  sendLocalNotification({
    title: '🚦 Traffic Alert',
    message: `${description}. Additional ${Math.ceil(duration / 60)} minutes expected.`,
    type: 'traffic_alert',
    data: trafficData,
  });
};

/**
 * Get notification settings
 * @returns {Promise<Object>} Current notification settings
 */
export const getNotificationSettings = async () => {
  try {
    const settingsString = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEYS.SETTINGS);
    return settingsString ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsString) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Get notification settings error:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save notification settings
 * @param {Object} settings - Notification settings to save
 * @returns {Promise<void>}
 */
export const saveNotificationSettings = async (settings) => {
  try {
    const currentSettings = await getNotificationSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Save notification settings error:', error);
    throw error;
  }
};

/**
 * Save scheduled notification for tracking
 * @param {Object} notification - Notification object
 */
const saveScheduledNotification = async (notification) => {
  try {
    const existingNotifications = await getScheduledNotifications();
    const updatedNotifications = [...existingNotifications, notification];
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(updatedNotifications));
  } catch (error) {
    console.error('Save scheduled notification error:', error);
  }
};

/**
 * Remove scheduled notification from tracking
 * @param {string} notificationId - Notification ID to remove
 */
const removeScheduledNotification = async (notificationId) => {
  try {
    const existingNotifications = await getScheduledNotifications();
    const filteredNotifications = existingNotifications.filter(notif => notif.id !== notificationId);
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(filteredNotifications));
  } catch (error) {
    console.error('Remove scheduled notification error:', error);
  }
};

/**
 * Get all scheduled notifications
 * @returns {Promise<Array>} Array of scheduled notifications
 */
export const getScheduledNotifications = async () => {
  try {
    const notificationsString = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    return notificationsString ? JSON.parse(notificationsString) : [];
  } catch (error) {
    console.error('Get scheduled notifications error:', error);
    return [];
  }
};

/**
 * Clear all scheduled notifications from tracking
 */
const clearScheduledNotifications = async () => {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
  } catch (error) {
    console.error('Clear scheduled notifications error:', error);
  }
};

/**
 * Request notification permissions (iOS)
 * @returns {Promise<boolean>} Permission status
 */
export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      }).then((permissions) => {
        resolve(permissions.alert && permissions.badge && permissions.sound);
      });
    });
  }
  return true; // Android permissions are handled at install time
};

/**
 * Check if notifications are enabled
 * @returns {Promise<boolean>} Whether notifications are enabled
 */
export const areNotificationsEnabled = async () => {
  const settings = await getNotificationSettings();
  return settings.enabled;
};