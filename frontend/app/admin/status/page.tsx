"use client";

import { useEffect, useState } from "react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";

import {
  Activity,
  Server,
  Wifi,
  Users,
} from "lucide-react";

import { apiFetch } from "@/lib/api";


export default function StatusPage() {

  const [status, setStatus] = useState<any>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);


  function formatUptime(seconds: number) {

    const days = Math.floor(seconds / 86400);

    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);

    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);

    return `${days}d ${hours}h ${minutes}m`;

  }


  useEffect(() => {

    async function loadStatus() {

      try {

        const data = await apiFetch("/status");

        setStatus(data);
        setActiveUsers(data.activeUsers || []);

      } catch (error) {

        console.error(
          "Failed to load system status",
          error
        );

      }

    }


    loadStatus();

  }, []);

function formatLastSeen(lastSeen: number) {

  const seconds = Math.floor(
    (Date.now() - lastSeen) / 1000
  );

  if (seconds < 5) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  return `${hours}h ago`;

}

  return (

    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">

      <div className="mb-6">

        <BackButton />

      </div>

      <ZoneHeader
        title="État du système"
        subtitle="Monitoring système en temps réel"
        icon={<Activity size={28} />}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">

        <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5">

          <div className="flex items-center gap-3">

            <Server className="text-green-400" />

            <div>

              <h3 className="font-semibold">
                Backend
              </h3>

              <p className="text-green-400">
                {status?.backend || "Checking..."}
              </p>

{status?.uptimeSeconds !== undefined && (

<div className="text-sm text-slate-400 mt-2">

  <p>
    Uptime:
    {" "}
    {formatUptime(status.uptimeSeconds)}
  </p>

  <p>
    PM2 Restarts:
    {" "}
    {status.pm2Restarts ?? 0}
  </p>


</div>

)}

            </div>

          </div>

        </div>

        <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5">

          <div className="flex items-center gap-3">

            <Wifi className="text-green-400" />

            <div>

              <h3 className="font-semibold">
                Home Assistant
              </h3>


              <p
  className={
    status?.homeAssistant === "connected"
      ? "text-green-400"
      : "text-red-400"
  }
>
  {status?.homeAssistant || "Checking..."}
</p>


            </div>


          </div>


        </div>

<div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5">

  <div className="flex items-center gap-3 mb-4">

    <Users className="text-blue-400"/>

    <div>

      <h3 className="font-semibold">
        Active Users
      </h3>

      <p className="text-slate-400 text-sm">
        {activeUsers.length} connected
      </p>

    </div>

  </div>

  {activeUsers.length === 0 ? (

    <p className="text-slate-500">
      No active users
    </p>

  ) : (

    <div className="space-y-3">

      {activeUsers.map((user) => (

        <div
          key={user.username}
          className="flex justify-between items-center border-b border-slate-800 pb-2"
        >

          <div>

            <div className="font-medium">
              {user.username}
            </div>

            <div className="text-xs text-slate-400">
            {user.role}
           </div>

<div className="text-xs text-slate-500">
  {formatLastSeen(user.lastSeen)}
</div>

          </div>

          <div className="text-green-400">
            ● Online
          </div>

        </div>

      ))}

    </div>

  )}

</div>

      </div>


    </main>

  );

}