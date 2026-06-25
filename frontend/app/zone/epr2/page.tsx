"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccessZone } from "@/lib/permissions";

import { Warehouse, Thermometer, Zap } from "lucide-react";

import ZoneHeader from "@/components/ZoneHeader";
import SensorCard from "@/components/SensorCard";
import BackButton from "@/components/BackButton";

export default function Epr2Page() {


    const router = useRouter();
const { user } = useAuth();

useEffect(() => {
  if (!user) {
    router.push("/login");
    return;
  }

  if (!canAccessZone(user.role, "epr2")) {
    router.push("/");
  }
}, [user, router]);

if (!user) return null;

if (!canAccessZone(user.role, "epr2")) {
  return null;
}

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">

      <div className="mb-6">
        <BackButton />
      </div>

      <div className="mb-6">
        <ZoneHeader
          title="Zone EPR2"
          subtitle="Capteurs et équipements EPR2"
          icon={<Warehouse size={28} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SensorCard
          title="Température"
          value="22"
          unit="°C"
          icon={<Thermometer size={20} />}
        />

        <SensorCard
          title="Puissance"
          value="3.4"
          unit="kW"
          icon={<Zap size={20} />}
        />
      </div>

    </main>
  );
}