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
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

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
        setRecentUsers(data.recentUsers || []);
      } catch (error) {
        console.error(
          "Failed to load system status",
          error
        );
      }
    }

    loadStatus();
  }, []);

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

        {/* BACKEND */}
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
                    Uptime:{" "}
                    {formatUptime(
                      status.uptimeSeconds
                    )}
                  </p>

                  <p>
                    PM2 Restarts:{" "}
                    {status.pm2Restarts ?? 0}
                  </p>

                </div>
              )}

            </div>

          </div>

        </div>


        {/* HOME ASSISTANT */}
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


        {/* USERS — LAST 24 HOURS */}
        <div className="
          bg-slate-900/70
          border border-slate-700
          rounded-xl
          p-5
          md:col-span-2
        ">

          <div className="flex items-center gap-3 mb-4">

            <Users className="text-blue-400" />

            <div>

              <h3 className="font-semibold">
                Utilisateurs — dernières 24h
              </h3>

              <p className="text-slate-400 text-sm">
                {recentUsers.length} utilisateur
                {recentUsers.length !== 1 ? "s" : ""}
              </p>

            </div>

          </div>


          {recentUsers.length === 0 ? (

            <p className="text-slate-500">
              Aucun utilisateur durant les dernières 24h
            </p>

          ) : (

            <div className="space-y-3">

              {recentUsers.map((user) => (

                <div
                  key={user.username}
                  className="
                    flex
                    justify-between
                    items-center
                    border-b
                    border-slate-800
                    pb-2
                  "
                >

                  <div>

                    <div className="font-medium">
                      {user.username}
                    </div>

                    <div className="text-xs text-slate-400">
                      {user.role}
                    </div>

                    <div className="text-xs text-slate-500">

                      Dernière activité :{" "}

                      {new Date(
                        user.lastSeen
                      ).toLocaleString("fr-FR")}

                    </div>

                  </div>


                  <div
                    className={
                      user.online
                        ? "text-green-400"
                        : "text-slate-500"
                    }
                  >

                    {user.online
                      ? "● Online"
                      : "○ Offline"}

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