
import type { Device } from "../types/device";

type AccessUser = {
  id?: string | number;
  username?: string;
  zones?: string[];
  capabilities?: {
    manageUsers?: boolean;
  };
};

export function isGhostAdmin(user: AccessUser | undefined | null): boolean {
  return (
    String(user?.id) === "0" &&
    user?.username === "GhostAdmin"
  );
}

/**
 * Determines whether an authenticated user may access a device.
 *
 * "accueil" is shared access, not a restricted user zone.
 * Normal administrator capability does not bypass zone checks.
 */
export function canAccessDevice(
  user: AccessUser | undefined | null,
  device: Device | undefined | null
): boolean {
  if (!user || !device) {
    return false;
  }

  if (isGhostAdmin(user)) {
    return true;
  }

  const deviceZones = Array.isArray(device.zones)
    ? device.zones.filter(
        (zone): zone is string => typeof zone === "string"
      )
    : [];

  // No zones means no access for ordinary users or normal admins.
  if (deviceZones.length === 0) {
    return false;
  }

  // Shared home devices are available to all authenticated users.
  if (deviceZones.includes("accueil")) {
    return true;
  }

  const userZones = Array.isArray(user.zones)
    ? user.zones
    : [];

  return deviceZones.some(zone => userZones.includes(zone));
}

/**
 * Returns every entity associated with devices the user can access.
 * Includes ON/OFF button entities so their states can be streamed safely.
 */
export function getAccessibleEntityIds(
  user: AccessUser | undefined | null,
  devices: Device[]
): Set<string> {
  const entities = new Set<string>();

  if (!user) {
    return entities;
  }

  for (const device of devices) {
    if (!canAccessDevice(user, device)) {
      continue;
    }

for (const entityId of [
  device.entityId,
  device.statusEntity,
  device.button1Entity,
  device.button2Entity,
  device.humidityEntity,
  device.setpointEntity,
]) {
      if (typeof entityId === "string" && entityId.length > 0) {
        entities.add(entityId);
      }
    }
  }

  return entities;
}
