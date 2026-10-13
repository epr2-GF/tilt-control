"use client";

import { useState } from "react";
import ControlCard from "@/components/ControlCard";
import { useToast } from "@/context/ToastContext";
import { triggerDeviceControl } from "@/services/deviceService";

type Props = {
  device: any;
  icon: React.ReactNode;
  disabled?: boolean;
};

export default function RunScriptCard({
  device,
  icon,
  disabled = false,
}: Props) {
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const handleRun = async () => {
    if (isPending || disabled) return;

    setIsPending(true);

    try {
      await triggerDeviceControl(
        device.id.toString(),
        "run_script"
      );

      showToast("Script lancé avec succès", "success");
    } catch (error: any) {
      console.error("Run Script command failed:", error);

      showToast(
        error?.message || "Impossible de lancer le script",
        "error"
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <ControlCard
      controlId={device.id.toString()}
      title={device.name}
      description={device.description}
      icon={icon}
      compact
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          
        </div>

<button
  type="button"
  onClick={handleRun}
  disabled={disabled || isPending}
  className="
    w-full
    px-2
    py-2
    bg-purple-600
    hover:bg-purple-500
    disabled:bg-slate-700
    disabled:text-slate-500
    rounded-lg
    transition
    text-sm
    font-medium
    whitespace-nowrap
  "
>
  {isPending ? "..." : "Activer"}
</button>
      </div>
    </ControlCard>
  );
}