
"use client";

import { useEffect, useState } from "react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import {
  Activity,
  Server,
  Wifi,
  Users,
  AlertCircle,
  WifiOff,
  CheckCircle2,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

export default function StatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [deviceProblems, setDeviceProblems] = useState<any[]>([]);

  const router = useRouter();
  const { user } = useAuth();

  const isGhostAdmin =
    user?.id === "0" && user?.username === "GhostAdmin";

  const canViewRecentUsers =
    user?.capabilities?.manageUsers === true || isGhostAdmin;

  function formatUptime(seconds: number) {
    const days = Math.floor(seconds / 86400);

    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);

    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }

  // SYSTEM STATUS
  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadStatus() {
      try {
        const data = await apiFetch("/status");

        if (cancelled) return;

        setStatus(data);

        if (canViewRecentUsers) {
          setRecentUsers(data.recentUsers || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load system status", error);
        }
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [user, canViewRecentUsers, router]);

  // DEVICE AVAILABILITY
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadDeviceProblems() {
      try {
        const [devicesData, statesData] = await Promise.all([
          apiFetch("/devices"),
          apiFetch("/devices/state"),
        ]);

        if (cancelled) return;

        const devices = Array.isArray(devicesData)
          ? devicesData
          : devicesData?.devices || [];

        const states = statesData?.states || statesData || {};

        const entityFields = [
          { field: "entityId", label: "Entité principale" },
          { field: "statusEntity", label: "État" },
          { field: "button1Entity", label: "Bouton 1" },
          { field: "button2Entity", label: "Bouton 2" },
          { field: "humidityEntity", label: "Humidité" },
          { field: "setpointEntity", label: "Consigne" },
          { field: "weatherHumidityEntity", label: "Humidité" },
          { field: "weatherPrecipitationEntity", label: "Précipitations" },
          { field: "weatherWindSpeedEntity", label: "Vitesse du vent" },
          { field: "weatherWindGustEntity", label: "Rafales" },
          { field: "weatherLightEntity", label: "Luminosité" },
        ];

        const problems: any[] = [];

        for (const device of devices) {
          if (device.enabled === false) continue;

          const affectedEntities: any[] = [];

          const checkedEntities = new Set<string>();

          for (const item of entityFields) {
            const entityId = device[item.field];

            if (!entityId || checkedEntities.has(entityId)) {
              continue;
            }

            checkedEntities.add(entityId);

            const entityState = states[entityId];

            const stateValue =
              typeof entityState === "string"
                ? entityState
                : entityState?.state;

            if (
              stateValue === "unknown" ||
              stateValue === "unavailable"
            ) {
              affectedEntities.push({
                entityId,
                label: item.label,
                state: stateValue,
              });
            }
          }

          if (affectedEntities.length > 0) {
            problems.push({
              id: device.id,
              name: device.name,
              problems: affectedEntities,
            });
          }
        }

        setDeviceProblems(problems);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load device availability",
            error
          );
        }
      }
    }

    void loadDeviceProblems();

    const interval = setInterval(
      loadDeviceProblems,
      30000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  if (user === undefined || !user) {
    return null;
  }

  const unknownDevices = deviceProblems.filter((device) =>
    device.problems.some(
      (problem: any) => problem.state === "unknown"
    )
  );

  const unavailableDevices = deviceProblems.filter((device) =>
    device.problems.some(
      (problem: any) => problem.state === "unavailable"
    )
  );

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
                    {formatUptime(status.uptimeSeconds)}
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


        {/* DEVICE AVAILABILITY */}
        <div className="
          bg-slate-900/70
          border border-slate-700
          rounded-xl
          p-5
          md:col-span-2
        ">

          <div className="flex items-center gap-3 mb-4">

            {deviceProblems.length > 0 ? (
              <AlertCircle className="text-orange-400" />
            ) : (
              <CheckCircle2 className="text-green-400" />
            )}

            <div>

              <h3 className="font-semibold">
                État des appareils
              </h3>

              <p className={
                deviceProblems.length > 0
                  ? "text-orange-400 text-sm"
                  : "text-green-400 text-sm"
              }>
                {deviceProblems.length > 0
                  ? `${deviceProblems.length} appareil${
                      deviceProblems.length !== 1 ? "s" : ""
                    } avec un problème`
                  : "Tous les appareils sont opérationnels"}
              </p>

            </div>

          </div>

          {deviceProblems.length === 0 ? (

            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 size={18} />
              Aucun appareil inconnu ou indisponible
            </div>

          ) : (

            <div className="space-y-4">

              {/* UNKNOWN */}
              {unknownDevices.length > 0 && (

                <div>

                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle
                      size={16}
                      className="text-orange-400"
                    />

                    <h4 className="text-orange-400 font-medium">
                      Unknown ({unknownDevices.length})
                    </h4>
                  </div>

                  <div className="space-y-2">

                    {unknownDevices.map((device) => (

                      <div
                        key={device.id}
                        className="
                          bg-slate-950/50
                          border border-orange-900/40
                          rounded-lg
                          px-3 py-2
                        "
                      >

                        <div className="font-medium text-sm">
                          {device.name}
                        </div>

                        {device.problems
                          .filter(
                            (problem: any) =>
                              problem.state === "unknown"
                          )
                          .map((problem: any) => (

                            <div
                              key={problem.entityId}
                              className="text-xs text-orange-300 mt-1"
                            >
                              {problem.label} — {problem.entityId}
                            </div>

                          ))}

                      </div>

                    ))}

                  </div>

                </div>

              )}


              {/* UNAVAILABLE */}
              {unavailableDevices.length > 0 && (

                <div>

                  <div className="flex items-center gap-2 mb-2">
                    <WifiOff
                      size={16}
                      className="text-red-400"
                    />

                    <h4 className="text-red-400 font-medium">
                      Unavailable ({unavailableDevices.length})
                    </h4>
                  </div>

                  <div className="space-y-2">

                    {unavailableDevices.map((device) => (

                      <div
                        key={device.id}
                        className="
                          bg-slate-950/50
                          border border-red-900/40
                          rounded-lg
                          px-3 py-2
                        "
                      >

                        <div className="font-medium text-sm">
                          {device.name}
                        </div>

                        {device.problems
                          .filter(
                            (problem: any) =>
                              problem.state === "unavailable"
                          )
                          .map((problem: any) => (

                            <div
                              key={problem.entityId}
                              className="text-xs text-red-300 mt-1"
                            >
                              {problem.label} — {problem.entityId}
                            </div>

                          ))}

                      </div>

                    ))}

                  </div>

                </div>

              )}

            </div>

          )}

        </div>


        {/* USERS — LAST 24 HOURS */}
        {canViewRecentUsers && (
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
        )}

      </div>

    </main>
  );
}
