import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNotification } from '../context/NotificationContext';

const SettingsScreen = () => {
  const { destinations } = useNotification();

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all destinations and cancel all notifications. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            // This would need to be implemented in the context
            Alert.alert('Success', 'All data has been cleared');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    const data = {
      destinations,
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0',
    };
    
    // In a real app, you would implement actual export functionality
    Alert.alert('Export Data', 'Data export functionality would be implemented here');
  };

  const handleOpenPrivacyPolicy = () => {
    // In a real app, this would open your privacy policy
    Alert.alert('Privacy Policy', 'Privacy policy would be displayed here');
  };

  const handleOpenTermsOfService = () => {
    // In a real app, this would open your terms of service
    Alert.alert('Terms of Service', 'Terms of service would be displayed here');
  };

  const handleContactSupport = () => {
    // In a real app, this would open email or support chat
    Alert.alert('Contact Support', 'Support contact functionality would be implemented here');
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    destructive = false 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Icon 
          name={icon} 
          size={24} 
          color={destructive ? '#FF3B30' : '#007AFF'} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      {showArrow && (
        <Icon name="keyboard-arrow-right" size={24} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <SettingItem
          icon="backup"
          title="Export Data"
          subtitle="Export your destinations and settings"
          onPress={handleExportData}
        />
        <SettingItem
          icon="delete-forever"
          title="Clear All Data"
          subtitle="Remove all destinations and notifications"
          onPress={handleClearAllData}
          destructive
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.infoItem}>
          <View style={styles.settingIcon}>
            <Icon name="info" size={24} color="#007AFF" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Version</Text>
            <Text style={styles.settingSubtitle}>1.0.0</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.settingIcon}>
            <Icon name="storage" size={24} color="#007AFF" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Destinations</Text>
            <Text style={styles.settingSubtitle}>{destinations.length} saved</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.settingIcon}>
            <Icon name="notifications-active" size={24} color="#007AFF" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Active Notifications</Text>
            <Text style={styles.settingSubtitle}>
              {destinations.filter(d => d.isActive).length} active
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Legal</Text>
        <SettingItem
          icon="help"
          title="Help & FAQ"
          subtitle="Get help with using the app"
          onPress={() => Alert.alert('Help', 'Help content would be displayed here')}
        />
        <SettingItem
          icon="email"
          title="Contact Support"
          subtitle="Get in touch with our support team"
          onPress={handleContactSupport}
        />
        <SettingItem
          icon="privacy-tip"
          title="Privacy Policy"
          subtitle="Read our privacy policy"
          onPress={handleOpenPrivacyPolicy}
        />
        <SettingItem
          icon="description"
          title="Terms of Service"
          subtitle="Read our terms of service"
          onPress={handleOpenTermsOfService}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Commute Reminder helps you never be late by sending timely notifications 
          about when to leave home to reach your destination on time.
        </Text>
        <Text style={styles.aboutText}>
          The app calculates departure times based on your arrival time and travel duration, 
          then notifies you at the specified time before departure.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    textAlign: 'center',
  },
});

export default SettingsScreen;
