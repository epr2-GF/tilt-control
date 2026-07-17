"use client";

import { useState } from "react";
import { ArrowUpDown, StopCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ControlCard from "@/components/ControlCard";
import { useDevices } from "@/context/DeviceContext";
import { apiFetch } from "@/lib/api";


export default function RollerShutterCard() {

  const { states } = useDevices();
  const { showToast } = useToast();

  const [pending, setPending] = useState(false);


  const door = states["cover.garage_porte_tilt"];

  const position =
    door?.attributes?.current_position ?? 0;


  const state =
    door?.state ?? "unknown";


  const isOpen =
    position > 0;


  const sendCommand = async (service:string) => {

    if (pending) return;

    setPending(true);

try {

  await apiFetch("/devices/trigger", {
    method:"POST",
    body: JSON.stringify({
      controlId:"garage-porte-tilt",
      action:service,
    }),
  });

  showToast(
    "Commande envoyée",
    "success"
  );


} catch(err: any) {

  console.error(
    "Roller shutter command failed",
    err
  );

  showToast(
    err.message || "Erreur commande porte",
    "error"
  );

}
    finally {

      setPending(false);

    }

  };


return (

<ControlCard
  title="Garage Porte Tilt"
  description="Porte sectionnelle"
  icon={<ArrowUpDown size={20}/>}
  status={`${position}%`}
  statusColor={
    isOpen
      ? "green"
      : "red"
  }
>


<div className="space-y-3">


<div className="text-sm text-slate-400">

  Etat:
  <span className="ml-2 text-white">
    {state}
  </span>

</div>


<div className="w-full bg-slate-700 rounded-full h-3">

<div
className="bg-blue-500 h-3 rounded-full transition-all"
style={{
 width:`${position}%`
}}
/>

</div>


<div className="grid grid-cols-3 gap-2">


<button
onClick={()=>sendCommand("open_cover")}
disabled={pending}
className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500"
>
Ouvrir
</button>


<button
onClick={()=>sendCommand("stop_cover")}
disabled={pending}
className="px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 flex justify-center"
>
<StopCircle size={18}/>
</button>


<button
onClick={()=>sendCommand("close_cover")}
disabled={pending}
className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500"
>
Fermer
</button>


</div>


</div>


</ControlCard>

);


}