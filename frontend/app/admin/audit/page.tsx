"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";

export default function AuditPage() {

  const router = useRouter();
  const { user } = useAuth();

  const [logs, setLogs] = useState<any[]>([]);


  useEffect(() => {

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/");
      return;
    }


async function loadLogs(){

  try {

    const data = await apiFetch("/admin/audit");

    setLogs(data);

  } catch (error) {

    console.error("Failed to load audit logs", error);

  }

}


    loadLogs();


  },[user,router]);



  if(!user) return null;



  return (

    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">


      <div className="mb-6">
        <BackButton />
      </div>


      <ZoneHeader
        title="Audit Log"
        subtitle="Historique sécurité système"
        icon={<ShieldCheck size={28}/>}
      />


      <div className="mt-6 space-y-3">


        {logs.map((log,index)=>(

          <div
            key={index}
            className="bg-slate-900/70 border border-slate-700 rounded-xl p-4"
          >

            <div className="flex justify-between">

              <div className="font-semibold">

                {log.event}

              </div>


              {log.severity === "warning" ?

              <AlertTriangle
                className="text-orange-400"
                size={20}
              />

              :

              <ShieldCheck
                className="text-green-400"
                size={20}
              />

              }

            </div>


            <div className="text-sm text-slate-400 mt-2">

              Utilisateur:
              <span className="text-white ml-2">
                {log.actor}
              </span>

            </div>


            <div className="text-sm text-slate-400">

              Date:
              <span className="text-white ml-2">
                {new Date(log.time).toLocaleString()}
              </span>

            </div>


            {log.ip && (

              <div className="text-sm text-slate-400">

                IP:
                <span className="text-white ml-2">
                  {log.ip}
                </span>

              </div>

            )}


          </div>

        ))}


      </div>


    </main>

  );

}