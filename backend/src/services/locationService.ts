import { SITE_CONFIG } from "../config/siteConfig";


export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {

  const R = 6371000;

  const toRadians = (degrees: number) =>
    degrees * (Math.PI / 180);

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);

  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

export function isWithinSiteRadius(
  latitude: number,
  longitude: number
) {

  const distance = calculateDistanceMeters(
    SITE_CONFIG.latitude,
    SITE_CONFIG.longitude,
    latitude,
    longitude
  );

  return {
    distance,
    inside: distance <= SITE_CONFIG.radiusMeters,
  };
}