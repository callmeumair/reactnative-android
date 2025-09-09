import {MAPBOX_ACCESS_TOKEN} from '../config/keys';

export type LatLng = { latitude: number; longitude: number };

export type EtaResult = {
  durationSeconds: number;
  distanceMeters: number;
  routeGeometry?: string;
};

export interface MapboxPlace {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    address?: string;
    category?: string;
  };
  context?: Array<{
    id: string;
    text: string;
  }>;
}

export interface GeocodingResponse {
  features: MapboxPlace[];
}

export async function fetchDrivingEta(origin: LatLng, destination: LatLng): Promise<EtaResult> {
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_ACCESS_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mapbox Directions error: ${res.status}`);
  }
  const json = await res.json();
  const route = json?.routes?.[0];
  return {
    durationSeconds: Math.round(route?.duration ?? 0),
    distanceMeters: Math.round(route?.distance ?? 0),
    routeGeometry: route?.geometry ? JSON.stringify(route.geometry) : undefined,
  };
}

export async function searchPlaces(query: string, proximity?: LatLng): Promise<MapboxPlace[]> {
  let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=poi,address&limit=10`;
  
  if (proximity) {
    url += `&proximity=${proximity.longitude},${proximity.latitude}`;
  }

  try {
    const response = await fetch(url);
    const data: GeocodingResponse = await response.json();
    
    return data.features || [];
  } catch (error) {
    console.error('Places search error:', error);
    throw new Error('Failed to search places');
  }
}

export async function reverseGeocode(location: LatLng): Promise<string> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.longitude},${location.latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=address`;

  try {
    const response = await fetch(url);
    const data: GeocodingResponse = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    
    return 'Unknown location';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Unknown location';
  }
}

export function formatAddress(place: MapboxPlace): string {
  // Extract meaningful address components
  const parts: string[] = [];
  
  if (place.properties?.address) {
    parts.push(place.properties.address);
  }
  
  if (place.context) {
    const city = place.context.find(c => c.id.includes('place'));
    const region = place.context.find(c => c.id.includes('region'));
    
    if (city) parts.push(city.text);
    if (region) parts.push(region.text);
  }
  
  return parts.length > 0 ? parts.join(', ') : place.place_name;
}

