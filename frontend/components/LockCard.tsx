"use client";

import { useState } from "react";
import {
  Lock,
  Unlock,
} from "lucide-react";

import { useToast } from "@/context/ToastContext";
import ControlCard from "@/components/ControlCard";
import { useDevices } from "@/context/DeviceContext";
import { apiFetch } from "@/lib/api";

interface LockCardProps {
  device: any;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function LockCard({
  device,
  icon,
  disabled = false,
}: LockCardProps) {
  const { states } = useDevices();
  const { showToast } = useToast();

  const [pending, setPending] =
    useState(false);

  const lock = states[device.entityId];

  const state =
    lock?.state ?? "unknown";

  const isUnavailable =
    state === "unknown" ||
    state === "unavailable";

  const isLocked =
    state === "locked";

  const isUnlocked =
    state === "unlocked";

  const isLocking =
    state === "locking";

  const isUnlocking =
    state === "unlocking";

  const isJammed =
    state === "jammed";

  const sendCommand = async (
    service: "lock" | "unlock"
  ) => {
    if (
      pending ||
      disabled ||
      isUnavailable ||
      isJammed ||
      isLocking ||
      isUnlocking
    ) {
      return;
    }

    setPending(true);

    try {
      await apiFetch(
        "/devices/trigger",
        {
          method: "POST",
          body: JSON.stringify({
            deviceId: device.id,
            action: service,
          }),
        }
      );

      showToast(
        service === "lock"
          ? "Verrouillage demandé"
          : "Déverrouillage demandé",
        "success"
      );

    } catch (err: any) {
      console.error(
        "Lock command failed",
        err
      );

      showToast(
        err?.message ||
          "Erreur commande serrure",
        "error"
      );

    } finally {
      setPending(false);
    }
  };

  /*
   * -----------------------------
   * DISPLAY STATUS
   * -----------------------------
   */

  let displayStatus = "Inconnu";
  let statusColor:
    | "green"
    | "red"
    | "orange" = "orange";

  if (disabled) {
    displayStatus = "Désactivé";
    statusColor = "orange";

  } else if (isUnavailable) {
    displayStatus = "Indisponible";
    statusColor = "orange";

  } else if (isJammed) {
    displayStatus = "BLOQUÉ";
    statusColor = "red";

  } else if (isLocking) {
    displayStatus = "Verrouillage...";

  } else if (isUnlocking) {
    displayStatus = "Déverrouillage...";

  } else if (isLocked) {
    displayStatus =
      device.statusTrue ||
      "Verrouillé";

    statusColor = "green";

  } else if (isUnlocked) {
    displayStatus =
      device.statusFalse ||
      "Déverrouillé";

    statusColor = "red";
  }

  /*
   * -----------------------------
   * BUTTON STATE
   * -----------------------------
   */

  const commandsDisabled =
    pending ||
    disabled ||
    isUnavailable ||
    isJammed ||
    isLocking ||
    isUnlocking;

  return (
    <ControlCard
      title={device.name}
      description={device.description}
      icon={icon}
      status={displayStatus}
      statusColor={statusColor}
    >
      <div className="space-y-3">

        {/* STATE */}

        <div className="text-sm text-slate-400">
          État:
          <span className="ml-2 text-white">
            {state}
          </span>
        </div>

        {/* CONTROLS */}

        <div className="grid grid-cols-2 gap-2">

          {/* UNLOCK */}

          <button
            onClick={() =>
              sendCommand("unlock")
            }
            disabled={
              commandsDisabled ||
              isUnlocked
            }
            className={`
              px-3
              py-2
              rounded-lg
              flex
              items-center
              justify-center
              gap-2
              transition

              ${
                disabled
                  ? `
                    bg-orange-900/40
                    text-orange-400
                    cursor-not-allowed
                  `
                  : commandsDisabled ||
                    isUnlocked
                    ? `
                      bg-slate-700
                      text-slate-500
                      cursor-not-allowed
                    `
                    : `
                      bg-green-600
                      hover:bg-green-500
                    `
              }
            `}
          >
            <Unlock size={18} />

            {pending
              ? "En cours..."
              : "Déverrouiller"}
          </button>

          {/* LOCK */}

          <button
            onClick={() =>
              sendCommand("lock")
            }
            disabled={
              commandsDisabled ||
              isLocked
            }
            className={`
              px-3
              py-2
              rounded-lg
              flex
              items-center
              justify-center
              gap-2
              transition

              ${
                disabled
                  ? `
                    bg-orange-900/40
                    text-orange-400
                    cursor-not-allowed
                  `
                  : commandsDisabled ||
                    isLocked
                    ? `
                      bg-slate-700
                      text-slate-500
                      cursor-not-allowed
                    `
                    : `
                      bg-red-600
                      hover:bg-red-500
                    `
              }
            `}
          >
            <Lock size={18} />

            {pending
              ? "En cours..."
              : "Verrouiller"}
          </button>

        </div>

      </div>
    </ControlCard>
  );
}