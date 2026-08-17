"use client";

import { useState } from "react";
import { StopCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ControlCard from "@/components/ControlCard";
import { useDevices } from "@/context/DeviceContext";
import { apiFetch } from "@/lib/api";

interface RollerShutterCardProps {
  device: any;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function RollerShutterCard({
  device,
  icon,
  disabled = false,
}: RollerShutterCardProps) {
  const { states } = useDevices();
  const { showToast } = useToast();

  const [pending, setPending] = useState(false);

  const door = states[device.entityId];

  const position =
    door?.attributes?.current_position ?? 0;

  const state =
    door?.state ?? "unknown";

  const isUnavailable =
    state === "unknown" ||
    state === "unavailable";

  const isOpen =
    position > 0;

  const sendCommand = async (service: string) => {
    // Do not allow commands when disabled
    if (pending || disabled || isUnavailable) {
      return;
    }

    setPending(true);

    try {
      await apiFetch("/devices/trigger", {
        method: "POST",
        body: JSON.stringify({
          deviceId: device.id,
          action: service,
        }),
      });

      showToast(
        "Commande envoyée",
        "success"
      );
    } catch (err: any) {
      console.error(
        "Roller shutter command failed",
        err
      );

      showToast(
        err.message ||
          "Erreur commande porte",
        "error"
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <ControlCard
      title={device.name}
      description={device.description}
      icon={icon}
      status={
        disabled
          ? "Désactivé"
          : isUnavailable
            ? "Indisponible"
            : `${position}%`
      }
      statusColor={
        disabled
          ? "orange"
          : isUnavailable
            ? "orange"
            : isOpen
              ? "green"
              : "red"
      }
    >
      <div className="space-y-3">

        {/* STATE */}
        <div className="text-sm text-slate-400">
          Etat:
          <span className="ml-2 text-white">
            {state}
          </span>
        </div>

        {/* POSITION */}
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{
              width: `${position}%`,
            }}
          />
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-3 gap-2">

          <button
            onClick={() =>
              sendCommand("open_cover")
            }
            disabled={
              pending ||
              disabled ||
              isUnavailable
            }
            className={`px-3 py-2 rounded-lg transition ${
              disabled
                ? "bg-orange-900/40 text-orange-400 cursor-not-allowed"
                : pending || isUnavailable
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500"
            }`}
          >
            Ouvrir
          </button>

          <button
            onClick={() =>
              sendCommand("stop_cover")
            }
            disabled={
              pending ||
              disabled ||
              isUnavailable
            }
            className={`px-3 py-2 rounded-lg flex justify-center transition ${
              disabled
                ? "bg-orange-900/40 text-orange-400 cursor-not-allowed"
                : pending || isUnavailable
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-yellow-600 hover:bg-yellow-500"
            }`}
          >
            <StopCircle size={18} />
          </button>

          <button
            onClick={() =>
              sendCommand("close_cover")
            }
            disabled={
              pending ||
              disabled ||
              isUnavailable
            }
            className={`px-3 py-2 rounded-lg transition ${
              disabled
                ? "bg-orange-900/40 text-orange-400 cursor-not-allowed"
                : pending || isUnavailable
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500"
            }`}
          >
            Fermer
          </button>

        </div>

      </div>
    </ControlCard>
  );
}