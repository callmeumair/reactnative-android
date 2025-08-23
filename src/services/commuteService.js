import { getDirections, getTrafficAwareRoute } from './mapboxService';
import { getCurrentWeather, analyzeWeatherImpact } from './weatherService';
import { getCurrentLocation } from './locationService';
import { scheduleCommuteReminder } from './notificationService';

/**
 * Transportation mode configurations
 */
export const TRANSPORT_MODES = {
  driving: {
    mapboxProfile: 'driving-traffic',
    baseSpeed: 50, // km/h average
    weatherSensitivity: 'high',
    icon: '🚗',
    name: 'Car',
  },
  walking: {
    mapboxProfile: 'walking',
    baseSpeed: 5, // km/h average
    weatherSensitivity: 'very_high',
    icon: '🚶',
    name: 'Walking',
  },
  cycling: {
    mapboxProfile: 'cycling',
    baseSpeed: 15, // km/h average
    weatherSensitivity: 'very_high',
    icon: '🚲',
    name: 'Cycling',
  },
  transit: {
    mapboxProfile: 'driving', // Fallback to driving for route calculation
    baseSpeed: 30, // km/h average including stops
    weatherSensitivity: 'medium',
    icon: '🚌',
    name: 'Public Transit',
  },
};

/**
 * Calculate optimal commute details including weather and traffic impacts
 * @param {Object} origin - Origin coordinates {latitude, longitude}
 * @param {Object} destination - Destination coordinates {latitude, longitude}
 * @param {string} transportMode - Mode of transportation
 * @param {Date} targetArrivalTime - When user needs to arrive
 * @returns {Promise<Object>} Complete commute calculation
 */
export const calculateCommute = async (origin, destination, transportMode = 'driving', targetArrivalTime = new Date()) => {
  try {
    console.log('Calculating commute...', { origin, destination, transportMode, targetArrivalTime });

    // Validate inputs
    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    const modeConfig = TRANSPORT_MODES[transportMode] || TRANSPORT_MODES.driving;
    const coordinates = [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude]
    ];

    // Get route information from Mapbox
    const routeData = await getTrafficAwareRoute(coordinates);
    
    if (!routeData.routes || routeData.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = routeData.routes[0];
    const baseDuration = route.duration; // in seconds
    const distance = route.distance; // in meters

    // Get weather data for both locations
    const [originWeather, destinationWeather] = await Promise.all([
      getCurrentWeather(origin.latitude, origin.longitude),
      getCurrentWeather(destination.latitude, destination.longitude),
    ]);

    // Analyze weather impact
    const originWeatherImpact = analyzeWeatherImpact(originWeather);
    const destinationWeatherImpact = analyzeWeatherImpact(destinationWeather);

    // Use the higher weather impact for the overall commute
    const weatherImpact = originWeatherImpact.factor > destinationWeatherImpact.factor 
      ? originWeatherImpact 
      : destinationWeatherImpact;

    // Apply weather factor based on transport mode sensitivity
    let adjustedDuration = baseDuration;
    
    if (modeConfig.weatherSensitivity === 'very_high') {
      adjustedDuration *= weatherImpact.factor;
    } else if (modeConfig.weatherSensitivity === 'high') {
      adjustedDuration *= (1 + (weatherImpact.factor - 1) * 0.8);
    } else if (modeConfig.weatherSensitivity === 'medium') {
      adjustedDuration *= (1 + (weatherImpact.factor - 1) * 0.5);
    }

    // Add buffer time based on mode and conditions
    const bufferTime = calculateBufferTime(adjustedDuration, transportMode, weatherImpact);
    const totalDuration = adjustedDuration + bufferTime;

    // Calculate leave time
    const leaveTime = new Date(targetArrivalTime.getTime() - (totalDuration * 1000));

    // Prepare commute result
    const commuteResult = {
      origin,
      destination,
      transportMode,
      route: {
        geometry: route.geometry,
        distance: Math.round(distance / 1000 * 100) / 100, // km, rounded to 2 decimals
        duration: Math.ceil(totalDuration / 60), // minutes, rounded up
        baseDuration: Math.ceil(baseDuration / 60), // minutes without weather impact
        steps: route.legs?.[0]?.steps || [],
      },
      weather: {
        origin: {
          ...originWeatherImpact,
          current: originWeather.data?.[0] || null,
        },
        destination: {
          ...destinationWeatherImpact,
          current: destinationWeather.data?.[0] || null,
        },
        impact: weatherImpact,
      },
      timing: {
        targetArrivalTime,
        leaveTime,
        bufferTime: Math.ceil(bufferTime / 60), // minutes
        totalDuration: Math.ceil(totalDuration / 60), // minutes
      },
      modeConfig,
      calculatedAt: new Date(),
    };

    console.log('Commute calculation completed:', commuteResult);
    return commuteResult;

  } catch (error) {
    console.error('Calculate commute error:', error);
    throw new Error(`Failed to calculate commute: ${error.message}`);
  }
};

/**
 * Calculate buffer time based on various factors
 * @param {number} baseDuration - Base duration in seconds
 * @param {string} transportMode - Mode of transportation
 * @param {Object} weatherImpact - Weather impact analysis
 * @returns {number} Buffer time in seconds
 */
const calculateBufferTime = (baseDuration, transportMode, weatherImpact) => {
  let bufferPercentage = 0.1; // Default 10% buffer

  // Adjust buffer based on transport mode
  switch (transportMode) {
    case 'driving':
      bufferPercentage = 0.15; // 15% for traffic unpredictability
      break;
    case 'transit':
      bufferPercentage = 0.2; // 20% for schedule delays
      break;
    case 'walking':
      bufferPercentage = 0.05; // 5% as walking is more predictable
      break;
    case 'cycling':
      bufferPercentage = 0.1; // 10% standard
      break;
  }

  // Increase buffer based on weather conditions
  if (weatherImpact.impactLevel === 'high') {
    bufferPercentage += 0.1;
  } else if (weatherImpact.impactLevel === 'medium') {
    bufferPercentage += 0.05;
  }

  // Add time-of-day factor (rush hour buffer)
  const now = new Date();
  const hour = now.getHours();
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    bufferPercentage += 0.1; // Additional 10% for rush hour
  }

  return baseDuration * bufferPercentage;
};

/**
 * Schedule commute notification based on calculation
 * @param {Object} commuteData - Commute calculation result
 * @param {number} advanceNoticeMinutes - Minutes before leave time to notify
 * @returns {Promise<void>}
 */
export const scheduleCommuteNotification = async (commuteData, advanceNoticeMinutes = 15) => {
  try {
    const notificationTime = new Date(commuteData.timing.leaveTime.getTime() - (advanceNoticeMinutes * 60 * 1000));
    
    // Don't schedule if notification time is in the past
    if (notificationTime <= new Date()) {
      console.log('Notification time is in the past, skipping schedule');
      return;
    }

    await scheduleCommuteReminder(commuteData, notificationTime);
    console.log('Commute notification scheduled for:', notificationTime);
  } catch (error) {
    console.error('Schedule commute notification error:', error);
    throw error;
  }
};

/**
 * Get real-time commute update
 * @param {Object} savedCommute - Previously calculated commute
 * @returns {Promise<Object>} Updated commute calculation
 */
export const updateCommuteRealtime = async (savedCommute) => {
  try {
    const { origin, destination, transportMode, timing } = savedCommute;
    
    // Recalculate with current conditions
    const updatedCommute = await calculateCommute(
      origin,
      destination,
      transportMode,
      timing.targetArrivalTime
    );

    // Compare with previous calculation
    const timeDifference = updatedCommute.timing.leaveTime.getTime() - savedCommute.timing.leaveTime.getTime();
    const minutesDifference = Math.round(timeDifference / 60000);

    updatedCommute.changes = {
      timeDifference: minutesDifference,
      durationChange: updatedCommute.route.duration - savedCommute.route.duration,
      weatherChanged: updatedCommute.weather.impact.impactLevel !== savedCommute.weather.impact.impactLevel,
    };

    return updatedCommute;
  } catch (error) {
    console.error('Update commute realtime error:', error);
    throw error;
  }
};

/**
 * Analyze multiple route options
 * @param {Object} origin - Origin coordinates
 * @param {Object} destination - Destination coordinates
 * @param {Array} transportModes - Array of transport modes to compare
 * @param {Date} targetArrivalTime - Target arrival time
 * @returns {Promise<Array>} Array of commute options sorted by total time
 */
export const compareCommuteOptions = async (origin, destination, transportModes, targetArrivalTime) => {
  try {
    const promises = transportModes.map(mode => 
      calculateCommute(origin, destination, mode, targetArrivalTime)
        .catch(error => ({
          error: error.message,
          transportMode: mode,
          available: false,
        }))
    );

    const results = await Promise.all(promises);
    
    // Filter successful calculations and sort by duration
    const validResults = results
      .filter(result => !result.error)
      .sort((a, b) => a.route.duration - b.route.duration);

    return validResults;
  } catch (error) {
    console.error('Compare commute options error:', error);
    throw error;
  }
};

/**
 * Get commute history and analytics
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Commute analytics
 */
export const getCommuteAnalytics = async (days = 30) => {
  try {
    // This would typically fetch from a database or storage
    // For now, returning a placeholder structure
    return {
      averageDuration: 0,
      totalCommutes: 0,
      weatherImpactFrequency: {
        none: 0,
        low: 0,
        medium: 0,
        high: 0,
      },
      transportModeUsage: {},
      bestTimes: {
        morning: '8:00 AM',
        evening: '5:30 PM',
      },
      worstConditions: [],
    };
  } catch (error) {
    console.error('Get commute analytics error:', error);
    throw error;
  }
};

/**
 * Validate commute calculation inputs
 * @param {Object} origin - Origin coordinates
 * @param {Object} destination - Destination coordinates
 * @param {string} transportMode - Transport mode
 * @returns {boolean} Whether inputs are valid
 */
export const validateCommuteInputs = (origin, destination, transportMode) => {
  if (!origin || typeof origin.latitude !== 'number' || typeof origin.longitude !== 'number') {
    return false;
  }
  
  if (!destination || typeof destination.latitude !== 'number' || typeof destination.longitude !== 'number') {
    return false;
  }
  
  if (!TRANSPORT_MODES[transportMode]) {
    return false;
  }
  
  return true;
};