"use client";

import {
  Edit,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import DeviceForm from "@/components/DeviceForm";
import { apiFetch } from "@/lib/api";
export default function EditDevicePage() {
  const params = useParams();
  const router = useRouter();
const { user } = useAuth();

const isGhostAdmin =
  user?.id === "0" && user?.username === "GhostAdmin";

  const id = Number(params.id);

  const [device, setDevice] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isGhostAdmin) {
      router.replace("/");
      return;
    }

    let cancelled = false;

    async function loadDevice() {
      try {
        const data = await apiFetch(
          `/admin/devices/${id}`
        );

        if (!cancelled) {
          setDevice(data);
        }
      } catch (err: any) {
        console.error(
          "Failed to load device",
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              "Impossible de charger l'appareil."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (Number.isFinite(id)) {
      void loadDevice();
    } else {
      setLoading(false);
      setError("Identifiant d'appareil invalide.");
    }

    return () => {
      cancelled = true;
    };
  }, [id, user, isGhostAdmin, router]);

    if (user === undefined || !isGhostAdmin) {
    return null;
  }

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
                humidityEntity:
                  device.humidityEntity || "",
                setpointEntity:
                  device.setpointEntity || "",
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