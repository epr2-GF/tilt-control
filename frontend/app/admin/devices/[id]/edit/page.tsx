"use client";

import {
  Edit,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { useParams } from "next/navigation";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import DeviceForm from "@/components/DeviceForm";
import { apiFetch } from "@/lib/api";

export default function EditDevicePage() {
  const params = useParams();

  const id = Number(params.id);

  const [device, setDevice] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDevice() {
      try {
        const data = await apiFetch(
          `/admin/devices/${id}`
        );

        setDevice(data);

      } catch (err: any) {
        console.error(
          "Failed to load device",
          err
        );

        setError(
          err?.message ||
            "Impossible de charger l'appareil."
        );

      } finally {
        setLoading(false);
      }
    }

    if (
      Number.isFinite(id)
    ) {
      loadDevice();
    } else {
      setLoading(false);
      setError(
        "Identifiant d'appareil invalide."
      );
    }
  }, [id]);

  return (
    <main className="
      min-h-screen
      bg-gradient-to-br
      from-slate-950
      via-slate-900
      to-slate-950
      text-white
      p-6
    ">

      <div className="mb-6">
        <BackButton />
      </div>

      <ZoneHeader
        title={
          device
            ? `Modifier : ${device.name}`
            : "Modifier un appareil"
        }
        subtitle="Configuration Home Assistant"
        icon={<Edit size={28} />}
      />

      <div className="mt-6">

        {loading && (
          <div className="
            bg-slate-900/70
            border border-slate-700
            rounded-xl
            p-6
            text-slate-400
          ">
            Chargement de l'appareil...
          </div>
        )}

        {!loading && error && (
          <div className="
            bg-red-950/50
            border border-red-700/60
            text-red-300
            rounded-xl
            p-6
          ">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          device && (
            <DeviceForm
              mode="edit"
              deviceId={id}
              initialData={{
                name: device.name,
                description:
                  device.description || "",
                entityId:
  device.cardType === "onOff"
    ? ""
    : device.entityId,
                statusEntity:
                  device.statusEntity || "",
                button1Entity:
                  device.button1Entity || "",
                button2Entity:
                  device.button2Entity || "",
                cardType:
                  device.cardType,
                statusTrue:
                  device.statusTrue ||
                  "ON",
                statusFalse:
                  device.statusFalse ||
                  "OFF",
                zones:
                  device.zones || [],
                icon:
                  device.icon ||
                  "device",
                enabled:
                  device.enabled ??
                  true,
              }}
            />
          )}

      </div>

    </main>
  );
}