
"use client";

import { useDevices } from "@/context/DeviceContext";
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  Sun,
} from "lucide-react";

type WeatherStationCardProps = {
  device: any;
};

export default function WeatherStationCard({
  device,
}: WeatherStationCardProps) {
  const { states } = useDevices();

  const readings = [
    {
      label: "Température",
      entity: device.entityId,
      icon: Thermometer,
      unit: "°C",
    },
    {
      label: "Humidité",
      entity: device.weatherHumidityEntity,
      icon: Droplets,
      unit: "%",
    },
    {
      label: "Précipitations",
      entity: device.weatherPrecipitationEntity,
      icon: CloudRain,
      unit: "mm",
    },
    {
      label: "Vitesse du vent",
      entity: device.weatherWindSpeedEntity,
      icon: Wind,
      unit: "m/s",
    },
    {
      label: "Rafales",
      entity: device.weatherWindGustEntity,
      icon: Wind,
      unit: "m/s",
    },
    {
      label: "Luminosité",
      entity: device.weatherLightEntity,
      icon: Sun,
      unit: "lx",
    },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm">
          {device.name}
        </div>
        <Sun size={18} className="text-yellow-400" />
      </div>

      <div className="grid grid-cols-3 gap-x-3 gap-y-4">
        {readings.map((reading) => {
          const Icon = reading.icon;
          const rawValue = reading.entity
            ? states[reading.entity]?.state
            : undefined;

          const validValue =
            rawValue !== undefined &&
            rawValue !== null &&
            rawValue !== "unknown" &&
            rawValue !== "unavailable";

          const numericValue = validValue
            ? Number(rawValue)
            : NaN;

          const displayValue = Number.isFinite(numericValue)
            ? Number.isInteger(numericValue)
              ? numericValue.toString()
              : numericValue.toFixed(1)
            : "--";

          return (
            <div key={reading.label} className="min-w-0">
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <Icon size={13} />
                <span className="truncate">
                  {reading.label}
                </span>
              </div>

              <div className="text-lg font-semibold leading-tight tabular-nums">
                {displayValue}
                <span className="ml-1 text-xs font-normal text-gray-400">
                  {reading.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
