import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { getThemeColors, TYPOGRAPHY, SPACING, BORDER_RADIUS, createThemedStyles, getWeatherImpactColor } from '../utils/theme';
import { analyzeWeatherImpact } from '../services/weatherService';

const { width } = Dimensions.get('window');

const WeatherDetailsScreen = ({ route }) => {
  const { weather } = route.params;
  
  const colors = getThemeColors();
  const styles = useThemedStyles();

  if (!weather || !weather.data || weather.data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noDataContainer}>
          <Icon name="cloud-offline" size={64} color={colors.textSecondary} />
          <Text style={styles.noDataText}>No weather data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentWeather = weather.data[0];
  const weatherImpact = analyzeWeatherImpact(weather);

  const renderCurrentWeather = () => (
    <View style={styles.currentWeatherCard}>
      <Text style={styles.cardTitle}>Current Weather</Text>
      
      <View style={styles.currentWeatherContent}>
        <View style={styles.temperatureSection}>
          <Text style={styles.temperature}>{Math.round(currentWeather.temp)}°</Text>
          <View style={styles.temperatureDetails}>
            <Text style={styles.weatherDescription}>
              {currentWeather.weather?.description || 'N/A'}
            </Text>
            <Text style={styles.feelsLike}>
              Feels like {Math.round(currentWeather.app_temp)}°
            </Text>
            <Text style={styles.highLow}>
              H:{Math.round(currentWeather.high_temp || currentWeather.temp)}° 
              L:{Math.round(currentWeather.low_temp || currentWeather.temp)}°
            </Text>
          </View>
        </View>

        <View style={styles.weatherIcon}>
          <Text style={styles.weatherEmoji}>
            {getWeatherEmoji(currentWeather.weather?.code || 800)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderWeatherStats = () => {
    const stats = [
      {
        icon: 'water',
        label: 'Precipitation',
        value: `${currentWeather.precip || 0} mm`,
        color: colors.info,
      },
      {
        icon: 'eye',
        label: 'Visibility',
        value: `${currentWeather.vis || 0} km`,
        color: colors.textSecondary,
      },
      {
        icon: 'speedometer',
        label: 'Wind Speed',
        value: `${Math.round(currentWeather.wind_spd || 0)} km/h`,
        color: colors.warning,
      },
      {
        icon: 'water-outline',
        label: 'Humidity',
        value: `${currentWeather.rh || 0}%`,
        color: colors.secondary,
      },
      {
        icon: 'thermometer',
        label: 'Pressure',
        value: `${Math.round(currentWeather.pres || 0)} mb`,
        color: colors.accent,
      },
      {
        icon: 'sunny',
        label: 'UV Index',
        value: `${currentWeather.uv || 0}`,
        color: colors.warning,
      },
    ];

    return (
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Weather Details</Text>
        
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Icon name={stat.icon} size={24} color={stat.color} />
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderWeatherImpact = () => (
    <View style={styles.impactCard}>
      <Text style={styles.cardTitle}>Commute Impact</Text>
      
      <View style={[
        styles.impactContent,
        { 
          backgroundColor: `${getWeatherImpactColor(weatherImpact.impactLevel)}20`,
          borderColor: getWeatherImpactColor(weatherImpact.impactLevel),
        }
      ]}>
        <View style={styles.impactHeader}>
          <View style={styles.impactLevel}>
            <Text style={[
              styles.impactLevelText,
              { color: getWeatherImpactColor(weatherImpact.impactLevel) }
            ]}>
              {weatherImpact.impactLevel.toUpperCase()}
            </Text>
            <Text style={styles.impactFactor}>
              {weatherImpact.factor.toFixed(1)}x normal time
            </Text>
          </View>
          
          <Icon
            name={getImpactIcon(weatherImpact.impactLevel)}
            size={32}
            color={getWeatherImpactColor(weatherImpact.impactLevel)}
          />
        </View>
        
        <Text style={styles.impactDescription}>
          {weatherImpact.description}
        </Text>

        {weatherImpact.conditions && (
          <View style={styles.conditionsGrid}>
            <View style={styles.conditionItem}>
              <Text style={styles.conditionLabel}>Temperature</Text>
              <Text style={styles.conditionValue}>
                {Math.round(weatherImpact.conditions.temperature)}°C
              </Text>
            </View>
            
            <View style={styles.conditionItem}>
              <Text style={styles.conditionLabel}>Precipitation</Text>
              <Text style={styles.conditionValue}>
                {weatherImpact.conditions.precipitation} mm
              </Text>
            </View>
            
            <View style={styles.conditionItem}>
              <Text style={styles.conditionLabel}>Wind Speed</Text>
              <Text style={styles.conditionValue}>
                {Math.round(weatherImpact.conditions.windSpeed)} km/h
              </Text>
            </View>
            
            <View style={styles.conditionItem}>
              <Text style={styles.conditionLabel}>Visibility</Text>
              <Text style={styles.conditionValue}>
                {weatherImpact.conditions.visibility} km
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderAirQuality = () => {
    if (!currentWeather.aqi) return null;

    return (
      <View style={styles.airQualityCard}>
        <Text style={styles.cardTitle}>Air Quality</Text>
        
        <View style={styles.airQualityContent}>
          <View style={styles.aqiValue}>
            <Text style={styles.aqiNumber}>{currentWeather.aqi}</Text>
            <Text style={styles.aqiLabel}>AQI</Text>
          </View>
          
          <View style={styles.aqiDescription}>
            <Text style={styles.aqiLevel}>
              {getAirQualityLevel(currentWeather.aqi)}
            </Text>
            <Text style={styles.aqiAdvice}>
              {getAirQualityAdvice(currentWeather.aqi)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSunriseSunset = () => (
    <View style={styles.sunCard}>
      <Text style={styles.cardTitle}>Sun & Moon</Text>
      
      <View style={styles.sunContent}>
        <View style={styles.sunItem}>
          <Icon name="sunny" size={24} color={colors.warning} />
          <Text style={styles.sunLabel}>Sunrise</Text>
          <Text style={styles.sunTime}>
            {currentWeather.sunrise ? formatTime(currentWeather.sunrise) : 'N/A'}
          </Text>
        </View>
        
        <View style={styles.sunDivider} />
        
        <View style={styles.sunItem}>
          <Icon name="moon" size={24} color={colors.info} />
          <Text style={styles.sunLabel}>Sunset</Text>
          <Text style={styles.sunTime}>
            {currentWeather.sunset ? formatTime(currentWeather.sunset) : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderCurrentWeather()}
        {renderWeatherStats()}
        {renderWeatherImpact()}
        {renderAirQuality()}
        {renderSunriseSunset()}
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper functions
const getWeatherEmoji = (code) => {
  if (code >= 200 && code < 300) return '⛈️'; // Thunderstorm
  if (code >= 300 && code < 500) return '🌦️'; // Drizzle
  if (code >= 500 && code < 600) return '🌧️'; // Rain
  if (code >= 600 && code < 700) return '🌨️'; // Snow
  if (code >= 700 && code < 800) return '🌫️'; // Atmosphere
  if (code === 800) return '☀️'; // Clear
  if (code > 800) return '☁️'; // Clouds
  return '🌤️'; // Default
};

const getImpactIcon = (level) => {
  switch (level) {
    case 'none': return 'checkmark-circle';
    case 'low': return 'warning';
    case 'medium': return 'alert-circle';
    case 'high': return 'close-circle';
    default: return 'help-circle';
  }
};

const getAirQualityLevel = (aqi) => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const getAirQualityAdvice = (aqi) => {
  if (aqi <= 50) return 'Air quality is satisfactory for most people.';
  if (aqi <= 100) return 'Air quality is acceptable for most people.';
  if (aqi <= 150) return 'Sensitive individuals should limit outdoor exposure.';
  if (aqi <= 200) return 'Everyone should limit outdoor activities.';
  if (aqi <= 300) return 'Everyone should avoid outdoor activities.';
  return 'Emergency conditions - avoid outdoor activities.';
};

const formatTime = (timeString) => {
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return 'N/A';
  }
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
    noDataContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noDataText: {
      fontSize: typography.fontSize.lg,
      color: colors.textSecondary,
      marginTop: spacing.lg,
    },
    cardTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    currentWeatherCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    currentWeatherContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    temperatureSection: {
      flex: 1,
    },
    temperature: {
      fontSize: 72,
      fontWeight: typography.fontWeight.light,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    temperatureDetails: {
      marginLeft: spacing.sm,
    },
    weatherDescription: {
      fontSize: typography.fontSize.lg,
      color: colors.text,
      textTransform: 'capitalize',
      marginBottom: spacing.xs,
    },
    feelsLike: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    highLow: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
    },
    weatherIcon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    weatherEmoji: {
      fontSize: 64,
    },
    statsCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      width: '48%',
      alignItems: 'center',
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    statLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    statValue: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
      textAlign: 'center',
    },
    impactCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    impactContent: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    impactHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    impactLevel: {
      flex: 1,
    },
    impactLevelText: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.xs,
    },
    impactFactor: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    impactDescription: {
      fontSize: typography.fontSize.md,
      color: colors.text,
      marginBottom: spacing.md,
    },
    conditionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    conditionItem: {
      width: '48%',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    conditionLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
    },
    conditionValue: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
    },
    airQualityCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...colors.shadow,
    },
    airQualityContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    aqiValue: {
      alignItems: 'center',
      marginRight: spacing.lg,
    },
    aqiNumber: {
      fontSize: 48,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    aqiLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    },
    aqiDescription: {
      flex: 1,
    },
    aqiLevel: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    aqiAdvice: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      lineHeight: typography.lineHeight.sm,
    },
    sunCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...colors.shadow,
    },
    sunContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sunItem: {
      flex: 1,
      alignItems: 'center',
    },
    sunDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.separator,
      marginHorizontal: spacing.md,
    },
    sunLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    sunTime: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.text,
    },
  })
);

export default WeatherDetailsScreen;