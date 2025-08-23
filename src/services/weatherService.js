import axios from 'axios';

// Weatherbit configuration
export const WEATHERBIT_API_KEY = '836afe5ccf9c46e1bc2fa3a894f676b3';
export const WEATHERBIT_BASE_URL = 'https://api.weatherbit.io/v2.0';

/**
 * Get current weather data for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Current weather data
 */
export const getCurrentWeather = async (lat, lon) => {
  try {
    const response = await axios.get(`${WEATHERBIT_BASE_URL}/current`, {
      params: {
        lat,
        lon,
        key: WEATHERBIT_API_KEY,
        include: 'minutely',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Weatherbit Current Weather API Error:', error);
    throw error;
  }
};

/**
 * Get weather forecast for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} days - Number of days to forecast (1-16)
 * @returns {Promise<Object>} Weather forecast data
 */
export const getWeatherForecast = async (lat, lon, days = 1) => {
  try {
    const response = await axios.get(`${WEATHERBIT_BASE_URL}/forecast/daily`, {
      params: {
        lat,
        lon,
        key: WEATHERBIT_API_KEY,
        days: Math.min(days, 16),
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Weatherbit Forecast API Error:', error);
    throw error;
  }
};

/**
 * Get hourly weather forecast for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} hours - Number of hours to forecast (1-120)
 * @returns {Promise<Object>} Hourly weather forecast data
 */
export const getHourlyForecast = async (lat, lon, hours = 24) => {
  try {
    const response = await axios.get(`${WEATHERBIT_BASE_URL}/forecast/hourly`, {
      params: {
        lat,
        lon,
        key: WEATHERBIT_API_KEY,
        hours: Math.min(hours, 120),
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Weatherbit Hourly Forecast API Error:', error);
    throw error;
  }
};

/**
 * Get weather alerts for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather alerts data
 */
export const getWeatherAlerts = async (lat, lon) => {
  try {
    const response = await axios.get(`${WEATHERBIT_BASE_URL}/alerts`, {
      params: {
        lat,
        lon,
        key: WEATHERBIT_API_KEY,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Weatherbit Alerts API Error:', error);
    throw error;
  }
};

/**
 * Analyze weather conditions and determine impact on commute time
 * @param {Object} weather - Weather data from API
 * @returns {Object} Weather impact analysis
 */
export const analyzeWeatherImpact = (weather) => {
  if (!weather || !weather.data || weather.data.length === 0) {
    return {
      impactLevel: 'none',
      factor: 1.0,
      description: 'No weather data available',
    };
  }

  const current = weather.data[0];
  const code = current.weather?.code || 0;
  const precipitation = current.precip || 0;
  const windSpeed = current.wind_spd || 0;
  const visibility = current.vis || 10;
  const temperature = current.temp || 20;

  let impactLevel = 'none';
  let factor = 1.0;
  let description = 'Clear conditions';

  // Rain conditions
  if (code >= 500 && code < 600) {
    if (precipitation > 10) {
      impactLevel = 'high';
      factor = 1.4;
      description = 'Heavy rain - expect significant delays';
    } else if (precipitation > 2.5) {
      impactLevel = 'medium';
      factor = 1.2;
      description = 'Moderate rain - some delays expected';
    } else {
      impactLevel = 'low';
      factor = 1.1;
      description = 'Light rain - minor delays possible';
    }
  }

  // Snow conditions
  if (code >= 600 && code < 700) {
    impactLevel = 'high';
    factor = 1.5;
    description = 'Snow conditions - expect major delays';
  }

  // Fog conditions
  if (code >= 700 && code < 800 || visibility < 1) {
    impactLevel = 'medium';
    factor = 1.3;
    description = 'Poor visibility - drive carefully';
  }

  // Thunderstorm conditions
  if (code >= 200 && code < 300) {
    impactLevel = 'high';
    factor = 1.4;
    description = 'Thunderstorm - expect severe delays';
  }

  // High wind conditions
  if (windSpeed > 15) {
    if (impactLevel === 'none') {
      impactLevel = 'low';
      factor = 1.1;
    }
    description += ' with high winds';
  }

  // Extreme temperature conditions
  if (temperature < -10 || temperature > 40) {
    if (impactLevel === 'none') {
      impactLevel = 'low';
      factor = 1.05;
    }
    description += ' with extreme temperatures';
  }

  return {
    impactLevel,
    factor,
    description,
    conditions: {
      code,
      precipitation,
      windSpeed,
      visibility,
      temperature,
      description: current.weather?.description || 'Unknown',
    },
  };
};

/**
 * Get weather data for multiple locations (origin and destination)
 * @param {Array} locations - Array of {lat, lon} objects
 * @returns {Promise<Array>} Array of weather data for each location
 */
export const getMultiLocationWeather = async (locations) => {
  try {
    const weatherPromises = locations.map(location => 
      getCurrentWeather(location.lat, location.lon)
    );
    
    const weatherData = await Promise.all(weatherPromises);
    return weatherData;
  } catch (error) {
    console.error('Multi-location weather fetch error:', error);
    throw error;
  }
};