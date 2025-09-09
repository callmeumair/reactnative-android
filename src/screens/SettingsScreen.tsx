import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import Animated, {FadeInDown, FadeInUp} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Card} from '../components/Card';
import {Button} from '../components/Button';
import {useTheme} from '../context/ThemeContext';
import {canScheduleExactAlarms, ensureNotificationPermission} from '../services/permissions';
import {backgroundCommuteService} from '../services/backgroundService';
import {databaseService} from '../services/database';

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'toggle' | 'button' | 'navigation';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export function SettingsScreen() {
  const {theme, isDark, themeMode, setThemeMode} = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [exactAlarmsOk, setExactAlarmsOk] = useState<boolean | null>(null);
  const [backgroundServiceInfo, setBackgroundServiceInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<{local: boolean; cloud: boolean}>({local: false, cloud: false});

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const exactAlarms = await canScheduleExactAlarms();
    setExactAlarmsOk(exactAlarms);
    
    const notifications = await ensureNotificationPermission();
    setNotificationsEnabled(notifications);
    
    // Get background service info
    const serviceInfo = await backgroundCommuteService.getLastCalculationInfo();
    setBackgroundServiceInfo(serviceInfo);
    
    // Get database connection status
    const dbStatus = databaseService.getConnectionStatus();
    setConnectionStatus(dbStatus);
  };

  const handleThemeChange = async () => {
    const modes = ['system', 'light', 'dark'] as const;
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    await setThemeMode(nextMode);
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await ensureNotificationPermission();
      setNotificationsEnabled(granted);
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ]
        );
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleExactAlarmsPress = () => {
    if (!exactAlarmsOk) {
      Alert.alert(
        'Exact Alarms Permission',
        'This permission allows the app to schedule exact notifications. Please enable it in your device settings for the most accurate timing.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: () => Linking.openSettings()},
        ]
      );
    }
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'system': return 'System Theme';
      default: return 'System Theme';
    }
  };

  const settingsGroups = [
    {
      title: 'Appearance',
      items: [
        {
          id: 'theme',
          title: 'Theme',
          subtitle: getThemeDisplayText(),
          icon: isDark ? 'dark-mode' : 'light-mode',
          type: 'button' as const,
          onPress: handleThemeChange,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Receive commute reminders',
          icon: 'notifications',
          type: 'toggle' as const,
          value: notificationsEnabled,
          onToggle: handleNotificationToggle,
        },
        {
          id: 'exact-alarms',
          title: 'Exact Alarms',
          subtitle: exactAlarmsOk ? 'Enabled for precise timing' : 'Tap to enable in settings',
          icon: exactAlarmsOk ? 'alarm-on' : 'alarm-off',
          type: 'button' as const,
          onPress: handleExactAlarmsPress,
        },
      ],
    },
    {
      title: 'Background Service',
      items: [
        {
          id: 'background-status',
          title: 'Auto Calculation',
          subtitle: backgroundServiceInfo?.lastCalculation 
            ? `Last run: ${new Date(backgroundServiceInfo.lastCalculation).toLocaleDateString()}`
            : 'Never run',
          icon: 'sync',
          type: 'button' as const,
          onPress: () => {
            Alert.alert(
              'Background Service',
              `Status: ${backgroundServiceInfo?.lastTaskInfo?.status || 'Unknown'}\n` +
              `Last calculation: ${backgroundServiceInfo?.lastCalculation || 'Never'}\n` +
              `Destinations processed: ${backgroundServiceInfo?.lastTaskInfo?.destinationsProcessed || 0}`,
              [
                {text: 'Force Recalculation', onPress: () => backgroundCommuteService.forceRecalculation()},
                {text: 'OK', style: 'cancel'},
              ]
            );
          },
        },
      ],
    },
    {
      title: 'Data & Sync',
      items: [
        {
          id: 'database-status',
          title: 'Database Status',
          subtitle: `Local: ${connectionStatus.local ? '✅' : '❌'} | Cloud: ${connectionStatus.cloud ? '✅' : '❌'}`,
          icon: connectionStatus.cloud ? 'cloud-done' : 'cloud-off',
          type: 'button' as const,
          onPress: () => {
            Alert.alert(
              'Database Status',
              `Local Database: ${connectionStatus.local ? 'Connected' : 'Disconnected'}\n` +
              `Cloud Sync: ${connectionStatus.cloud ? 'Connected' : 'Disconnected'}\n\n` +
              `${connectionStatus.cloud ? 'Your data is synced to the cloud and available across devices.' : 'Data is stored locally only. Cloud sync is unavailable.'}`,
              [
                {text: 'Force Sync', onPress: async () => {
                  const success = await databaseService.forceSyncWithCloud();
                  Alert.alert('Sync Result', success ? 'Sync completed successfully!' : 'Sync failed. Using local data only.');
                  checkPermissions(); // Refresh status
                }},
                {text: 'OK', style: 'cancel'},
              ]
            );
          },
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          title: 'App Version',
          subtitle: '1.0.0',
          icon: 'info',
          type: 'button' as const,
          onPress: () => Alert.alert('CommuteTimely', 'Version 1.0.0\nBuilt with ❤️ for smart commuting'),
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          subtitle: 'How we protect your data',
          icon: 'privacy-tip',
          type: 'navigation' as const,
          onPress: () => Alert.alert('Coming Soon', 'Privacy policy coming soon!'),
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          subtitle: 'App usage terms',
          icon: 'description',
          type: 'navigation' as const,
          onPress: () => Alert.alert('Coming Soon', 'Terms of service coming soon!'),
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem, index: number) => {
    const renderRightComponent = () => {
      switch (item.type) {
        case 'toggle':
          return (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{false: theme.outline, true: theme.primary}}
              thumbColor={theme.surface}
            />
          );
        case 'navigation':
          return <Icon name="arrow-forward-ios" size={16} color={theme.onSurfaceVariant} />;
        default:
          return null;
      }
    };

    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.delay(index * 50)}>
        <Card
          onPress={item.onPress}
          style={styles.settingsItem}>
          <View style={styles.settingsItemContent}>
            <View style={[styles.settingsIcon, {backgroundColor: theme.primaryContainer}]}>
              <Icon name={item.icon} size={24} color={theme.primary} />
            </View>
            <View style={styles.settingsTextContainer}>
              <Text style={[styles.settingsTitle, {color: theme.onSurface}]}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={[styles.settingsSubtitle, {color: theme.onSurfaceVariant}]}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            {renderRightComponent()}
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderSettingsGroup = (group: any, groupIndex: number) => (
    <Animated.View
      key={group.title}
      entering={FadeInUp.delay(groupIndex * 100)}
      style={styles.settingsGroup}>
      <Text style={[styles.groupTitle, {color: theme.onBackground}]}>
        {group.title}
      </Text>
      {group.items.map(renderSettingsItem)}
    </Animated.View>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <Animated.View entering={FadeInUp} style={styles.header}>
          <Text style={[styles.headerTitle, {color: theme.onBackground}]}>
            Settings
          </Text>
          <Text style={[styles.headerSubtitle, {color: theme.onSurfaceVariant}]}>
            Customize your CommuteTimely experience
          </Text>
        </Animated.View>

        {/* Settings Groups */}
        {settingsGroups.map(renderSettingsGroup)}

        {/* Refresh Permissions Button */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
          <Button
            title="Refresh Permissions"
            variant="outlined"
            icon={<Icon name="refresh" size={20} color={theme.primary} />}
            onPress={checkPermissions}
            style={styles.refreshButton}
          />
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.footer}>
          <Text style={[styles.footerText, {color: theme.onSurfaceVariant}]}>
            Made with ❤️ for smart commuting
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  settingsGroup: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
  settingsItem: {
    marginVertical: 4,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  refreshButton: {
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
