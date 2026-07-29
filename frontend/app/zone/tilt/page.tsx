"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { Building2, ArrowRightLeft, Warehouse } from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import DeviceRenderer from "@/components/DeviceRenderer";


export default function TiltPage() {

  const router = useRouter();
  const { user } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);

  /*
    AUTH + PERMISSION CHECK
  */
  useEffect(() => {

    if (!user) {
      router.push("/login");
      return;
    }


    const allowed =
      user.permissions?.zones?.includes("tilt");


    if (!allowed) {
      router.push("/");
    }

  }, [user, router]);


useEffect(() => {

  async function loadDevices() {

    try {

      const data = await apiFetch("/devices");

      const zoneDevices = data.filter(
        (device: any) =>
          device.zones?.includes("tilt")
      );

      setDevices(zoneDevices);

    } catch (error) {

      console.error(
        "Failed loading devices",
        error
      );

    }

  }

  loadDevices();

}, []);



  if (!user) return null;


  if (!user.permissions?.zones?.includes("tilt")) {
    return null;
  }


  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">


      <div className="mb-6">
        <BackButton />
      </div>



      <ZoneHeader
        title="Zone Tilt"
        subtitle="Contrôle principal du site"
        icon={<Building2 size={28} />}
      />



      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">


{devices.map((device)=>(

<DeviceRenderer
 key={device.id}
 device={device}
/>

))}


      </section>


    </main>
  );
}