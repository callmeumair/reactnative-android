import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { getThemeColors, TYPOGRAPHY, SPACING, BORDER_RADIUS, createThemedStyles, getWeatherImpactColor, getTransportModeColor } from '../utils/theme';
import { getHomeLocation, getWorkLocation, getCurrentLocation } from '../services/locationService';
import { calculateCommute, scheduleCommuteNotification, TRANSPORT_MODES } from '../services/commuteService';
import { getCurrentWeather } from '../services/weatherService';
import { getNotificationSettings } from '../services/notificationService';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [homeLocation, setHomeLocation] = useState(null);
  const [workLocation, setWorkLocation] = useState(null);
  const [currentCommute, setCurrentCommute] = useState(null);
  const [selectedTransportMode, setSelectedTransportMode] = useState('driving');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [targetArrivalTime, setTargetArrivalTime] = useState(new Date());
  const [currentWeather, setCurrentWeather] = useState(null);
  
  const colors = getThemeColors();
  const styles = useThemedStyles();

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  useEffect(() => {
    // Set default arrival time to 9 AM today or tomorrow if it's past 9 AM
    const now = new Date();
    const nineAM = new Date();
    nineAM.setHours(9, 0, 0, 0);
    
    if (now > nineAM) {
      nineAM.setDate(nineAM.getDate() + 1);
    }
    
    setTargetArrivalTime(nineAM);
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      const [home, work] = await Promise.all([
        getHomeLocation(),
        getWorkLocation(),
      ]);

      if (!home || !work) {
        navigation.navigate('LocationSetup');
        return;
      }

      setHomeLocation(home);
      setWorkLocation(work);
      
      // Load current weather
      try {
        const weather = await getCurrentWeather(home.latitude, home.longitude);
        setCurrentWeather(weather);
      } catch (error) {
        console.error('Weather load error:', error);
      }

      // Calculate initial commute
      calculateCurrentCommute(home, work, selectedTransportMode, targetArrivalTime);

    } catch (error) {
      console.error('Load initial data error:', error);
      Alert.alert('Error', 'Failed to load app data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCurrentCommute = async (home, work, transportMode, arrivalTime) => {
    try {
      setIsLoading(true);
      
      const commuteData = await calculateCommute(
        home,
        work,
        transportMode,
        arrivalTime
      );
      
      setCurrentCommute(commuteData);
    } catch (error) {
      console.error('Calculate commute error:', error);
      Alert.alert(
        'Calculation Error',
        'Could not calculate commute time. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    if (!homeLocation || !workLocation) return;
    
    setRefreshing(true);
    
    try {
      // Refresh weather data
      const weather = await getCurrentWeather(homeLocation.latitude, homeLocation.longitude);
      setCurrentWeather(weather);
      
      // Recalculate commute
      await calculateCurrentCommute(homeLocation, workLocation, selectedTransportMode, targetArrivalTime);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [homeLocation, workLocation, selectedTransportMode, targetArrivalTime]);

  const handleTransportModeChange = (mode) => {
    setSelectedTransportMode(mode);
    if (homeLocation && workLocation) {
      calculateCurrentCommute(homeLocation, workLocation, mode, targetArrivalTime);
    }
  };

  const handleScheduleNotification = async () => {
    if (!currentCommute) return;
    
    try {
      const settings = await getNotificationSettings();
      if (!settings.enabled) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in settings to schedule commute reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') },
          ]
        );
        return;
      }

      await scheduleCommuteNotification(currentCommute, settings.advanceNoticeTime);
      
      Alert.alert(
        'Notification Scheduled',
        `You'll receive a reminder ${settings.advanceNoticeTime} minutes before you need to leave.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Schedule notification error:', error);
      Alert.alert('Error', 'Failed to schedule notification. Please try again.');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const renderTransportModeSelector = () => (
    <View style={styles.transportModeContainer}>
      <Text style={styles.sectionTitle}>Transportation</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.transportModeScroll}>
        {Object.entries(TRANSPORT_MODES).map(([mode, config]) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.transportModeButton,
              selectedTransportMode === mode && {
                backgroundColor: getTransportModeColor(mode),
                borderColor: getTransportModeColor(mode),
              },
            ]}
            onPress={() => handleTransportModeChange(mode)}
          >
            <Text style={styles.transportModeEmoji}>{config.icon}</Text>
            <Text
              style={[
                styles.transportModeText,
                selectedTransportMode === mode && styles.transportModeTextSelected,
              ]}
            >
              {config.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCommuteCard = () => {
    if (!currentCommute) {
      return (
        <View style={styles.commuteCard}>
          <View style={styles.commuteCardHeader}>
            <Text style={styles.commuteTitle}>Your Commute</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Calculating route...</Text>
          </View>
        </View>
      );
    }

    const { route, weather, timing, modeConfig } = currentCommute;
    const weatherImpact = weather.impact;

    return (
      <View style={styles.commuteCard}>
        <View style={styles.commuteCardHeader}>
          <Text style={styles.commuteTitle}>Your Commute</Text>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => navigation.navigate('CommuteDetails', { commute: currentCommute })}
          >
            <Text style={styles.detailsButtonText}>Details</Text>
            <Icon name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Main commute info */}
        <View style={styles.commuteMainInfo}>
          <View style={styles.commuteTimeContainer}>
            <Text style={styles.leaveTimeLabel}>Leave by</Text>
            <Text style={styles.leaveTime}>{formatTime(timing.leaveTime)}</Text>
            <Text style={styles.arriveTimeLabel}>
              to arrive by {formatTime(timing.targetArrivalTime)}
            </Text>
          </View>

          <View style={styles.commuteDurationContainer}>
            <Text style={styles.durationLabel}>Travel Time</Text>
            <Text style={styles.duration}>{formatDuration(route.duration)}</Text>
            <Text style={styles.distance}>{route.distance} km</Text>
          </View>
        </View>

        {/* Weather impact */}
        {weatherImpact.impactLevel !== 'none' && (
          <View style={[
            styles.weatherImpactContainer,
            { borderLeftColor: getWeatherImpactColor(weatherImpact.impactLevel) }
          ]}>
            <Icon
              name="partly-sunny"
              size={20}
              color={getWeatherImpactColor(weatherImpact.impactLevel)}
            />
            <Text style={styles.weatherImpactText}>
              {weatherImpact.description}
            </Text>
          </View>
        )}

        {/* Action button */}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleScheduleNotification}
        >
          <Icon name="notifications-outline" size={20} color={colors.primary} />
          <Text style={styles.notificationButtonText}>Schedule Reminder</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWeatherCard = () => {
    if (!currentWeather || !currentWeather.data || currentWeather.data.length === 0) {
      return null;
    }

    const weather = currentWeather.data[0];

    return (
      <TouchableOpacity
        style={styles.weatherCard}
        onPress={() => navigation.navigate('WeatherDetails', { weather: currentWeather })}
      >
        <View style={styles.weatherHeader}>
          <Text style={styles.weatherTitle}>Current Weather</Text>
          <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>

        <View style={styles.weatherContent}>
          <View style={styles.weatherMain}>
            <Text style={styles.temperature}>{Math.round(weather.temp)}°</Text>
            <View style={styles.weatherDetails}>
              <Text style={styles.weatherDescription}>
                {weather.weather?.description || 'N/A'}
              </Text>
              <Text style={styles.weatherSubtext}>
                Feels like {Math.round(weather.app_temp)}°
              </Text>
            </View>
          </View>

          <View style={styles.weatherStats}>
            <View style={styles.weatherStat}>
              <Icon name="water" size={16} color={colors.info} />
              <Text style={styles.weatherStatText}>{weather.precip || 0}mm</Text>
            </View>
            <View style={styles.weatherStat}>
              <Icon name="eye" size={16} color={colors.textSecondary} />
              <Text style={styles.weatherStatText}>{weather.vis || 0}km</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('LocationSetup', { isUpdate: true })}
        >
          <Icon name="location" size={24} color={colors.primary} />
          <Text style={styles.quickActionText}>Update Locations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={onRefresh}
        >
          <Icon name="refresh" size={24} color={colors.secondary} />
          <Text style={styles.quickActionText}>Refresh Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && !currentCommute) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your commute...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderTransportModeSelector()}
        {renderCommuteCard()}
        {renderWeatherCard()}
        {renderQuickActions()}
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
      padding: spacing.lg,
    },
    loadingScreen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    loadingText: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    transportModeContainer: {
      marginBottom: spacing.lg,
    },
    transportModeScroll: {
      flexDirection: 'row',
    },
    transportModeButton: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginRight: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 80,
    },
    transportModeEmoji: {
      fontSize: 24,
      marginBottom: spacing.xs,
    },
    transportModeText: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      fontWeight: typography.fontWeight.medium,
    },
    transportModeTextSelected: {
      color: '#FFFFFF',
    },
    commuteCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    commuteCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    commuteTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
    },
    detailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailsButtonText: {
      fontSize: typography.fontSize.sm,
      color: colors.primary,
      fontWeight: typography.fontWeight.medium,
      marginRight: spacing.xs,
    },
    commuteMainInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    commuteTimeContainer: {
      flex: 1,
      alignItems: 'flex-start',
    },
    leaveTimeLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    leaveTime: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    arriveTimeLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    commuteDurationContainer: {
      alignItems: 'flex-end',
    },
    durationLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    duration: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    distance: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    weatherImpactContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      borderLeftWidth: 4,
      marginBottom: spacing.md,
    },
    weatherImpactText: {
      fontSize: typography.fontSize.sm,
      color: colors.text,
      marginLeft: spacing.sm,
      flex: 1,
    },
    notificationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notificationButtonText: {
      fontSize: typography.fontSize.md,
      color: colors.primary,
      fontWeight: typography.fontWeight.medium,
      marginLeft: spacing.sm,
    },
    weatherCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    weatherHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    weatherTitle: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
    },
    weatherContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    weatherMain: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    temperature: {
      fontSize: 48,
      fontWeight: typography.fontWeight.light,
      color: colors.text,
      marginRight: spacing.md,
    },
    weatherDetails: {
      justifyContent: 'center',
    },
    weatherDescription: {
      fontSize: typography.fontSize.md,
      color: colors.text,
      textTransform: 'capitalize',
      marginBottom: spacing.xs,
    },
    weatherSubtext: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    weatherStats: {
      alignItems: 'flex-end',
    },
    weatherStat: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    weatherStatText: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    quickActionsContainer: {
      marginBottom: spacing.lg,
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickActionButton: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingVertical: spacing.lg,
      borderRadius: borderRadius.lg,
      marginHorizontal: spacing.xs,
      ...colors.shadow,
    },
    quickActionText: {
      fontSize: typography.fontSize.sm,
      color: colors.text,
      fontWeight: typography.fontWeight.medium,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
  })
);

export default HomeScreen;