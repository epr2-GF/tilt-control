"use client";

import ControlCard from "@/components/ControlCard";
import { useDevices } from "@/context/DeviceContext";
import { triggerDeviceControl } from "@/services/deviceService";
import { useToast } from "@/context/ToastContext";
import { useState } from "react";

type Props = {
  device: any;

  statusEntity: string;

  onEntity?: string;
  offEntity?: string;

  icon: React.ReactNode;

  disabled?: boolean;
};

export default function OnOffCard({
  device,
  statusEntity,
  onEntity,
  offEntity,
  icon,
  disabled = false,
}: Props) {
  const { states } = useDevices();
  const { showToast } = useToast();

  const [pending, setPending] =
    useState<"on" | "off" | null>(null);

  const statusDevice =
    states[statusEntity];

  const state =
    statusDevice?.state;

  const isUnavailable =
    state === "unknown" ||
    state === "unavailable";

  const isOn =
    state === "on";

  async function handleCommand(
    action: "on" | "off",
    entity?: string
  ) {
    if (
      disabled ||
      isUnavailable ||
      pending ||
      !entity
    ) {
      return;
    }

    setPending(action);

    try {
      /*
       * The command entity is temporarily used
       * as the device entity.
       *
       * The important part is that the backend
       * receives "on" or "off", NEVER "toggle".
       */
      await triggerDeviceControl(
        device.id.toString(),
        action
      );

      showToast(
        action === "on"
          ? "Commande ON envoyée"
          : "Commande OFF envoyée",
        "success"
      );

    } catch (err: any) {

      const message =
        err?.message || "";

      if (
        message ===
        "Appareil introuvable dans Home Assistant"
      ) {
        showToast(
          message,
          "error"
        );

      } else {

        console.error(
          "Failed to control device:",
          err
        );

        showToast(
          message ||
            "Erreur lors de la commande",
          "error"
        );
      }

    } finally {

      setPending(null);

    }
  }

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
            : isOn
              ? device.statusTrue || "ON"
              : device.statusFalse || "OFF"
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

      <div className="grid grid-cols-2 gap-3">

        <button
          onClick={() =>
            handleCommand(
              "on",
              onEntity
            )
          }
          disabled={
            disabled ||
            isUnavailable ||
            pending !== null ||
            !onEntity
          }
          className="
            w-full
            px-4
            py-2.5
            rounded-lg
            font-medium
            text-sm
            transition-all
            border
            bg-green-600
            hover:bg-green-500
            text-white
            border-green-700
            disabled:bg-slate-700
            disabled:text-slate-500
            disabled:border-slate-600
            disabled:cursor-not-allowed
          "
        >
          {pending === "on"
            ? "..."
            : "ON"}
        </button>

        <button
          onClick={() =>
            handleCommand(
              "off",
              offEntity
            )
          }
          disabled={
            disabled ||
            isUnavailable ||
            pending !== null ||
            !offEntity
          }
          className="
            w-full
            px-4
            py-2.5
            rounded-lg
            font-medium
            text-sm
            transition-all
            border
            bg-red-600
            hover:bg-red-500
            text-white
            border-red-700
            disabled:bg-slate-700
            disabled:text-slate-500
            disabled:border-slate-600
            disabled:cursor-not-allowed
          "
        >
          {pending === "off"
            ? "..."
            : "OFF"}
        </button>

      </div>

    </ControlCard>
  );
}