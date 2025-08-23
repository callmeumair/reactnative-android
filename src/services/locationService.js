import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  HOME_LOCATION: 'home_location',
  WORK_LOCATION: 'work_location',
  SAVED_LOCATIONS: 'saved_locations',
  LOCATION_PERMISSIONS: 'location_permissions',
};

/**
 * Request location permissions for Android/iOS
 * @returns {Promise<boolean>} Permission granted status
 */
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'CommuteTimely Location Permission',
          message: 'CommuteTimely needs access to your location to provide accurate commute times.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      
      const backgroundGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Permission',
          message: 'CommuteTimely needs background location access to send timely notifications.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      
      const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_PERMISSIONS, JSON.stringify(hasPermission));
      return hasPermission;
    } else {
      // iOS permissions are handled by the system
      return true;
    }
  } catch (error) {
    console.error('Location permission request error:', error);
    return false;
  }
};

/**
 * Get current user location
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} Current location coordinates
 */
export const getCurrentLocation = async (options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      ...options,
    };

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, timestamp } = position.coords;
        resolve({
          latitude,
          longitude,
          accuracy,
          timestamp,
          coords: [longitude, latitude], // Mapbox format [lng, lat]
        });
      },
      (error) => {
        console.error('Get current location error:', error);
        
        // Handle different error codes
        switch (error.code) {
          case 1:
            reject(new Error('Location permission denied'));
            break;
          case 2:
            reject(new Error('Location unavailable'));
            break;
          case 3:
            reject(new Error('Location request timeout'));
            break;
          default:
            reject(new Error('Unknown location error'));
        }
      },
      defaultOptions
    );
  });
};

/**
 * Watch user location changes
 * @param {Function} onLocationChange - Callback for location updates
 * @param {Object} options - Geolocation options
 * @returns {number} Watch ID for clearing
 */
export const watchLocation = (onLocationChange, options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    distanceFilter: 10, // minimum distance in meters
    interval: 5000, // update interval in ms
    fastestInterval: 2000,
    ...options,
  };

  return Geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy, timestamp } = position.coords;
      onLocationChange({
        latitude,
        longitude,
        accuracy,
        timestamp,
        coords: [longitude, latitude], // Mapbox format
      });
    },
    (error) => {
      console.error('Watch location error:', error);
    },
    defaultOptions
  );
};

/**
 * Clear location watch
 * @param {number} watchId - Watch ID to clear
 */
export const clearLocationWatch = (watchId) => {
  if (watchId) {
    Geolocation.clearWatch(watchId);
  }
};

/**
 * Save home location
 * @param {Object} location - Location object with coordinates and address
 * @returns {Promise<void>}
 */
export const saveHomeLocation = async (location) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HOME_LOCATION, JSON.stringify(location));
  } catch (error) {
    console.error('Save home location error:', error);
    throw error;
  }
};

/**
 * Get saved home location
 * @returns {Promise<Object|null>} Home location or null
 */
export const getHomeLocation = async () => {
  try {
    const locationString = await AsyncStorage.getItem(STORAGE_KEYS.HOME_LOCATION);
    return locationString ? JSON.parse(locationString) : null;
  } catch (error) {
    console.error('Get home location error:', error);
    return null;
  }
};

/**
 * Save work/destination location
 * @param {Object} location - Location object with coordinates and address
 * @returns {Promise<void>}
 */
export const saveWorkLocation = async (location) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WORK_LOCATION, JSON.stringify(location));
  } catch (error) {
    console.error('Save work location error:', error);
    throw error;
  }
};

/**
 * Get saved work/destination location
 * @returns {Promise<Object|null>} Work location or null
 */
export const getWorkLocation = async () => {
  try {
    const locationString = await AsyncStorage.getItem(STORAGE_KEYS.WORK_LOCATION);
    return locationString ? JSON.parse(locationString) : null;
  } catch (error) {
    console.error('Get work location error:', error);
    return null;
  }
};

/**
 * Save a custom location to favorites
 * @param {Object} location - Location object
 * @param {string} name - Custom name for the location
 * @returns {Promise<void>}
 */
export const saveFavoriteLocation = async (location, name) => {
  try {
    const existingLocations = await getSavedLocations();
    const newLocation = {
      ...location,
      name,
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
    };
    
    const updatedLocations = [...existingLocations, newLocation];
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOCATIONS, JSON.stringify(updatedLocations));
  } catch (error) {
    console.error('Save favorite location error:', error);
    throw error;
  }
};

/**
 * Get all saved locations
 * @returns {Promise<Array>} Array of saved locations
 */
export const getSavedLocations = async () => {
  try {
    const locationsString = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_LOCATIONS);
    return locationsString ? JSON.parse(locationsString) : [];
  } catch (error) {
    console.error('Get saved locations error:', error);
    return [];
  }
};

/**
 * Delete a saved location
 * @param {string} locationId - ID of location to delete
 * @returns {Promise<void>}
 */
export const deleteSavedLocation = async (locationId) => {
  try {
    const existingLocations = await getSavedLocations();
    const filteredLocations = existingLocations.filter(loc => loc.id !== locationId);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOCATIONS, JSON.stringify(filteredLocations));
  } catch (error) {
    console.error('Delete saved location error:', error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees value
 * @returns {number} Radians value
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if user is at a specific location (within threshold)
 * @param {Object} currentLocation - Current user location
 * @param {Object} targetLocation - Target location to check
 * @param {number} threshold - Distance threshold in kilometers (default: 0.1km = 100m)
 * @returns {boolean} Whether user is at the target location
 */
export const isAtLocation = (currentLocation, targetLocation, threshold = 0.1) => {
  if (!currentLocation || !targetLocation) return false;
  
  const distance = calculateDistance(currentLocation, targetLocation);
  return distance <= threshold;
};

/**
 * Get location permission status
 * @returns {Promise<boolean>} Permission status
 */
export const getLocationPermissionStatus = async () => {
  try {
    const statusString = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_PERMISSIONS);
    return statusString ? JSON.parse(statusString) : false;
  } catch (error) {
    console.error('Get location permission status error:', error);
    return false;
  }
};