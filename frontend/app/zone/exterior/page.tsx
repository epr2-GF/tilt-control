"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

import { Trees } from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import DeviceRenderer from "@/components/DeviceRenderer";
import { useDevices } from "@/context/DeviceContext";

export default function ExteriorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshStates } = useDevices();

  const [devices, setDevices] = useState<any[]>([]);

  const hasAccess =
    user?.permissions?.zones?.includes("exterior") ?? false;

  /*
    LOAD DEVICES ASSIGNED TO EXTERIOR
    AND REFRESH HOME ASSISTANT STATES
  */
  useEffect(() => {
    if (!hasAccess) return;

    async function loadDevices() {
      try {
        const data = await apiFetch("/devices");

        if (!Array.isArray(data)) {
          console.error(
            "Device API did not return an array:",
            data
          );
          return;
        }

        const zoneDevices = data.filter(
          (device: any) =>
            device.zones?.includes("exterior") &&
            device.enabled !== false
        );

        setDevices(zoneDevices);

        // Refresh current Home Assistant states
        // whenever devices are loaded.
        await refreshStates();
      } catch (error) {
        console.error(
          "Failed loading exterior devices",
          error
        );
      }
    }

    // Initial load when entering the zone.
    loadDevices();

    // Refresh devices and Home Assistant states
    // whenever the page/app becomes visible again.
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        hasAccess
      ) {
        loadDevices();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [hasAccess, refreshStates]);

  /*
    AUTH + PERMISSION CHECK
  */
  useEffect(() => {
    if (user === null) {
      router.push("/login");
      return;
    }

    if (user && !hasAccess) {
      router.push("/");
    }
  }, [user, hasAccess, router]);

  /*
    LOADING / ACCESS
  */
  if (user === undefined) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (!hasAccess) {
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
      <div className="mb-6">
        <BackButton />
      </div>

      <ZoneHeader
        title="Extérieur"
        subtitle="Équipements et capteurs extérieurs"
        icon={<Trees size={28} />}
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