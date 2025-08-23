import axios from 'axios';

// Mapbox configuration
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiY29tbXV0ZXRpbWVseSIsImEiOiJjbWUzMzUydmcwMmN1MmtzZnoycGs1ZDhhIn0.438vHnYipmUNS7JoCglyMg';
export const MAPBOX_BASE_URL = 'https://api.mapbox.com';

/**
 * Get directions between two points using Mapbox Directions API
 * @param {Array} coordinates - Array of [lng, lat] coordinates
 * @param {string} profile - Transportation mode (driving-traffic, walking, cycling)
 * @returns {Promise<Object>} Directions response
 */
export const getDirections = async (coordinates, profile = 'driving-traffic') => {
  try {
    const coordString = coordinates.map(coord => coord.join(',')).join(';');
    const url = `${MAPBOX_BASE_URL}/directions/v5/mapbox/${profile}/${coordString}`;
    
    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        geometries: 'geojson',
        steps: true,
        banner_instructions: true,
        voice_instructions: true,
        annotations: 'duration,distance,speed',
        overview: 'full',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Mapbox Directions API Error:', error);
    throw error;
  }
};

/**
 * Get matrix of durations and distances between multiple points
 * @param {Array} coordinates - Array of [lng, lat] coordinates
 * @param {string} profile - Transportation mode
 * @returns {Promise<Object>} Matrix response
 */
export const getMatrix = async (coordinates, profile = 'driving') => {
  try {
    const coordString = coordinates.map(coord => coord.join(',')).join(';');
    const url = `${MAPBOX_BASE_URL}/directions-matrix/v1/mapbox/${profile}/${coordString}`;
    
    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        annotations: 'duration,distance',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Mapbox Matrix API Error:', error);
    throw error;
  }
};

/**
 * Geocode an address to get coordinates
 * @param {string} query - Address or place name
 * @returns {Promise<Object>} Geocoding response
 */
export const geocodeAddress = async (query) => {
  try {
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
    
    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        limit: 5,
        types: 'address,poi',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Mapbox Geocoding API Error:', error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {Array} coordinates - [lng, lat] coordinates
 * @returns {Promise<Object>} Reverse geocoding response
 */
export const reverseGeocode = async (coordinates) => {
  try {
    const [lng, lat] = coordinates;
    const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${lng},${lat}.json`;
    
    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        types: 'address',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Mapbox Reverse Geocoding API Error:', error);
    throw error;
  }
};

/**
 * Get current traffic conditions for a route
 * @param {Array} coordinates - Route coordinates
 * @returns {Promise<Object>} Traffic-aware directions
 */
export const getTrafficAwareRoute = async (coordinates) => {
  try {
    return await getDirections(coordinates, 'driving-traffic');
  } catch (error) {
    console.error('Traffic-aware routing error:', error);
    // Fallback to regular driving directions
    return await getDirections(coordinates, 'driving');
  }
};