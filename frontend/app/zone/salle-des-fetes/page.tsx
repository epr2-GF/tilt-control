
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

import { PartyPopper } from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import DeviceRenderer from "@/components/DeviceRenderer";
import { useDevices } from "@/context/DeviceContext";

export default function SalleDesFetesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshStates } = useDevices();

  const [devices, setDevices] = useState<any[]>([]);

  const hasAccess =
    user?.zones?.includes("salle-des-fetes") ?? false;

  /*
    LOAD DEVICES ASSIGNED TO SALLE DES FÊTES
    AND REFRESH HOME ASSISTANT STATES
  */
  useEffect(() => {
    if (user === undefined || !user || !hasAccess) {
      setDevices([]);
      return;
    }

    let cancelled = false;

    async function loadDevices() {
      try {
        const data = await apiFetch("/devices");

        if (cancelled) return;

        if (!Array.isArray(data)) {
          console.error(
            "Device API did not return an array:",
            data
          );
          return;
        }

        const zoneDevices = data.filter(
          (device: any) =>
            device.zones?.includes("salle-des-fetes") &&
            device.enabled !== false
        );

        setDevices(zoneDevices);

        // Refresh current Home Assistant states
        // whenever devices are loaded.
        await refreshStates();
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed loading salle des fêtes devices",
            error
          );
        }
      }
    }

    // Initial load when entering the zone.
    void loadDevices();

    // Refresh devices and Home Assistant states
    // whenever the page/app becomes visible again.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadDevices();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      cancelled = true;

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [user, hasAccess, refreshStates]);

  /*
    AUTH + PERMISSION CHECK
  */
  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!hasAccess) {
      router.replace("/");
    }
  }, [user, hasAccess, router]);

  /*
    LOADING / ACCESS
  */
  if (user === undefined || !user || !hasAccess) {
    return null;
  }

  /*
    PAGE
  */
  return (
    <main
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-slate-950
        text-white
        p-6
      "
    >
<ZoneHeader
  title="Salle des Fêtes"
  icon={<PartyPopper size={20} />}
  action={<BackButton />}
/>

      <section
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
          mt-6
        "
      >
        {devices.map((device) => (
          <DeviceRenderer
            key={device.id}
            device={device}
          />
        ))}
      </section>
    </main>
  );
}
