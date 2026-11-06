
"use client";

import ControlCard from "@/components/ControlCard";
import { useDevices } from "@/context/DeviceContext";
import { triggerDeviceControl } from "@/services/deviceService";
import { useToast } from "@/context/ToastContext";
import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

type Props = {
  device: any;
  icon: React.ReactNode;
  disabled?: boolean;
};

const MIN_TEMP = 5;
const MAX_TEMP = 30;
const STEP = 0.5;

export default function ThermostatCard({
  device,
  icon,
  disabled = false,
}: Props) {
  const { states, refreshStates } = useDevices();
  const { showToast } = useToast();

  const temperatureState = states[device.entityId];
  const humidityState = states[device.humidityEntity];
  const setpointState = states[device.setpointEntity];
  const [hasUserAdjusted, setHasUserAdjusted] = useState(false);
  const currentTemperature = Number(temperatureState?.state);
  const humidity = Number(humidityState?.state);
  const helperValue = Number(setpointState?.state);

  const isUnavailable =
    !temperatureState ||
    temperatureState.state === "unknown" ||
    temperatureState.state === "unavailable" ||
    !Number.isFinite(currentTemperature);

  const isHeatingEnabled =
    Number.isFinite(helperValue) && helperValue > 0;

  const [selectedTemperature, setSelectedTemperature] = useState(20);
  const [pending, setPending] = useState<"on" | "off" | null>(null);

  console.log("THERMOSTAT DEBUG", {
    temperatureEntity: device.entityId,
    temperatureState,
    humidityEntity: device.humidityEntity,
    humidityState,
    setpointEntity: device.setpointEntity,
    setpointState,
  });

  useEffect(() => {
    if (
      Number.isFinite(helperValue) &&
      helperValue >= MIN_TEMP &&
      helperValue <= MAX_TEMP
    ) {
      setSelectedTemperature(helperValue);
    }
  }, [helperValue]);

function adjustTemperature(direction: -1 | 1) {
  setHasUserAdjusted(true);

  setSelectedTemperature(current => {
    const next = Math.round((current + direction * STEP) * 10) / 10;
    return Math.min(MAX_TEMP, Math.max(MIN_TEMP, next));
  });
}

useEffect(() => {
  if (!isHeatingEnabled || !hasUserAdjusted || disabled) {
    return;
  }

  const timer = setTimeout(async () => {
    setPending("on");

    try {
      await triggerDeviceControl(
        device.id.toString(),
        "set_temperature",
        { temperature: selectedTemperature }
      );

      setHasUserAdjusted(false);
      await refreshStates();

      showToast(
        `Consigne réglée à ${selectedTemperature.toFixed(1)} °C`,
        "success"
      );
    } catch (err: any) {
      console.error("Thermostat adjustment failed:", err);

      showToast(
        err?.message || "Erreur lors du réglage",
        "error"
      );
    } finally {
      setPending(null);
    }
  }, 2000);

  return () => clearTimeout(timer);

}, [
  selectedTemperature,
  isHeatingEnabled,
  hasUserAdjusted,
  disabled,
]);

  async function handleCommand(action: "on" | "off") {
    if (
      disabled ||
      isUnavailable ||
      pending ||
      (action === "on" && isHeatingEnabled) ||
      (action === "off" && !isHeatingEnabled)
    ) {
      return;
    }

    setPending(action);

    try {
      if (action === "on") {
        setHasUserAdjusted(false);
        await triggerDeviceControl(
          device.id.toString(),
          "set_temperature",
          { temperature: selectedTemperature }
        );
      } else {
        await triggerDeviceControl(
          device.id.toString(),
          "off"
        );
      }
      await refreshStates();
      showToast(
        action === "on"
          ? `Consigne réglée à ${selectedTemperature.toFixed(1)} °C`
          : "Chauffage désactivé",
        "success"
      );
    } catch (err: any) {
      console.error("Thermostat command failed:", err);
      showToast(
        err?.message || "Erreur lors de la commande",
        "error"
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div
      className={`
        rounded-xl transition-all duration-300
        ${
          isHeatingEnabled
            ? "shadow-[0_0_22px_rgba(239,68,68,0.30)] ring-1 ring-red-500/30"
            : "shadow-none ring-1 ring-transparent"
        }
      `}
    >
     
<ControlCard
  title={device.name}
  description={device.description}
  icon={icon}
  status={
    disabled
      ? "Désactivé"
      : isUnavailable
        ? "Indisponible"
        : isHeatingEnabled
          ? "Chauffage activé"
          : "Chauffage arrêté"
  }
  statusColor={
    disabled || isUnavailable
      ? "orange"
      : isHeatingEnabled
        ? "red"
        : "gray"
  }
>
 
<div className="w-full">
  {/* Temperature and setpoint */}
  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">

    {/* Actual temperature */}
    <div className="min-w-0">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-light tracking-tight text-white">
          {isUnavailable ? "--" : currentTemperature.toFixed(1)}
          {!isUnavailable && "°"}
        </span>

        <span className="text-xs text-slate-400 whitespace-nowrap">
          {Number.isFinite(humidity)
            ? `${humidity.toFixed(0)}%`
            : "--"}
        </span>
      </div>

      <div className="text-xs text-slate-400">
        Actuel
      </div>
    </div>

    {/* Setpoint controls */}
    <div className="flex items-center gap-1 border-l border-slate-700 pl-2 shrink-0">
      <button
        onClick={() => adjustTemperature(-1)}
        disabled={
          disabled ||
          isUnavailable ||
          pending !== null ||
          selectedTemperature <= MIN_TEMP
        }
        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
        aria-label="Diminuer la température"
      >
        <ChevronDown size={28} />
      </button>

      <div className="text-lg font-semibold text-blue-400 tabular-nums min-w-[48px] text-center">
        {selectedTemperature.toFixed(1)}°
      </div>

      <button
        onClick={() => adjustTemperature(1)}
        disabled={
          disabled ||
          isUnavailable ||
          pending !== null ||
          selectedTemperature >= MAX_TEMP
        }
        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
        aria-label="Augmenter la température"
      >
        <ChevronUp size={28} />
      </button>
    </div>
  </div>

  {/* ON / OFF buttons */}
  <div className="grid grid-cols-2 gap-2 mt-2">
    <button
      onClick={() => handleCommand("on")}
      disabled={
        disabled ||
        isUnavailable ||
        pending !== null ||
        isHeatingEnabled
      }
      className="rounded-lg px-3 py-1 text-sm font-medium bg-green-600 hover:bg-green-500 text-white border border-green-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:border-slate-600 disabled:cursor-not-allowed"
    >
      {pending === "on" ? "..." : "ON"}
    </button>

    <button
      onClick={() => handleCommand("off")}
      disabled={
        disabled ||
        pending !== null ||
        !device.setpointEntity ||
        !isHeatingEnabled
      }
      className="rounded-lg px-3 py-1 text-sm font-medium bg-red-600 hover:bg-red-500 text-white border border-red-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:border-slate-600 disabled:cursor-not-allowed"
    >
      {pending === "off" ? "..." : "OFF"}
    </button>
  </div>
</div>

</ControlCard>

    </div>
  );
}
