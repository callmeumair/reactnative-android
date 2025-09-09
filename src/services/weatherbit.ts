import {WEATHERBIT_API_KEY} from '../config/keys';

export type WeatherSummary = {
  temperatureC: number;
  precipitationProbability: number;
  description: string;
};

export async function fetchWeatherByLatLng(lat: number, lon: number): Promise<WeatherSummary> {
  const url = `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${WEATHERBIT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weatherbit error: ${res.status}`);
  }
  const json = await res.json();
  const data = json?.data?.[0];
  return {
    temperatureC: data?.temp ?? 0,
    precipitationProbability: data?.precip ?? 0,
    description: data?.weather?.description ?? 'Unknown',
  };
}

