export const SITE_CONFIG = {
  latitude: Number(process.env.SITE_LATITUDE),
  longitude: Number(process.env.SITE_LONGITUDE),
  radiusMeters: Number(process.env.SITE_RADIUS_METERS || 500),
};