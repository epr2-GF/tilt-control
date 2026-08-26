"use client";

import {
  Plus,
} from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import DeviceForm from "@/components/DeviceForm";

export default function AddDevicePage() {
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