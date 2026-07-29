"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

import { Warehouse } from "lucide-react";

import ZoneHeader from "@/components/ZoneHeader";
import BackButton from "@/components/BackButton";
import DeviceRenderer from "@/components/DeviceRenderer";


export default function Epr2Page() {

  const router = useRouter();
  const { user } = useAuth();

  const [devices, setDevices] = useState<any[]>([]);


  const hasAccess =
    user?.permissions?.zones?.includes("epr2") ?? false;



  /*
    LOAD DEVICES ASSIGNED TO EPR2
  */
  useEffect(() => {

    async function loadDevices(){

      try {

        const data = await apiFetch("/devices");


        const zoneDevices = data.filter(
          (device:any) =>
            device.zones.includes("epr2")
            &&
            device.enabled !== false
        );


        setDevices(zoneDevices);


      } catch(error){

        console.error(
          "Failed loading EPR2 devices",
          error
        );

      }

    }


    if(hasAccess){
      loadDevices();
    }


  }, [hasAccess]);




  /*
    AUTH + PERMISSION CHECK
  */
  useEffect(() => {

    if(user === null){
      router.push("/login");
      return;
    }


    if(user && !hasAccess){
      router.push("/");
    }


  }, [user, hasAccess, router]);




  if(user === undefined) return null;

  if(!user) return null;

  if(!hasAccess) return null;



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
        title="Zone EPR2"
        subtitle="Capteurs et équipements EPR2"
        icon={<Warehouse size={28}/>}
      />



      <section className="
        mt-6
        grid
        grid-cols-1
        md:grid-cols-2
        gap-4
      ">


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