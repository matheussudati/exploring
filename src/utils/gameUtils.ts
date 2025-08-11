import type { LatLng } from '../types/game';

export function metersToLatLngDelta(
  latDegrees: number,
  moveEastMeters: number,
  moveNorthMeters: number
) {
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos((latDegrees * Math.PI) / 180);

  const deltaLat = moveNorthMeters / metersPerDegreeLat;
  const deltaLng =
    metersPerDegreeLng === 0 ? 0 : moveEastMeters / metersPerDegreeLng;

  return { deltaLat, deltaLng };
}

export function latLngToMeters(
  latDegrees: number,
  deltaLat: number,
  deltaLng: number
) {
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos((latDegrees * Math.PI) / 180);

  const metersNorth = deltaLat * metersPerDegreeLat;
  const metersEast = deltaLng * metersPerDegreeLng;

  return { metersNorth, metersEast };
}

export function calculateDistance(pos1: LatLng, pos2: LatLng): number {
  const { metersNorth, metersEast } = latLngToMeters(
    pos1.lat,
    pos2.lat - pos1.lat,
    pos2.lng - pos1.lng
  );
  return Math.sqrt(metersNorth * metersNorth + metersEast * metersEast);
}

export function calculateAngle(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function normalizeDirection(deltaX: number, deltaY: number) {
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  return {
    x: length > 0 ? deltaX / length : 0,
    y: length > 0 ? deltaY / length : 0,
  };
}

export function generateRandomPosition(center: LatLng, radiusMeters: number): LatLng {
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusMeters;
  
  const { deltaLat, deltaLng } = metersToLatLngDelta(
    center.lat,
    Math.cos(angle) * distance,
    Math.sin(angle) * distance
  );

  return {
    lat: center.lat + deltaLat,
    lng: center.lng + deltaLng,
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}
