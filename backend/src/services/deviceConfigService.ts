import fs from "fs";
import path from "path";

const DEVICE_FILE = path.join(
  __dirname,
  "../data/devices.json"
);

export function getConfiguredEntities(): string[] {

  const raw = fs.readFileSync(
    DEVICE_FILE,
    "utf8"
  );

  const devices = JSON.parse(raw) as any[];

  const entities = devices.flatMap((device:any)=>[
    device.entityId,        // command entity
    device.statusEntity      // status entity
  ]);

  return [
    ...new Set(
      entities.filter(
        (entity): entity is string => Boolean(entity)
      )
    )
  ];

}