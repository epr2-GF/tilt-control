"use client";

import {
  Plus,
} from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import DeviceForm from "@/components/DeviceForm";

export default function AddDevicePage() {
  const router = useRouter();
  const { user } = useAuth();

  const isGhostAdmin =
    user?.id === "0" && user?.username === "GhostAdmin";

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isGhostAdmin) {
      router.replace("/");
    }
  }, [user, isGhostAdmin, router]);

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
        title="Ajouter un appareil"
        subtitle="Nouvel appareil Home Assistant"
        icon={<Plus size={28} />}
      />

      <div className="mt-6">
        <DeviceForm
          mode="add"
        />
      </div>

    </main>
  );
}