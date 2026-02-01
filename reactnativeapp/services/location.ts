/**
 * AWS Location Services Module
 * 
 * Provides geocoding, reverse geocoding, place search, and route calculation
 * using AWS Location Service. This module is standalone and does not modify
 * any existing app behavior - it can be imported and used when needed.
 * 
 * AWS SETUP REQUIRED:
 * 1. Create a Place Index in AWS Location Service (e.g., "metropolis-place-index")
 * 2. Create a Route Calculator in AWS Location Service (e.g., "metropolis-route-calculator")
 * 3. Add permissions to your Cognito Identity Pool's unauthenticated role:
 *    - geo:SearchPlaceIndexForText
 *    - geo:SearchPlaceIndexForPosition
 *    - geo:SearchPlaceIndexForSuggestions
 *    - geo:CalculateRoute
 * 4. Update the PLACE_INDEX_NAME and ROUTE_CALCULATOR_NAME constants below
 */

import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForPositionCommand,
  SearchPlaceIndexForSuggestionsCommand,
  CalculateRouteCommand,
  type SearchPlaceIndexForTextCommandInput,
  type SearchPlaceIndexForPositionCommandInput,
  type SearchPlaceIndexForSuggestionsCommandInput,
  type CalculateRouteCommandInput,
} from '@aws-sdk/client-location';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Location } from '@/types';

// ============================================
// CONFIGURATION
// ============================================

/**
 * AWS Region - matches your Amplify backend region
 * TODO: Update if using a different region
 */
const AWS_REGION = 'us-east-1';

/**
 * Place Index name - create this in AWS Location Service console
 * TODO: Replace with your actual Place Index name after creating it
 */
const PLACE_INDEX_NAME = 'metropolis-place-index';

/**
 * Route Calculator name - create this in AWS Location Service console
 * TODO: Replace with your actual Route Calculator name after creating it
 */
const ROUTE_CALCULATOR_NAME = 'metropolis-route-calculator';

/**
 * Default search bias location (Providence, RI - adjust for your area)
 */
const DEFAULT_BIAS_POSITION: [number, number] = [-71.4128, 41.8240]; // [lng, lat]

// ============================================
// TYPES
// ============================================

export interface PlaceResult {
  placeId: string;
  label: string;
  location: Location;
  addressNumber?: string;
  street?: string;
  municipality?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  categories?: string[];
  relevance?: number;
}

export interface PlaceSuggestion {
  text: string;
  placeId?: string;
}

export interface RouteResult {
  distance: number; // in miles
  duration: number; // in minutes
  legs: RouteLeg[];
  geometry?: Location[]; // route polyline points
}

export interface RouteLeg {
  startPosition: Location;
  endPosition: Location;
  distance: number; // in miles
  duration: number; // in minutes
}

export interface LocationServiceError {
  code: string;
  message: string;
}

// ============================================
// CLIENT INITIALIZATION
// ============================================

let locationClient: LocationClient | null = null;

/**
 * Get or create the AWS Location Service client
 * Uses Cognito credentials from Amplify
 */
async function getLocationClient(): Promise<LocationClient | null> {
  if (locationClient) {
    return locationClient;
  }

  try {
    const session = await fetchAuthSession();
    const credentials = session.credentials;

    if (!credentials) {
      console.warn('[LocationService] No credentials available - AWS Location Service disabled');
      return null;
    }

    locationClient = new LocationClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    return locationClient;
  } catch (error) {
    console.warn('[LocationService] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Check if AWS Location Service is available
 */
export async function isLocationServiceAvailable(): Promise<boolean> {
  const client = await getLocationClient();
  return client !== null;
}

// ============================================
// GEOCODING - Address to Coordinates
// ============================================

/**
 * Search for places by text (address, place name, etc.)
 * 
 * @param text - Search query (address or place name)
 * @param options - Optional search parameters
 * @returns Array of place results
 * 
 * @example
 * const results = await searchPlaceByText('123 Main Street, Providence, RI');
 * if (results.length > 0) {
 *   console.log(results[0].location); // { latitude: 41.82, longitude: -71.41 }
 * }
 */
export async function searchPlaceByText(
  text: string,
  options?: {
    maxResults?: number;
    biasPosition?: [number, number]; // [longitude, latitude]
    filterCountries?: string[];
  }
): Promise<PlaceResult[]> {
  const client = await getLocationClient();
  
  if (!client) {
    console.log('[LocationService] Using mock geocoding for:', text);
    return mockSearchPlaceByText(text);
  }

  try {
    const input: SearchPlaceIndexForTextCommandInput = {
      IndexName: PLACE_INDEX_NAME,
      Text: text,
      MaxResults: options?.maxResults ?? 5,
      BiasPosition: options?.biasPosition ?? DEFAULT_BIAS_POSITION,
      FilterCountries: options?.filterCountries,
    };

    const command = new SearchPlaceIndexForTextCommand(input);
    const response = await client.send(command);

    return (response.Results ?? []).map((result) => ({
      placeId: result.PlaceId ?? '',
      label: result.Place?.Label ?? '',
      location: {
        latitude: result.Place?.Geometry?.Point?.[1] ?? 0,
        longitude: result.Place?.Geometry?.Point?.[0] ?? 0,
        address: result.Place?.Label,
        neighborhood: result.Place?.Neighborhood,
      },
      addressNumber: result.Place?.AddressNumber,
      street: result.Place?.Street,
      municipality: result.Place?.Municipality,
      region: result.Place?.Region,
      postalCode: result.Place?.PostalCode,
      country: result.Place?.Country,
      categories: result.Place?.Categories,
      relevance: result.Relevance,
    }));
  } catch (error) {
    console.error('[LocationService] searchPlaceByText error:', error);
    return mockSearchPlaceByText(text);
  }
}

/**
 * Get place suggestions as user types (for autocomplete)
 * 
 * @param text - Partial search text
 * @param options - Optional search parameters
 * @returns Array of suggestions
 */
export async function getPlaceSuggestions(
  text: string,
  options?: {
    maxResults?: number;
    biasPosition?: [number, number];
  }
): Promise<PlaceSuggestion[]> {
  const client = await getLocationClient();

  if (!client) {
    return mockGetPlaceSuggestions(text);
  }

  try {
    const input: SearchPlaceIndexForSuggestionsCommandInput = {
      IndexName: PLACE_INDEX_NAME,
      Text: text,
      MaxResults: options?.maxResults ?? 5,
      BiasPosition: options?.biasPosition ?? DEFAULT_BIAS_POSITION,
    };

    const command = new SearchPlaceIndexForSuggestionsCommand(input);
    const response = await client.send(command);

    return (response.Results ?? []).map((result) => ({
      text: result.Text ?? '',
      placeId: result.PlaceId,
    }));
  } catch (error) {
    console.error('[LocationService] getPlaceSuggestions error:', error);
    return mockGetPlaceSuggestions(text);
  }
}

// ============================================
// REVERSE GEOCODING - Coordinates to Address
// ============================================

/**
 * Get address information from coordinates (reverse geocoding)
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param options - Optional search parameters
 * @returns Place result or null if not found
 * 
 * @example
 * const place = await reverseGeocode(41.8240, -71.4128);
 * if (place) {
 *   console.log(place.label); // "123 Main St, Providence, RI 02903"
 * }
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  options?: {
    maxResults?: number;
  }
): Promise<PlaceResult | null> {
  const client = await getLocationClient();

  if (!client) {
    console.log('[LocationService] Using mock reverse geocoding');
    return mockReverseGeocode(latitude, longitude);
  }

  try {
    const input: SearchPlaceIndexForPositionCommandInput = {
      IndexName: PLACE_INDEX_NAME,
      Position: [longitude, latitude], // AWS uses [lng, lat] order
      MaxResults: options?.maxResults ?? 1,
    };

    const command = new SearchPlaceIndexForPositionCommand(input);
    const response = await client.send(command);

    const result = response.Results?.[0];
    if (!result) return null;

    return {
      placeId: result.PlaceId ?? '',
      label: result.Place?.Label ?? '',
      location: {
        latitude: result.Place?.Geometry?.Point?.[1] ?? latitude,
        longitude: result.Place?.Geometry?.Point?.[0] ?? longitude,
        address: result.Place?.Label,
        neighborhood: result.Place?.Neighborhood,
      },
      addressNumber: result.Place?.AddressNumber,
      street: result.Place?.Street,
      municipality: result.Place?.Municipality,
      region: result.Place?.Region,
      postalCode: result.Place?.PostalCode,
      country: result.Place?.Country,
      categories: result.Place?.Categories,
      relevance: result.Relevance,
    };
  } catch (error) {
    console.error('[LocationService] reverseGeocode error:', error);
    return mockReverseGeocode(latitude, longitude);
  }
}

// ============================================
// ROUTE CALCULATION
// ============================================

/**
 * Calculate a route between two or more points
 * 
 * @param waypoints - Array of locations (minimum 2)
 * @param options - Optional route parameters
 * @returns Route result with distance, duration, and legs
 * 
 * @example
 * const route = await calculateRoute([
 *   { latitude: 41.8240, longitude: -71.4128 }, // Start
 *   { latitude: 41.8300, longitude: -71.4000 }, // End
 * ]);
 * console.log(`${route.distance} miles, ${route.duration} minutes`);
 */
export async function calculateRoute(
  waypoints: Location[],
  options?: {
    travelMode?: 'Car' | 'Truck' | 'Walking';
    avoidTolls?: boolean;
    avoidFerries?: boolean;
  }
): Promise<RouteResult | null> {
  if (waypoints.length < 2) {
    console.error('[LocationService] calculateRoute requires at least 2 waypoints');
    return null;
  }

  const client = await getLocationClient();

  if (!client) {
    console.log('[LocationService] Using mock route calculation');
    return mockCalculateRoute(waypoints);
  }

  try {
    // Convert waypoints to AWS format [lng, lat]
    const departurePosition: [number, number] = [
      waypoints[0].longitude,
      waypoints[0].latitude,
    ];
    const destinationPosition: [number, number] = [
      waypoints[waypoints.length - 1].longitude,
      waypoints[waypoints.length - 1].latitude,
    ];

    // Intermediate waypoints (if any)
    const waypointPositions: [number, number][] = waypoints
      .slice(1, -1)
      .map((wp) => [wp.longitude, wp.latitude]);

    const input: CalculateRouteCommandInput = {
      CalculatorName: ROUTE_CALCULATOR_NAME,
      DeparturePosition: departurePosition,
      DestinationPosition: destinationPosition,
      WaypointPositions: waypointPositions.length > 0 ? waypointPositions : undefined,
      TravelMode: options?.travelMode ?? 'Car',
      CarModeOptions: {
        AvoidTolls: options?.avoidTolls ?? false,
        AvoidFerries: options?.avoidFerries ?? false,
      },
      IncludeLegGeometry: true,
    };

    const command = new CalculateRouteCommand(input);
    const response = await client.send(command);

    // Convert distance from meters to miles
    const distanceInMiles = (response.Summary?.Distance ?? 0) * 0.000621371;
    // Duration is already in seconds, convert to minutes
    const durationInMinutes = (response.Summary?.DurationSeconds ?? 0) / 60;

    const legs: RouteLeg[] = (response.Legs ?? []).map((leg) => ({
      startPosition: {
        latitude: leg.StartPosition?.[1] ?? 0,
        longitude: leg.StartPosition?.[0] ?? 0,
      },
      endPosition: {
        latitude: leg.EndPosition?.[1] ?? 0,
        longitude: leg.EndPosition?.[0] ?? 0,
      },
      distance: (leg.Distance ?? 0) * 0.000621371, // meters to miles
      duration: (leg.DurationSeconds ?? 0) / 60, // seconds to minutes
    }));

    // Extract route geometry if available
    const geometry: Location[] = [];
    response.Legs?.forEach((leg) => {
      leg.Geometry?.LineString?.forEach((point) => {
        geometry.push({
          latitude: point[1],
          longitude: point[0],
        });
      });
    });

    return {
      distance: Math.round(distanceInMiles * 100) / 100,
      duration: Math.round(durationInMinutes),
      legs,
      geometry: geometry.length > 0 ? geometry : undefined,
    };
  } catch (error) {
    console.error('[LocationService] calculateRoute error:', error);
    return mockCalculateRoute(waypoints);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate straight-line distance between two points (Haversine formula)
 * Useful when AWS Location Service is not available
 * 
 * @param from - Starting location
 * @param to - Ending location
 * @returns Distance in miles
 */
export function calculateStraightLineDistance(from: Location, to: Location): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 100) / 100;
}

/**
 * Estimate driving time based on distance
 * Uses average speed assumption when route calculation is unavailable
 * 
 * @param distanceMiles - Distance in miles
 * @param avgSpeedMph - Average speed in mph (default: 25 for urban areas)
 * @returns Estimated duration in minutes
 */
export function estimateDrivingTime(distanceMiles: number, avgSpeedMph: number = 25): number {
  return Math.round((distanceMiles / avgSpeedMph) * 60);
}

/**
 * Get distance and duration between two points
 * Tries AWS Location Service first, falls back to estimation
 * 
 * @param from - Starting location
 * @param to - Ending location
 * @returns Object with distance (miles) and duration (minutes)
 */
export async function getDistanceAndDuration(
  from: Location,
  to: Location
): Promise<{ distance: number; duration: number }> {
  // Try AWS route calculation first
  const route = await calculateRoute([from, to]);
  
  if (route) {
    return {
      distance: route.distance,
      duration: route.duration,
    };
  }

  // Fall back to straight-line estimation
  const distance = calculateStraightLineDistance(from, to);
  const duration = estimateDrivingTime(distance);

  return { distance, duration };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ============================================
// MOCK IMPLEMENTATIONS
// ============================================

/**
 * Mock implementations for when AWS Location Service is not available
 * These provide reasonable fallback behavior for development/testing
 */

function mockSearchPlaceByText(text: string): PlaceResult[] {
  // Return a mock result based on the search text
  return [
    {
      placeId: `mock-${Date.now()}`,
      label: text,
      location: {
        latitude: DEFAULT_BIAS_POSITION[1] + (Math.random() - 0.5) * 0.01,
        longitude: DEFAULT_BIAS_POSITION[0] + (Math.random() - 0.5) * 0.01,
        address: text,
      },
      municipality: 'Providence',
      region: 'Rhode Island',
      country: 'USA',
      relevance: 0.8,
    },
  ];
}

function mockGetPlaceSuggestions(text: string): PlaceSuggestion[] {
  const suggestions = [
    `${text}, Providence, RI`,
    `${text} Street, Providence, RI`,
    `${text} Avenue, Providence, RI`,
  ];
  
  return suggestions.map((s, i) => ({
    text: s,
    placeId: `mock-suggestion-${i}`,
  }));
}

function mockReverseGeocode(latitude: number, longitude: number): PlaceResult {
  return {
    placeId: `mock-reverse-${Date.now()}`,
    label: `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? 'E' : 'W'}`,
    location: {
      latitude,
      longitude,
      address: 'Mock Address, Providence, RI',
    },
    municipality: 'Providence',
    region: 'Rhode Island',
    country: 'USA',
    relevance: 1.0,
  };
}

function mockCalculateRoute(waypoints: Location[]): RouteResult {
  // Calculate straight-line distances between consecutive waypoints
  let totalDistance = 0;
  const legs: RouteLeg[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const distance = calculateStraightLineDistance(waypoints[i], waypoints[i + 1]);
    // Add 30% for road routing (roads aren't straight lines)
    const roadDistance = distance * 1.3;
    const duration = estimateDrivingTime(roadDistance);

    legs.push({
      startPosition: waypoints[i],
      endPosition: waypoints[i + 1],
      distance: Math.round(roadDistance * 100) / 100,
      duration,
    });

    totalDistance += roadDistance;
  }

  return {
    distance: Math.round(totalDistance * 100) / 100,
    duration: legs.reduce((sum, leg) => sum + leg.duration, 0),
    legs,
  };
}

// ============================================
// EXPORTS SUMMARY
// ============================================

/**
 * This module exports the following functions:
 * 
 * Configuration:
 * - isLocationServiceAvailable() - Check if AWS Location Service is ready
 * 
 * Geocoding:
 * - searchPlaceByText(text, options?) - Search for places by address/name
 * - getPlaceSuggestions(text, options?) - Get autocomplete suggestions
 * - reverseGeocode(lat, lng, options?) - Get address from coordinates
 * 
 * Routing:
 * - calculateRoute(waypoints, options?) - Get route between points
 * - getDistanceAndDuration(from, to) - Quick distance/duration lookup
 * 
 * Utilities:
 * - calculateStraightLineDistance(from, to) - Haversine distance
 * - estimateDrivingTime(distance, speed?) - Time estimation
 * 
 * All functions gracefully fall back to mock/estimation when AWS is unavailable.
 */

