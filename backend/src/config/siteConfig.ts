
const latitude = Number(process.env.SITE_LATITUDE);
const longitude = Number(process.env.SITE_LONGITUDE);
const radiusMeters = Number(
  process.env.SITE_RADIUS_METERS ?? 500
);

if (
  process.env.SITE_LATITUDE === undefined ||
  process.env.SITE_LONGITUDE === undefined ||
  !Number.isFinite(latitude) ||
  latitude < -90 ||
  latitude > 90 ||
  !Number.isFinite(longitude) ||
  longitude < -180 ||
  longitude > 180
) {
  throw new Error(
    "Invalid site configuration: check SITE_LATITUDE and SITE_LONGITUDE"
  );
}

if (
  !Number.isFinite(radiusMeters) ||
  radiusMeters <= 0
) {
  throw new Error(
    "Invalid site configuration: SITE_RADIUS_METERS must be positive"
  );
}

export const SITE_CONFIG = {
  latitude,
  longitude,
  radiusMeters,
};
