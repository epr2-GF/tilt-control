
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

  const Icon = getDeviceIcon(
    icon || "device"
  );

  return <Icon size={20} />;

}


export default function DeviceRenderer({
  device,
}: {
  device: any;
}) {

  const { states } = useDevices();

  const haState =
    states[device.entityId];

  const icon = (
    <DeviceIcon
      icon={device.icon}
    />
  );


  switch (device.cardType) {


    case "rollerShutter":

      return (
        <RollerShutterCard
          key={device.id}
          device={device}
          icon={icon}
        />
      );


    case "binary":

      return (
        <BinaryControl
          controlId={device.id.toString()}

          commandEntity={
            device.entityId
          }

          statusEntity={
            device.statusEntity ||
            device.entityId
          }

          title={device.name}

          description={
            device.description
          }

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
        />
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
        <BinaryControl
          controlId={device.id.toString()}

          commandEntity={
            device.entityId
          }

          statusEntity={
            device.statusEntity ||
            device.entityId
          }

          title={device.name}

          description={
            device.description
          }

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
        />
      );


    default:

      return null;

  }

}


