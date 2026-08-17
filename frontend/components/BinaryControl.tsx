"use client";

import ControlCard from "@/components/ControlCard";
import { useDevices } from "@/context/DeviceContext";
import { triggerDeviceControl } from "@/services/deviceService";
import { useToast } from "@/context/ToastContext";
import { useState } from "react";

type Props = {
  controlId: string;

  commandEntity: string;
  statusEntity: string;

  title: string;
  description: string;

  icon: React.ReactNode;

  onText: string;
  offText: string;

  buttonText?: string;

  // Device enabled/disabled state
  disabled?: boolean;
};

export default function BinaryControl({
  controlId,
  commandEntity,
  statusEntity,
  title,
  description,
  icon,
  onText,
  offText,
  buttonText = "Commander",
  disabled = false,
}: Props) {
  const { states } = useDevices();
  const { showToast } = useToast();

  const [isPending, setIsPending] =
    useState(false);

  const statusDevice =
    states[statusEntity];

  const state =
    statusDevice?.state;

  const isUnavailable =
    state === "unknown" ||
    state === "unavailable";

  const isOn =
    state === "on";

  // -----------------------------
  // TOGGLE DEVICE
  // -----------------------------

  const handleToggle = async () => {

    // Never allow commands when disabled
    if (
      isPending ||
      disabled ||
      isUnavailable
    ) {
      return;
    }

    setIsPending(true);

    try {

      await triggerDeviceControl(
        controlId,
        "toggle"
      );

      showToast(
        "Commande envoyée",
        "success"
      );

    } catch (err: any) {

      console.error(
        "Failed to control device:",
        err
      );

      showToast(
        err.message ||
          "Erreur lors de la commande",
        "error"
      );

    } finally {

      setIsPending(false);

    }
  };

  // -----------------------------
  // CARD
  // -----------------------------

  return (
    <ControlCard
      title={title}
      description={description}
      icon={icon}

      status={
        disabled
          ? "Désactivé"
          : isUnavailable
            ? "Indisponible"
            : isOn
              ? onText
              : offText
      }

      statusColor={
        disabled
          ? "orange"
          : isUnavailable
            ? "orange"
            : isOn
              ? "green"
              : "red"
      }
    >

      <button
        onClick={handleToggle}
        disabled={
          isPending ||
          disabled ||
          isUnavailable
        }
        className={`
          w-full
          px-4
          py-2.5
          rounded-lg
          font-medium
          text-sm
          transition-all
          border

          ${
            disabled
              ? `
                bg-orange-500/10
                text-orange-400
                border-orange-500/30
                cursor-not-allowed
              `
              : isUnavailable
                ? `
                  bg-slate-700/40
                  text-slate-500
                  border-slate-600
                  cursor-not-allowed
                `
                : isPending
                  ? `
                    bg-amber-500/10
                    text-amber-400
                    border-amber-500/20
                    cursor-wait
                  `
                  : `
                    bg-blue-600
                    hover:bg-blue-500
                    text-white
                    border-blue-700
                  `
          }
        `}
      >

        {disabled
          ? "Désactivé"
          : isPending
            ? "Action en cours..."
            : isUnavailable
              ? "Indisponible"
              : buttonText}

      </button>

    </ControlCard>
  );
}