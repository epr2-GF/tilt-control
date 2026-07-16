"use client";

import { useState } from "react";
import { triggerDeviceControl } from "@/services/deviceService";
import { useDevices } from "@/context/DeviceContext";
import ControlCard from "@/components/ControlCard";
import { Warehouse } from "lucide-react";

export default function WarehouseDoorButton() {

  const { states } = useDevices();

  const [isPending, setIsPending] = useState(false);

  const doorState =
    states["input_boolean.fakedoor"] === "on"
      ? "Ouvert"
      : "Fermé";

  const isOpen = doorState === "Ouvert";


  async function handleAction() {

    if (isPending) return;

    setIsPending(true);

    try {
      await triggerDeviceControl(
        "porte-entrepot",
        "toggle"
      );

    } catch (err) {
      console.error(
        "Failed to control warehouse door:",
        err
      );

    } finally {
      setIsPending(false);
    }
  }


  return (
    <ControlCard
      title="Porte Entrepôt"
      description="Accès entrepôt"
      icon={<Warehouse size={20}/>}
      status={doorState}
      statusColor={isOpen ? "green" : "red"}
    >

      <button
        onClick={handleAction}
        disabled={isPending}
        className="
          w-full px-4 py-2.5 rounded-lg
          bg-blue-600 hover:bg-blue-500
          border border-blue-700
          transition-all
        "
      >
        {isPending
          ? "Action en cours..."
          : "Actionner la porte"
        }
      </button>

    </ControlCard>
  );
}