"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import RollerShutterCard from "@/components/RollerShutterCard";
import BinaryControl from "@/components/BinaryControl";

import { House, ArrowRightLeft } from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";


export default function LogementDuLacPage() {

  const router = useRouter();
  const { user } = useAuth();

  const [devices, setDevices] = useState<any[]>([]);


  const hasAccess =
    user?.permissions?.zones?.includes("logement-du-lac") ?? false;



  /*
    LOAD DEVICES ASSIGNED TO LOGEMENT DU LAC
  */
  useEffect(() => {

    async function loadDevices(){

      try {

        const data = await apiFetch("/devices");


        const zoneDevices = data.filter(
          (device:any) =>
            device.zones.includes("logement-du-lac")
        );


        setDevices(zoneDevices);


      } catch(error){

        console.error(
          "Failed loading logement du lac devices",
          error
        );

      }

    }


    if (hasAccess) {
      loadDevices();
    }


  }, [hasAccess]);



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



  if (user === undefined) return null;


  if (!user) return null;


  if (!hasAccess) return null;



  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">


      <div className="mb-6">
        <BackButton />
      </div>



      <ZoneHeader
        title="Logement du Lac"
        subtitle="Gestion du logement du lac"
        icon={<House size={28} />}
      />



      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">


        {/* Existing roller shutter test component */}
        {devices
.filter(
  (device:any)=>
    device.cardType === "rollerShutter"
)
.map((device:any)=>(

  <RollerShutterCard

    key={device.id}

    device={device}

  />

))}

      </section>


    </main>
  );
}