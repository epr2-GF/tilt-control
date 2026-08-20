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
    user?.permissions?.zones?.includes("salle-des-fetes") ?? false;

  /*
    LOAD DEVICES + REFRESH HOME ASSISTANT STATES
  */
  useEffect(() => {
    if (!hasAccess) return;

    async function loadDevices() {
      try {
        const data = await apiFetch("/devices");

        const zoneDevices = data.filter(
          (device: any) =>
            device.zones?.includes("salle-des-fetes") &&
            device.enabled !== false
        );

        setDevices(zoneDevices);
      } catch (error) {
        console.error(
          "Failed loading salle des fêtes devices",
          error
        );
      }
    }

    loadDevices();

    // Refresh Home Assistant states whenever
    // the zone page is opened.
    refreshStates();
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
  if (user === undefined) return null;

  if (!user) return null;

  if (!hasAccess) return null;

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
        title="Salle des Fêtes"
        subtitle="Gestion de la salle des fêtes"
        icon={<PartyPopper size={28} />}
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