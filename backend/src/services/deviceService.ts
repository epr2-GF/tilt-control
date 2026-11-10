
import { Device } from "../types/device";
import fs from "fs";
import path from "path";

const dataPath = path.join(__dirname, "../data/devices.json");

const ALLOWED_ZONES = new Set([
  "accueil",
  "epr2",
  "exterior",
  "logement-du-lac",
  "logement-du-tilt",
  "pecherie",
  "restaurant",
  "salle-des-fetes",
  "tilt",
]);

const ALLOWED_CARD_TYPES = new Set([
  "device",
  "binary",
  "rollerShutter",
  "sensor",
  "onOff",
  "lock",
  "minilog",
  "dimmer",
  "runScript",
  "thermostat",
  "weather",
]);

const ENTITY_ID_PATTERN = /^[a-z0-9_]+\.[a-z0-9_]+$/i;

function loadDevices(): Device[] {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, "[]", "utf-8");
  }

  return JSON.parse(fs.readFileSync(dataPath, "utf-8")) as Device[];
}

function saveDevices(devices: Device[]): void {
  fs.writeFileSync(dataPath, JSON.stringify(devices, null, 2), "utf-8");
}

let devices: Device[] = loadDevices();

let nextId =
  devices.length > 0
    ? Math.max(...devices.map(device => device.id ?? 0)) + 1
    : 1;

function validateDeviceFields(value: Partial<Device>): void {
  if (
    value.name !== undefined &&
    (typeof value.name !== "string" ||
      value.name.trim().length === 0 ||
      value.name.length > 200)
  ) {
    throw new Error("Device name must be a non-empty string of at most 200 characters");
  }

  if (
    value.description !== undefined &&
    (typeof value.description !== "string" || value.description.length > 1000)
  ) {
    throw new Error("Invalid device description");
  }

  // Weather station sensor entities
  for (const field of [
    "weatherHumidityEntity",
    "weatherPrecipitationEntity",
    "weatherWindSpeedEntity",
    "weatherWindGustEntity",
    "weatherLightEntity",
  ] as const) {
    const entityId = value[field];

    if (
      entityId !== undefined &&
      (typeof entityId !== "string" ||
        !ENTITY_ID_PATTERN.test(entityId))
    ) {
      throw new Error(`Invalid Home Assistant entity ID: ${field}`);
    }
  }

  if (value.entityId !== undefined) {
    const emptyOnOffEntity =
      value.cardType === "onOff" && value.entityId === "";

    if (
      typeof value.entityId !== "string" ||
      (!emptyOnOffEntity && !ENTITY_ID_PATTERN.test(value.entityId))
    ) {
      throw new Error("Invalid Home Assistant entity ID");
    }
  }


  for (const field of ["statusEntity", "button1Entity", "button2Entity"] as const) {
    const entityId = value[field];

    if (
      entityId !== undefined &&
      entityId !== "" &&
      (typeof entityId !== "string" ||
        !ENTITY_ID_PATTERN.test(entityId))
    ) {
      throw new Error(`Invalid Home Assistant entity ID: ${field}`);
    }
  }

  if (
    value.cardType !== undefined &&
    !ALLOWED_CARD_TYPES.has(value.cardType)
  ) {
    throw new Error("Invalid device card type");
  }

  if (value.zones !== undefined) {
    if (
      !Array.isArray(value.zones) ||
      !value.zones.every(
        zone => typeof zone === "string" && ALLOWED_ZONES.has(zone)
      )
    ) {
      throw new Error("Invalid device zones");
    }
  }

  if (value.enabled !== undefined && typeof value.enabled !== "boolean") {
    throw new Error("Device enabled must be a boolean");
  }

  if (
    value.sortOrder !== undefined &&
    (typeof value.sortOrder !== "number" ||
      !Number.isFinite(value.sortOrder))
  ) {
    throw new Error("Invalid device sort order");
  }

  if (
    value.icon !== undefined &&
    (typeof value.icon !== "string" ||
      value.icon.trim().length === 0 ||
      value.icon.length > 100)
  ) {
    throw new Error("Invalid device icon");
  }

  if (
    value.statusTrue !== undefined &&
    (typeof value.statusTrue !== "string" || value.statusTrue.length > 100)
  ) {
    throw new Error("Invalid device statusTrue");
  }

  if (
    value.statusFalse !== undefined &&
    (typeof value.statusFalse !== "string" || value.statusFalse.length > 100)
  ) {
    throw new Error("Invalid device statusFalse");
  }

  if (
    value.miniLogMode !== undefined &&
    value.miniLogMode !== "normal" &&
    value.miniLogMode !== "pulse"
  ) {
    throw new Error("Invalid MiniLog mode");
  }

  if (
    value.miniLogPulseSeconds !== undefined &&
    (typeof value.miniLogPulseSeconds !== "number" ||
      !Number.isFinite(value.miniLogPulseSeconds) ||
      value.miniLogPulseSeconds <= 0)
  ) {
    throw new Error("Invalid MiniLog pulse duration");
  }
}

function validateCompleteDevice(device: Device): void {
  validateDeviceFields(device);

  if (
    typeof device.name !== "string" ||
    device.name.trim().length === 0 ||
    typeof device.entityId !== "string" ||
    typeof device.cardType !== "string" ||
    typeof device.icon !== "string" ||
    typeof device.enabled !== "boolean" ||
    typeof device.sortOrder !== "number" ||
    !Array.isArray(device.zones)
  ) {
    throw new Error("Device is missing required fields");
  }

  if (device.cardType === "weather") {
    const weatherEntities = [
      device.entityId,
      device.weatherHumidityEntity,
      device.weatherPrecipitationEntity,
      device.weatherWindSpeedEntity,
      device.weatherWindGustEntity,
      device.weatherLightEntity,
    ];

    if (
      weatherEntities.some(
        entity =>
          typeof entity !== "string" ||
          !ENTITY_ID_PATTERN.test(entity)
      )
    ) {
      throw new Error(
        "Weather station requires six valid Home Assistant entities"
      );
    }
  }

  // Read-only cards must not have a command entity as their primary entity.
  // Their primary entity is still required to be a valid entity ID.
  if (
    device.cardType === "runScript" &&
    !device.entityId.startsWith("script.")
  ) {
    throw new Error("Run Script devices must use a script entity");
  }

  if (
    device.cardType === "onOff" &&
    (
      typeof device.button1Entity !== "string" ||
      !ENTITY_ID_PATTERN.test(device.button1Entity) ||
      typeof device.button2Entity !== "string" ||
      !ENTITY_ID_PATTERN.test(device.button2Entity)
    )
  ) {
    throw new Error("OnOff devices require valid button1Entity and button2Entity values");
  }

}


function pickDeviceFields(value: Partial<Device>): Partial<Device> {
  const allowedFields: (keyof Device)[] = [
    "name",
    "description",
    "entityId",
    "statusEntity",
    "button1Entity",
    "button2Entity",
    "humidityEntity",
    "setpointEntity",
    "cardType",
    "statusTrue",
    "statusFalse",
    "zones",
    "icon",
    "enabled",
    "sortOrder",
    "miniLogMode",
    "miniLogPulseSeconds",
    "weatherHumidityEntity",
    "weatherPrecipitationEntity",
    "weatherWindSpeedEntity",
    "weatherWindGustEntity",
    "weatherLightEntity",
  ];

  const result: Partial<Device> = {};

  for (const field of allowedFields) {
    if (value[field] !== undefined) {
      (result as Record<string, unknown>)[field] = value[field];
    }
  }

  return result;
}


/* GET ALL */
export function getDevices(): Device[] {
  return devices;
}

/* GET ONE */
export function getDeviceById(id: number): Device | undefined {
  return devices.find(device => device.id === id);
}

/* CREATE */


export function addDevice(device: Omit<Device, "id">): Device {
  const allowed = pickDeviceFields(device);

  const newDevice: Device = {
    ...(allowed as Omit<Device, "id">),
    id: nextId,
    zones: allowed.zones ?? [],
    enabled: allowed.enabled ?? true,
    sortOrder: allowed.sortOrder ?? 0,
  };

  // Validate after applying defaults.
  validateCompleteDevice(newDevice);

  devices.push(newDevice);

  try {
    saveDevices(devices);
    nextId++;
  } catch (error) {
    devices.pop();
    throw error;
  }

  return newDevice;
}


/* UPDATE */
export function updateDevice(
  id: number,
  updated: Partial<Device>
): Device | null {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  const index = devices.findIndex(device => device.id === id);

  if (index === -1) {
    return null;
  }


  const previous = devices[index];
  const safeUpdate = pickDeviceFields(updated);

  validateDeviceFields(safeUpdate);


  const replacement: Device = {
    ...previous,
    ...safeUpdate,
    id: previous.id,
  };

  validateCompleteDevice(replacement);

  devices[index] = replacement;

  try {
    saveDevices(devices);
  } catch (error) {
    devices[index] = previous;
    throw error;
  }

  return replacement;
}

/* DELETE */
export function deleteDevice(id: number): boolean {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return false;
  }

  const index = devices.findIndex(device => device.id === id);

  if (index === -1) {
    return false;
  }

  const [removed] = devices.splice(index, 1);

  try {
    saveDevices(devices);
  } catch (error) {
    devices.splice(index, 0, removed);
    throw error;
  }

  return true;
}
