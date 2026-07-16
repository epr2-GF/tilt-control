"use client";

import { useState } from "react";
import ControlCard from "@/components/ControlCard";
import { useDevices } from "@/context/DeviceContext";
import { triggerDeviceControl } from "@/services/deviceService";

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
}: Props) {
  const { states } = useDevices();

  const [isPending, setIsPending] = useState(false);

const statusDevice = states[statusEntity];

const isOn = statusDevice?.state === "on";

  const handleToggle = async () => {
    if (isPending) return;

    setIsPending(true);

    try {
      await triggerDeviceControl(controlId, "toggle");
    } catch (err) {
      console.error("Failed to control device:", err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <ControlCard
      title={title}
      description={description}
      icon={icon}
      status={isOn ? onText : offText}
      statusColor={isOn ? "green" : "red"}
    >
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all border
        ${
          isPending
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20 cursor-wait"
            : "bg-blue-600 hover:bg-blue-500 text-white border-blue-700"
        }`}
      >
        {isPending ? "Action en cours..." : buttonText}
      </button>
    </ControlCard>
  );
}