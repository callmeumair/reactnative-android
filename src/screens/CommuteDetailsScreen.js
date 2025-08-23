import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { getThemeColors, TYPOGRAPHY, SPACING, BORDER_RADIUS, createThemedStyles, getWeatherImpactColor, getTransportModeColor } from '../utils/theme';

const { width } = Dimensions.get('window');

const CommuteDetailsScreen = ({ route, navigation }) => {
  const { commute } = route.params;
  const [selectedTab, setSelectedTab] = useState('overview');

  const colors = getThemeColors();
  const styles = useThemedStyles();

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

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'overview', title: 'Overview', icon: 'car' },
        { key: 'route', title: 'Route', icon: 'map' },
        { key: 'weather', title: 'Weather', icon: 'partly-sunny' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            selectedTab === tab.key && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab(tab.key)}
        >
          <Icon
            name={tab.icon}
            size={20}
            color={selectedTab === tab.key ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === tab.key && styles.tabButtonTextActive,
            ]}
          >
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Main timing info */}
      <View style={styles.timingCard}>
        <Text style={styles.cardTitle}>Commute Timing</Text>
        
        <View style={styles.timingRow}>
          <View style={styles.timingItem}>
            <Icon name="time" size={24} color={colors.primary} />
            <Text style={styles.timingLabel}>Leave by</Text>
            <Text style={styles.timingValue}>{formatTime(commute.timing.leaveTime)}</Text>
          </View>
          
          <View style={styles.timingDivider} />
          
          <View style={styles.timingItem}>
            <Icon name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.timingLabel}>Arrive by</Text>
            <Text style={styles.timingValue}>{formatTime(commute.timing.targetArrivalTime)}</Text>
          </View>
        </View>

        <View style={styles.durationContainer}>
          <Text style={styles.durationLabel}>Total Travel Time</Text>
          <Text style={styles.durationValue}>{formatDuration(commute.route.duration)}</Text>
          <Text style={styles.distanceValue}>{commute.route.distance} km</Text>
        </View>
      </View>

      {/* Transport mode */}
      <View style={styles.transportCard}>
        <Text style={styles.cardTitle}>Transportation</Text>
        <View style={styles.transportMode}>
          <Text style={styles.transportEmoji}>{commute.modeConfig.icon}</Text>
          <View style={styles.transportInfo}>
            <Text style={styles.transportName}>{commute.modeConfig.name}</Text>
            <Text style={styles.transportDescription}>
              Average speed: {commute.modeConfig.baseSpeed} km/h
            </Text>
          </View>
        </View>
      </View>

      {/* Weather impact */}
      {commute.weather.impact.impactLevel !== 'none' && (
        <View style={styles.weatherCard}>
          <Text style={styles.cardTitle}>Weather Impact</Text>
          <View style={[
            styles.weatherImpact,
            { borderLeftColor: getWeatherImpactColor(commute.weather.impact.impactLevel) }
          ]}>
            <Icon
              name="partly-sunny"
              size={24}
              color={getWeatherImpactColor(commute.weather.impact.impactLevel)}
            />
            <View style={styles.weatherImpactContent}>
              <Text style={styles.weatherImpactTitle}>
                {commute.weather.impact.impactLevel.toUpperCase()} IMPACT
              </Text>
              <Text style={styles.weatherImpactDescription}>
                {commute.weather.impact.description}
              </Text>
              <Text style={styles.weatherImpactFactor}>
                +{Math.round((commute.weather.impact.factor - 1) * 100)}% travel time
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Buffer time */}
      <View style={styles.bufferCard}>
        <Text style={styles.cardTitle}>Safety Buffer</Text>
        <View style={styles.bufferContent}>
          <Icon name="shield-checkmark" size={24} color={colors.accent} />
          <View style={styles.bufferInfo}>
            <Text style={styles.bufferTime}>
              +{commute.timing.bufferTime} minutes
            </Text>
            <Text style={styles.bufferDescription}>
              Extra time added for unexpected delays
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderRouteTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.routeCard}>
        <Text style={styles.cardTitle}>Route Information</Text>
        
        <View style={styles.routeStats}>
          <View style={styles.routeStat}>
            <Icon name="navigate" size={20} color={colors.primary} />
            <Text style={styles.routeStatLabel}>Distance</Text>
            <Text style={styles.routeStatValue}>{commute.route.distance} km</Text>
          </View>
          
          <View style={styles.routeStat}>
            <Icon name="time" size={20} color={colors.secondary} />
            <Text style={styles.routeStatLabel}>Base Time</Text>
            <Text style={styles.routeStatValue}>{formatDuration(commute.route.baseDuration)}</Text>
          </View>
          
          <View style={styles.routeStat}>
            <Icon name="speedometer" size={20} color={colors.accent} />
            <Text style={styles.routeStatLabel}>Avg Speed</Text>
            <Text style={styles.routeStatValue}>
              {Math.round((commute.route.distance / (commute.route.baseDuration / 60)) * 10) / 10} km/h
            </Text>
          </View>
        </View>
      </View>

      {/* Route steps */}
      {commute.route.steps && commute.route.steps.length > 0 && (
        <View style={styles.stepsCard}>
          <Text style={styles.cardTitle}>Directions</Text>
          <ScrollView style={styles.stepsContainer} nestedScrollEnabled>
            {commute.route.steps.slice(0, 5).map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepInstruction}>
                    {step.maneuver?.instruction || 'Continue on route'}
                  </Text>
                  <Text style={styles.stepDistance}>
                    {Math.round(step.distance || 0)} m • {Math.round((step.duration || 0) / 60)} min
                  </Text>
                </View>
              </View>
            ))}
            {commute.route.steps.length > 5 && (
              <Text style={styles.moreStepsText}>
                +{commute.route.steps.length - 5} more steps...
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderWeatherTab = () => (
    <View style={styles.tabContent}>
      {/* Origin weather */}
      {commute.weather.origin.current && (
        <View style={styles.weatherLocationCard}>
          <Text style={styles.cardTitle}>Weather at Home</Text>
          <View style={styles.weatherContent}>
            <View style={styles.weatherMain}>
              <Text style={styles.weatherTemp}>
                {Math.round(commute.weather.origin.current.temp)}°
              </Text>
              <View style={styles.weatherDetails}>
                <Text style={styles.weatherDescription}>
                  {commute.weather.origin.current.weather?.description || 'N/A'}
                </Text>
                <Text style={styles.weatherFeels}>
                  Feels like {Math.round(commute.weather.origin.current.app_temp)}°
                </Text>
              </View>
            </View>
            
            <View style={styles.weatherStats}>
              <View style={styles.weatherStat}>
                <Icon name="water" size={16} color={colors.info} />
                <Text style={styles.weatherStatText}>
                  {commute.weather.origin.current.precip || 0}mm rain
                </Text>
              </View>
              <View style={styles.weatherStat}>
                <Icon name="eye" size={16} color={colors.textSecondary} />
                <Text style={styles.weatherStatText}>
                  {commute.weather.origin.current.vis || 0}km visibility
                </Text>
              </View>
              <View style={styles.weatherStat}>
                <Icon name="speedometer" size={16} color={colors.warning} />
                <Text style={styles.weatherStatText}>
                  {Math.round(commute.weather.origin.current.wind_spd || 0)} km/h wind
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Destination weather */}
      {commute.weather.destination.current && (
        <View style={styles.weatherLocationCard}>
          <Text style={styles.cardTitle}>Weather at Work</Text>
          <View style={styles.weatherContent}>
            <View style={styles.weatherMain}>
              <Text style={styles.weatherTemp}>
                {Math.round(commute.weather.destination.current.temp)}°
              </Text>
              <View style={styles.weatherDetails}>
                <Text style={styles.weatherDescription}>
                  {commute.weather.destination.current.weather?.description || 'N/A'}
                </Text>
                <Text style={styles.weatherFeels}>
                  Feels like {Math.round(commute.weather.destination.current.app_temp)}°
                </Text>
              </View>
            </View>
            
            <View style={styles.weatherStats}>
              <View style={styles.weatherStat}>
                <Icon name="water" size={16} color={colors.info} />
                <Text style={styles.weatherStatText}>
                  {commute.weather.destination.current.precip || 0}mm rain
                </Text>
              </View>
              <View style={styles.weatherStat}>
                <Icon name="eye" size={16} color={colors.textSecondary} />
                <Text style={styles.weatherStatText}>
                  {commute.weather.destination.current.vis || 0}km visibility
                </Text>
              </View>
              <View style={styles.weatherStat}>
                <Icon name="speedometer" size={16} color={colors.warning} />
                <Text style={styles.weatherStatText}>
                  {Math.round(commute.weather.destination.current.wind_spd || 0)} km/h wind
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Overall impact */}
      <View style={styles.weatherImpactCard}>
        <Text style={styles.cardTitle}>Overall Impact</Text>
        <View style={[
          styles.weatherImpactSummary,
          { backgroundColor: `${getWeatherImpactColor(commute.weather.impact.impactLevel)}20` }
        ]}>
          <View style={styles.impactLevel}>
            <Text style={[
              styles.impactLevelText,
              { color: getWeatherImpactColor(commute.weather.impact.impactLevel) }
            ]}>
              {commute.weather.impact.impactLevel.toUpperCase()}
            </Text>
            <Text style={styles.impactMultiplier}>
              {commute.weather.impact.factor.toFixed(1)}x normal time
            </Text>
          </View>
          <Text style={styles.impactDescription}>
            {commute.weather.impact.description}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'route':
        return renderRouteTab();
      case 'weather':
        return renderWeatherTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderTabBar()}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderTabContent()}
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
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    tabButtonActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabButtonText: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
      fontWeight: typography.fontWeight.medium,
    },
    tabButtonTextActive: {
      color: colors.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
    },
    tabContent: {
      flex: 1,
    },
    timingCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    cardTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    timingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    timingItem: {
      flex: 1,
      alignItems: 'center',
    },
    timingDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.separator,
      marginHorizontal: spacing.md,
    },
    timingLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    timingValue: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
    },
    durationContainer: {
      alignItems: 'center',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    durationLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    durationValue: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    distanceValue: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
    },
    transportCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    transportMode: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    transportEmoji: {
      fontSize: 40,
      marginRight: spacing.md,
    },
    transportInfo: {
      flex: 1,
    },
    transportName: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    transportDescription: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    weatherCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    weatherImpact: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderLeftWidth: 4,
    },
    weatherImpactContent: {
      flex: 1,
      marginLeft: spacing.md,
    },
    weatherImpactTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    weatherImpactDescription: {
      fontSize: typography.fontSize.sm,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    weatherImpactFactor: {
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
    },
    bufferCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    bufferContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bufferInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    bufferTime: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    bufferDescription: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    routeCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    routeStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    routeStat: {
      alignItems: 'center',
      flex: 1,
    },
    routeStatLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
    },
    routeStatValue: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
    },
    stepsCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...colors.shadow,
    },
    stepsContainer: {
      maxHeight: 300,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    stepNumberText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semiBold,
      color: '#FFFFFF',
    },
    stepContent: {
      flex: 1,
    },
    stepInstruction: {
      fontSize: typography.fontSize.sm,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    stepDistance: {
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
    },
    moreStepsText: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.md,
      fontStyle: 'italic',
    },
    weatherLocationCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    weatherContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    weatherMain: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    weatherTemp: {
      fontSize: 48,
      fontWeight: typography.fontWeight.light,
      color: colors.text,
      marginRight: spacing.md,
    },
    weatherDetails: {
      flex: 1,
    },
    weatherDescription: {
      fontSize: typography.fontSize.md,
      color: colors.text,
      textTransform: 'capitalize',
      marginBottom: spacing.xs,
    },
    weatherFeels: {
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
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    weatherImpactCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...colors.shadow,
    },
    weatherImpactSummary: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
    },
    impactLevel: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    impactLevelText: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
    },
    impactMultiplier: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    impactDescription: {
      fontSize: typography.fontSize.md,
      color: colors.text,
    },
  })
);

export default CommuteDetailsScreen;