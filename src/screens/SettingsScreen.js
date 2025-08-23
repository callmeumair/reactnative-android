import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { getThemeColors, TYPOGRAPHY, SPACING, BORDER_RADIUS, createThemedStyles, getCurrentTheme, setTheme, toggleTheme } from '../utils/theme';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
  areNotificationsEnabled,
  cancelAllNotifications,
} from '../services/notificationService';
import { getHomeLocation, getWorkLocation } from '../services/locationService';

const SettingsScreen = ({ navigation }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    morningCommute: true,
    eveningCommute: true,
    weatherAlerts: true,
    trafficAlerts: true,
    advanceNoticeTime: 15,
  });
  
  const [currentTheme, setCurrentTheme] = useState('light');
  const [hasLocations, setHasLocations] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const colors = getThemeColors();
  const styles = useThemedStyles();

  useEffect(() => {
    loadSettings();
    checkLocations();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getNotificationSettings();
      setNotificationSettings(settings);
      setCurrentTheme(getCurrentTheme());
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkLocations = async () => {
    try {
      const [home, work] = await Promise.all([
        getHomeLocation(),
        getWorkLocation(),
      ]);
      setHasLocations(!!home && !!work);
    } catch (error) {
      console.error('Check locations error:', error);
    }
  };

  const updateNotificationSetting = async (key, value) => {
    try {
      const updatedSettings = { ...notificationSettings, [key]: value };
      
      // If disabling notifications entirely, cancel all scheduled notifications
      if (key === 'enabled' && !value) {
        await cancelAllNotifications();
      }
      
      // If enabling notifications for the first time, request permissions
      if (key === 'enabled' && value && !notificationSettings.enabled) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive commute reminders.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      await saveNotificationSettings(updatedSettings);
      setNotificationSettings(updatedSettings);
    } catch (error) {
      console.error('Update notification setting error:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    }
  };

  const handleThemeChange = async () => {
    const options = [
      'Light Theme',
      'Dark Theme',
      'System Default',
      'Cancel',
    ];

    const showActionSheet = () => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex: 3,
            title: 'Choose Theme',
          },
          (buttonIndex) => {
            switch (buttonIndex) {
              case 0:
                setTheme('light');
                setCurrentTheme('light');
                break;
              case 1:
                setTheme('dark');
                setCurrentTheme('dark');
                break;
              case 2:
                setTheme('system');
                setCurrentTheme(getCurrentTheme());
                break;
            }
          }
        );
      } else {
        // Android - show alert dialog
        Alert.alert(
          'Choose Theme',
          '',
          [
            { text: 'Light Theme', onPress: () => { setTheme('light'); setCurrentTheme('light'); } },
            { text: 'Dark Theme', onPress: () => { setTheme('dark'); setCurrentTheme('dark'); } },
            { text: 'System Default', onPress: () => { setTheme('system'); setCurrentTheme(getCurrentTheme()); } },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    };

    showActionSheet();
  };

  const handleAdvanceNoticeTimeChange = () => {
    const options = [
      '5 minutes',
      '10 minutes',
      '15 minutes',
      '20 minutes',
      '30 minutes',
      'Cancel',
    ];

    const values = [5, 10, 15, 20, 30];

    const showActionSheet = () => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex: 5,
            title: 'Advance Notice Time',
          },
          (buttonIndex) => {
            if (buttonIndex < 5) {
              updateNotificationSetting('advanceNoticeTime', values[buttonIndex]);
            }
          }
        );
      } else {
        Alert.alert(
          'Advance Notice Time',
          'How many minutes before departure should we notify you?',
          [
            ...values.map(value => ({
              text: `${value} minutes`,
              onPress: () => updateNotificationSetting('advanceNoticeTime', value),
            })),
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    };

    showActionSheet();
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled commute notifications. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllNotifications();
              Alert.alert('Success', 'All notifications cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications.');
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    type = 'switch',
    onPress,
    icon,
    rightText,
    disabled = false,
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, disabled && styles.settingItemDisabled]}
      onPress={onPress}
      disabled={disabled || type === 'switch'}
      activeOpacity={type === 'switch' ? 1 : 0.7}
    >
      <View style={styles.settingItemLeft}>
        {icon && (
          <Icon name={icon} size={20} color={colors.primary} style={styles.settingIcon} />
        )}
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, disabled && styles.settingSubtitleDisabled]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.settingItemRight}>
        {type === 'switch' ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: colors.textTertiary, true: colors.primary }}
            thumbColor={colors.card}
            disabled={disabled}
          />
        ) : (
          <View style={styles.settingRightContent}>
            {rightText && (
              <Text style={styles.settingRightText}>{rightText}</Text>
            )}
            <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Locations Section */}
        {renderSection('Locations', [
          renderSettingItem({
            key: 'locations',
            title: 'Home & Work Locations',
            subtitle: hasLocations 
              ? 'Tap to update your saved locations'
              : 'Set up your home and work addresses',
            icon: 'location',
            type: 'button',
            onPress: () => navigation.navigate('LocationSetup', { isUpdate: true }),
          }),
        ])}

        {/* Notifications Section */}
        {renderSection('Notifications', [
          renderSettingItem({
            key: 'notifications-enabled',
            title: 'Enable Notifications',
            subtitle: 'Receive commute timing reminders',
            icon: 'notifications',
            type: 'switch',
            value: notificationSettings.enabled,
            onValueChange: (value) => updateNotificationSetting('enabled', value),
          }),
          renderSettingItem({
            key: 'advance-notice',
            title: 'Advance Notice Time',
            subtitle: 'How early to notify you before departure',
            icon: 'time',
            type: 'button',
            rightText: `${notificationSettings.advanceNoticeTime} min`,
            onPress: handleAdvanceNoticeTimeChange,
            disabled: !notificationSettings.enabled,
          }),
          renderSettingItem({
            key: 'sound',
            title: 'Sound',
            subtitle: 'Play notification sounds',
            type: 'switch',
            value: notificationSettings.sound,
            onValueChange: (value) => updateNotificationSetting('sound', value),
            disabled: !notificationSettings.enabled,
          }),
          renderSettingItem({
            key: 'vibration',
            title: 'Vibration',
            subtitle: 'Vibrate for notifications',
            type: 'switch',
            value: notificationSettings.vibration,
            onValueChange: (value) => updateNotificationSetting('vibration', value),
            disabled: !notificationSettings.enabled,
          }),
        ])}

        {/* Alert Types Section */}
        {renderSection('Alert Types', [
          renderSettingItem({
            key: 'morning-commute',
            title: 'Morning Commute',
            subtitle: 'Notifications for morning travel',
            type: 'switch',
            value: notificationSettings.morningCommute,
            onValueChange: (value) => updateNotificationSetting('morningCommute', value),
            disabled: !notificationSettings.enabled,
          }),
          renderSettingItem({
            key: 'evening-commute',
            title: 'Evening Commute',
            subtitle: 'Notifications for evening travel',
            type: 'switch',
            value: notificationSettings.eveningCommute,
            onValueChange: (value) => updateNotificationSetting('eveningCommute', value),
            disabled: !notificationSettings.enabled,
          }),
          renderSettingItem({
            key: 'weather-alerts',
            title: 'Weather Alerts',
            subtitle: 'Notifications for weather-related delays',
            type: 'switch',
            value: notificationSettings.weatherAlerts,
            onValueChange: (value) => updateNotificationSetting('weatherAlerts', value),
            disabled: !notificationSettings.enabled,
          }),
          renderSettingItem({
            key: 'traffic-alerts',
            title: 'Traffic Alerts',
            subtitle: 'Notifications for traffic delays',
            type: 'switch',
            value: notificationSettings.trafficAlerts,
            onValueChange: (value) => updateNotificationSetting('trafficAlerts', value),
            disabled: !notificationSettings.enabled,
          }),
        ])}

        {/* Appearance Section */}
        {renderSection('Appearance', [
          renderSettingItem({
            key: 'theme',
            title: 'Theme',
            subtitle: 'Choose your preferred theme',
            icon: 'color-palette',
            type: 'button',
            rightText: currentTheme === 'dark' ? 'Dark' : 'Light',
            onPress: handleThemeChange,
          }),
        ])}

        {/* Advanced Section */}
        {renderSection('Advanced', [
          renderSettingItem({
            key: 'clear-notifications',
            title: 'Clear All Notifications',
            subtitle: 'Cancel all scheduled reminders',
            icon: 'trash',
            type: 'button',
            onPress: handleClearAllNotifications,
          }),
        ])}

        {/* App Info */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoTitle}>CommuteTimely</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoDescription}>
            Smart commute notifications with weather and traffic awareness
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const useThemedStyles = createThemedStyles((colors, typography, spacing, borderRadius) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
    },
    section: {
      marginTop: spacing.lg,
    },
    sectionTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    sectionContent: {
      backgroundColor: colors.card,
      marginHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
      ...colors.shadow,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    settingItemDisabled: {
      opacity: 0.5,
    },
    settingItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: spacing.md,
    },
    settingTextContainer: {
      flex: 1,
    },
    settingTitle: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
      color: colors.text,
      marginBottom: 2,
    },
    settingTitleDisabled: {
      color: colors.textSecondary,
    },
    settingSubtitle: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      lineHeight: typography.lineHeight.sm,
    },
    settingSubtitleDisabled: {
      color: colors.textTertiary,
    },
    settingItemRight: {
      alignItems: 'center',
    },
    settingRightContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingRightText: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginRight: spacing.sm,
    },
    appInfoContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    appInfoTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    appInfoVersion: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    appInfoDescription: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: typography.lineHeight.sm,
    },
  })
);

export default SettingsScreen;