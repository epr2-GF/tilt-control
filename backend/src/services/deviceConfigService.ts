import fs from "fs";
import path from "path";

const DEVICE_FILE = path.join(
  __dirname,
  "../data/devices.json"
);

export function getConfiguredEntities(): string[] {
  const raw = fs.readFileSync(DEVICE_FILE, "utf8");
  const devices = JSON.parse(raw) as any[];

  const entities = devices.flatMap((device: any) => [
    device.entityId,
    device.statusEntity,
    device.button1Entity,
    device.button2Entity,
    device.humidityEntity,
    device.setpointEntity,
  ]);

  return [
    ...new Set(
      entities.filter(
        (entity): entity is string =>
          typeof entity === "string" && entity.length > 0
      )
    ),
  ];
}

export function getDeviceStatusLogEntities(): string[] {
  const raw = fs.readFileSync(DEVICE_FILE, "utf8");
  const devices = JSON.parse(raw) as any[];

  const entities = devices
    .filter(
      (device: any) => device.cardType !== "sensor"
    )
    .flatMap((device: any) => [
      device.entityId,
      device.statusEntity,
      device.button1Entity,
      device.button2Entity,
      device.humidityEntity,
      device.setpointEntity,
    ]);

  return [
    ...new Set(
      entities.filter(
        (entity): entity is string =>
          typeof entity === "string" && entity.length > 0
      )
    ),
  ];
}
