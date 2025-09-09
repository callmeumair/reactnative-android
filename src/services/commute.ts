import {fetchDrivingEta, LatLng} from './directions';
import {fetchWeatherByLatLng, WeatherCondition} from './weatherbit';
import {databaseService, Destination} from './database';

export interface CommuteResult {
  leaveTime: string; // HH:MM format
  duration: number; // seconds
  weatherCondition: string;
  weatherDelay: number; // seconds
  arrivalTime: string; // HH:MM format
}

export interface WeatherDelayConfig {
  rain: number; // minutes
  snow: number; // minutes
  storm: number; // minutes
  fog: number; // minutes
  heavyRain: number; // minutes
}

const DEFAULT_WEATHER_DELAYS: WeatherDelayConfig = {
  rain: 5,
  snow: 15,
  storm: 20,
  fog: 10,
  heavyRain: 10,
};

export class CommuteCalculator {
  private origin: LatLng;
  private weatherDelayConfig: WeatherDelayConfig;

  constructor(origin: LatLng, weatherDelayConfig?: WeatherDelayConfig) {
    this.origin = origin;
    this.weatherDelayConfig = weatherDelayConfig || DEFAULT_WEATHER_DELAYS;
  }

  async calculateCommute(destination: Destination): Promise<CommuteResult> {
    try {
      console.log(`Calculating commute for ${destination.name}`);

      // Get current traffic-aware travel time
      const eta = await fetchDrivingEta(this.origin, {
        latitude: destination.latitude,
        longitude: destination.longitude,
      });

      // Get current weather conditions
      const weather = await fetchWeatherByLatLng(
        destination.latitude,
        destination.longitude
      );

      // Calculate weather delay
      const weatherDelay = this.calculateWeatherDelay(weather);

      // Calculate leave time
      const leaveTime = this.calculateLeaveTime(
        destination.arrivalTime,
        eta.durationSeconds,
        weatherDelay
      );

      const result: CommuteResult = {
        leaveTime,
        duration: eta.durationSeconds,
        weatherCondition: weather.description,
        weatherDelay,
        arrivalTime: destination.arrivalTime,
      };

      // Save calculation to database
      await this.saveCalculation(destination.id, result);

      return result;
    } catch (error) {
      console.error('Commute calculation failed:', error);
      throw new Error(`Failed to calculate commute for ${destination.name}`);
    }
  }

  private calculateWeatherDelay(weather: WeatherCondition): number {
    const condition = weather.description.toLowerCase();
    let delayMinutes = 0;

    // Precipitation-based delays
    if (weather.precipitationProbability > 70) {
      if (condition.includes('snow') || condition.includes('blizzard')) {
        delayMinutes = this.weatherDelayConfig.snow;
      } else if (condition.includes('storm') || condition.includes('thunder')) {
        delayMinutes = this.weatherDelayConfig.storm;
      } else if (condition.includes('heavy rain') || weather.precipitationProbability > 90) {
        delayMinutes = this.weatherDelayConfig.heavyRain;
      } else if (condition.includes('rain') || condition.includes('drizzle')) {
        delayMinutes = this.weatherDelayConfig.rain;
      }
    }

    // Visibility-based delays
    if (condition.includes('fog') || condition.includes('mist')) {
      delayMinutes = Math.max(delayMinutes, this.weatherDelayConfig.fog);
    }

    // Wind-based delays
    if (weather.windSpeed > 15) { // High wind (>15 m/s)
      delayMinutes += 5;
    }

    console.log(`Weather delay: ${delayMinutes} minutes for condition: ${condition}`);
    return delayMinutes * 60; // Convert to seconds
  }

  private calculateLeaveTime(
    arrivalTime: string, // HH:MM
    durationSeconds: number,
    weatherDelaySeconds: number
  ): string {
    // Parse arrival time
    const [arrivalHour, arrivalMinute] = arrivalTime.split(':').map(Number);
    
    // Create arrival date for today
    const today = new Date();
    const arrivalDate = new Date(today);
    arrivalDate.setHours(arrivalHour, arrivalMinute, 0, 0);

    // If arrival time is before current time, assume it's for tomorrow
    if (arrivalDate.getTime() < today.getTime()) {
      arrivalDate.setDate(arrivalDate.getDate() + 1);
    }

    // Calculate total travel time including weather delay and 5-minute buffer
    const totalTravelTimeMs = (durationSeconds + weatherDelaySeconds + 300) * 1000; // +5 min buffer

    // Calculate leave time
    const leaveDate = new Date(arrivalDate.getTime() - totalTravelTimeMs);

    // Format as HH:MM
    const hours = leaveDate.getHours().toString().padStart(2, '0');
    const minutes = leaveDate.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  private async saveCalculation(destinationId: string, result: CommuteResult): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    await databaseService.saveCommuteCalculation({
      destinationId,
      date: today,
      leaveTime: result.leaveTime,
      duration: result.duration,
      weatherCondition: result.weatherCondition,
      weatherDelay: result.weatherDelay,
    });
  }

  updateOrigin(newOrigin: LatLng): void {
    this.origin = newOrigin;
  }

  updateWeatherDelayConfig(config: Partial<WeatherDelayConfig>): void {
    this.weatherDelayConfig = { ...this.weatherDelayConfig, ...config };
  }
}

export async function calculateAllDestinations(
  origin: LatLng,
  destinations: Destination[]
): Promise<Map<string, CommuteResult>> {
  const calculator = new CommuteCalculator(origin);
  const results = new Map<string, CommuteResult>();

  for (const destination of destinations) {
    try {
      const result = await calculator.calculateCommute(destination);
      results.set(destination.id, result);
    } catch (error) {
      console.error(`Failed to calculate commute for ${destination.name}:`, error);
    }
  }

  return results;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function getWeatherIcon(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
    return '☀️';
  } else if (lowerCondition.includes('cloud')) {
    return '☁️';
  } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return '🌧️';
  } else if (lowerCondition.includes('snow')) {
    return '❄️';
  } else if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
    return '⛈️';
  } else if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
    return '🌫️';
  }
  
  return '🌤️'; // Default partially cloudy
}
