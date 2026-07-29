import { Device } from "../types/device";
import fs from "fs";
import path from "path";

const dataPath = path.join(
  __dirname,
  "../data/devices.json"
);


function loadDevices(): Device[] {

  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(
      dataPath,
      "[]"
    );
  }

  const data = fs.readFileSync(
    dataPath,
    "utf-8"
  );

  return JSON.parse(data);

}


function saveDevices(devices: Device[]) {

  fs.writeFileSync(
    dataPath,
    JSON.stringify(
      devices,
      null,
      2
    )
  );

}

let devices: Device[] = loadDevices();

let nextId =
  devices.length > 0
    ? Math.max(...devices.map(d => d.id ?? 0)) + 1
    : 1;

/* -----------------------------
   GET ALL
------------------------------ */
export function getDevices(): Device[] {
  return devices;
}

/* -----------------------------
   GET ONE
------------------------------ */
export function getDeviceById(id: number): Device | undefined {

  return devices.find(device => device.id === id);
}

/* -----------------------------
   CREATE
------------------------------ */
export function addDevice(device: Omit<Device, "id">): Device {

  const newDevice: Device = {
    ...device,
    id: nextId++,
    zones: device.zones ?? [],
    enabled: device.enabled ?? true,
    sortOrder: device.sortOrder ?? 0,
  };

devices.push(newDevice);

saveDevices(devices);

return newDevice;
}

/* -----------------------------
   UPDATE
------------------------------ */
export function updateDevice(
  id: number,
  updated: Partial<Device>
): Device | null {

  const device = devices.find(d => d.id === id);

  if (!device) {
    return null;
  }

  Object.assign(device, updated);

  saveDevices(devices);

  return device;
}

/* -----------------------------
   DELETE
------------------------------ */
export function deleteDevice(id: number): boolean {

  const index = devices.findIndex(d => d.id === id);

  if (index === -1) {
    return false;
  }

  devices.splice(index, 1);

  saveDevices(devices);

  return true;
}