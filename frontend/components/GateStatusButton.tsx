"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { triggerDeviceControl } from "@/services/deviceService";
import ControlCard from "@/components/ControlCard";
import { useDevices } from "@/context/DeviceContext";
import { ArrowLeftRight } from "lucide-react";

export default function GateStatusButton() {

  const { user } = useAuth();
  const { states } = useDevices();

  const [isPending, setIsPending] = useState(false);

  const gateState =
    states["input_boolean.fakegate"] === "on"
      ? "Ouvert"
      : "Fermé";


  const handleAction = async () => {

    if (isPending) return;

    setIsPending(true);

    try {
      await triggerDeviceControl(
        "portail-principal",
        "toggle"
      );

    } catch (err) {
      console.error(
        "Failed to execute trigger:",
        err
      );

    } finally {

      setIsPending(false);

    }
  };


  const isOuvert = gateState === "Ouvert";


  return (
    <ControlCard
      title="Portail Principal"
      description="Accès principal"
      icon={<ArrowLeftRight size={20} />}
      status={gateState}
      statusColor={isOuvert ? "green" : "red"}
    >

      <button
        onClick={handleAction}
        disabled={isPending}
        className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all text-center border
          ${
            isPending
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20 cursor-wait"
              : "bg-blue-600 hover:bg-blue-500 text-white border-blue-700"
          }`}
      >
        {isPending
          ? "Action en cours..."
          : "Actionner le portail"
        }
      </button>

    </ControlCard>
  );
}