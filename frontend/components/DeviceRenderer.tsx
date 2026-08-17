"use client";

import BinaryControl from "@/components/BinaryControl";
import RollerShutterCard from "@/components/RollerShutterCard";
import SensorCard from "@/components/SensorCard";

import { useDevices } from "@/context/DeviceContext";

import {
  Camera,
  CircleHelp,
  DoorOpen,
  Droplets,
  Fan,
  Gauge,
  Home,
  Lightbulb,
  Lock,
  Power,
  Settings,
  Sun,
  Thermometer,
  ToggleLeft,
  Unlock,
  Warehouse,
  ArrowRightLeft,
} from "lucide-react";

function getDeviceIcon(iconName: string) {
  const icons: Record<string, React.ElementType> = {
    device: CircleHelp,
    door: DoorOpen,
    light: Lightbulb,
    warehouse: Warehouse,
    power: Power,
    fan: Fan,
    thermometer: Thermometer,
    camera: Camera,
    lock: Lock,
    unlock: Unlock,
    water: Droplets,
    sun: Sun,
    home: Home,
    switch: ToggleLeft,
    gauge: Gauge,
    settings: Settings,
    gateslide: ArrowRightLeft,
  };

  return icons[iconName] || CircleHelp;
}

function DeviceIcon({
  icon,
}: {
  icon?: string;
}) {
  const Icon = getDeviceIcon(icon || "device");

  return <Icon size={20} />;
}

export default function DeviceRenderer({
  device,
}: {
  device: any;
}) {
  const { states } = useDevices();

  const haState = states[device.entityId];

  const icon = (
    <DeviceIcon
      icon={device.icon}
    />
  );

  /*
   * Device is considered disabled when enabled is explicitly false.
   *
   * This means older devices that don't have the enabled property
   * will continue to work normally.
   */
  const disabled = device.enabled === false;

  switch (device.cardType) {
    case "rollerShutter":
      return (
        <div
          key={device.id}
          className={
            disabled
              ? "bg-orange-950/30 border border-orange-700/60 rounded-xl p-1"
              : ""
          }
        >
          <RollerShutterCard
            device={device}
            icon={icon}
            disabled={disabled}
          />
        </div>
      );

    case "binary":
      return (
        <div
          key={device.id}
          className={
            disabled
              ? "bg-orange-950/30 border border-orange-700/60 rounded-xl p-1"
              : ""
          }
        >
          <BinaryControl
            controlId={device.id.toString()}
            commandEntity={device.entityId}
            statusEntity={
              device.statusEntity ||
              device.entityId
            }
            title={device.name}
            description={device.description}
            icon={icon}
            onText={
              device.statusTrue ||
              "ON"
            }
            offText={
              device.statusFalse ||
              "OFF"
            }
            buttonText="Commander"
            disabled={disabled}
          />
        </div>
      );

    case "sensor": {
      const value =
        haState?.state ??
        "--";

      const unit =
        haState?.attributes
          ?.unit_of_measurement ??
        "";

      return (
        <SensorCard
          title={device.name}
          description={device.description}
          value={value}
          unit={unit}
          icon={icon}
        />
      );
    }

    case "device":
      return (
        <div
          key={device.id}
          className={
            disabled
              ? "bg-orange-950/30 border border-orange-700/60 rounded-xl p-1"
              : ""
          }
        >
          <BinaryControl
            controlId={device.id.toString()}
            commandEntity={device.entityId}
            statusEntity={
              device.statusEntity ||
              device.entityId
            }
            title={device.name}
            description={device.description}
            icon={icon}
            onText={
              device.statusTrue ||
              "ON"
            }
            offText={
              device.statusFalse ||
              "OFF"
            }
            buttonText="Commander"
            disabled={disabled}
          />
        </div>
      );

    default:
      return null;
  }
}