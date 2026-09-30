"use client";

import { useEffect, useState } from "react";
import ControlCard from "@/components/ControlCard";
import { useDevices } from "@/context/DeviceContext";
import { useToast } from "@/context/ToastContext";
import { triggerDeviceControl } from "@/services/deviceService";

type Props = {
  device: any;
  icon: React.ReactNode;
  disabled?: boolean;
};

export default function DimmerCard({
  device,
  icon,
  disabled = false,
}: Props) {

  const { states } = useDevices();
  const { showToast } = useToast();

  const haState =
    states[
      device.statusEntity ||
      device.entityId
    ];

  const isUnavailable =
    !haState ||
    haState.state === "unknown" ||
    haState.state === "unavailable";

  const isOn =
    haState?.state === "on";

  const haBrightness =
    haState?.attributes?.brightness;

  const [brightness, setBrightness] =
    useState(100);

  const [isPending, setIsPending] =
    useState(false);

  /*
   * Only update the slider when HA
   * actually provides a brightness value.
   *
   * When the light is OFF, HA reports
   * brightness = null, so we deliberately
   * keep the previous slider value.
   */
  useEffect(() => {

    if (
      typeof haBrightness === "number"
    ) {
      setBrightness(
        Math.round(
          (haBrightness / 255) * 100
        )
      );
    }

  }, [haBrightness]);

  const handleOn = async () => {

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
        device.id.toString(),
        "turn_on"
      );

      showToast(
        "Éclairage activé",
        "success"
      );

    } catch (error: any) {

      console.error(
        "Dimmer ON command failed:",
        error
      );

      showToast(
        error?.message ||
          "Impossible d'activer l'éclairage",
        "error"
      );

    } finally {

      setIsPending(false);

    }
  };

  const handleOff = async () => {

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
        device.id.toString(),
        "turn_off"
      );

      showToast(
        "Éclairage éteint",
        "success"
      );

    } catch (error: any) {

      console.error(
        "Dimmer OFF command failed:",
        error
      );

      showToast(
        error?.message ||
          "Impossible d'éteindre l'éclairage",
        "error"
      );

    } finally {

      setIsPending(false);

    }
  };

  const applyBrightness = async () => {

    if (
      isPending ||
      disabled ||
      isUnavailable ||
      !isOn
    ) {
      return;
    }

    setIsPending(true);

    try {

      await triggerDeviceControl(
        device.id.toString(),
        "set_brightness",
        {
          brightness,
        }
      );

      showToast(
        `Luminosité réglée à ${brightness} %`,
        "success"
      );

    } catch (error: any) {

      console.error(
        "Dimmer brightness command failed:",
        error
      );

      showToast(
        error?.message ||
          "Impossible de régler la luminosité",
        "error"
      );

    } finally {

      setIsPending(false);

    }
  };

const actualBrightness =
  typeof haBrightness === "number"
    ? Math.round((haBrightness / 255) * 100)
    : brightness;

const status =
  isUnavailable
    ? "Indisponible"
    : isOn
      ? `${actualBrightness} %`
      : "Éteint";

  const statusColor =
    isUnavailable
      ? "gray"
      : isOn
        ? "green"
        : "gray";

    return (
    <ControlCard
      controlId={device.id.toString()}
      title={device.name}
      description={device.description}
      icon={icon}
      status={status}
      statusColor={statusColor}
    >
      <div className="w-full">

        {/* DIMMER SLIDER */}

        <div className="w-full">

          <div className="flex items-center gap-3">

            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={(event) =>
                setBrightness(
                  Number(event.target.value)
                )
              }
              disabled={
                disabled ||
                isUnavailable ||
                isPending ||
                !isOn
              }
              className="
                flex-1
                accent-blue-500
                cursor-pointer
                disabled:cursor-not-allowed
              "
            />

            <span
              className="
                w-12
                text-right
                text-sm
                text-slate-300
                font-mono
              "
            >
              {brightness}%
            </span>

          </div>

        </div>

        {/* ON / OFF / APPLY */}

        <div className="grid grid-cols-3 gap-3 mt-4">

          <button
            onClick={handleOn}
            disabled={
              disabled ||
              isUnavailable ||
              isPending ||
              isOn
            }
            className="
              w-full
              px-4
              py-2
              bg-emerald-600
              hover:bg-emerald-500
              disabled:bg-slate-700
              disabled:text-slate-500
              rounded-lg
              transition
            "
          >
            ON
          </button>

          <button
            onClick={handleOff}
            disabled={
              disabled ||
              isUnavailable ||
              isPending ||
              !isOn
            }
            className="
              w-full
              px-4
              py-2
              bg-red-600
              hover:bg-red-500
              disabled:bg-slate-700
              disabled:text-slate-500
              rounded-lg
              transition
            "
          >
            OFF
          </button>

          <button
            onClick={applyBrightness}
            disabled={
              disabled ||
              isUnavailable ||
              isPending ||
              !isOn
            }
            className="
              w-full
              px-4
              py-2
              bg-blue-600
              hover:bg-blue-500
              disabled:bg-slate-700
              disabled:text-slate-500
              rounded-lg
              transition
            "
          >
            {isPending
              ? "..."
              : "APPLY"}
          </button>

        </div>

      </div>

    </ControlCard>
  );
}