"use client";

import { useEffect, useState } from "react";
import { Activity, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";

type MiniLogEntry = {
id: number;
entityId: string;
state: string;
timestamp: string;
source: string;
};

type MiniLogCardProps = {
device: {
name: string;
description?: string;
entityId: string;
miniLogMode?: "normal" | "pulse";
miniLogPulseSeconds?: number;
};
icon?: React.ReactNode;
disabled?: boolean;
};

export default function MiniLogCard({
device,
icon,
disabled = false,
}: MiniLogCardProps) {
const [logs, setLogs] = useState<MiniLogEntry[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
let mounted = true;

async function loadLogs() {
  try {
    const data = await apiFetch(
      `/devices/status-log/${encodeURIComponent(
        device.entityId
      )}`
    );

    if (!mounted) return;

    const rawLogs: MiniLogEntry[] =
      Array.isArray(data) ? data : [];

    /*
     * ---------------------------------------------------------
     * MINI LOG DISPLAY FILTER
     * ---------------------------------------------------------
     *
     * Normal mode:
     *   Show the five most recent entries exactly as logged.
     *
     * Pulse mode:
     *   An application command is considered the important event.
     *
     *   Any HA entries immediately following that command within
     *   the configured pulse period are ignored for display.
     *
     *   IMPORTANT:
     *   Nothing is deleted from the real device log.
     *   This only changes what the Mini Log card displays.
     *
     * Example:
     *
     *   11:41:09  TOGGLE  user
     *   11:41:09  off     HA
     *   11:41:10  off     HA
     *
     * becomes:
     *
     *   11:41:09  TOGGLE  user
     *
     * ---------------------------------------------------------
     */

    let displayLogs = rawLogs;

    if (device.miniLogMode === "pulse") {
      const pulseSeconds =
        device.miniLogPulseSeconds ?? 2;

      const pulseMilliseconds =
        pulseSeconds * 1000;

      const filtered: MiniLogEntry[] = [];

      /*
       * Logs arrive newest first.
       *
       * Keep track of the most recent application command
       * which starts a pulse suppression window.
       */
      let pulseUntil = 0;

      for (const log of rawLogs) {
        const timestamp =
          new Date(log.timestamp).getTime();

        /*
         * Application-generated events are identified by
         * anything that is NOT "HA".
         *
         * The backend currently stores the username for app
         * commands and "HA" for Home Assistant events.
         */
        const isHA =
          log.source?.toUpperCase() === "HA";

        if (!isHA) {
          /*
           * This is an application command.
           *
           * Display it and establish a suppression window
           * backwards through the newer HA entries.
           */
          filtered.push(log);

          pulseUntil =
            timestamp +
            pulseMilliseconds;

          continue;
        }

        /*
         * HA event.
         *
         * If it falls inside the pulse window belonging to
         * the application command, don't display it.
         */
        if (
          timestamp <= pulseUntil &&
          timestamp >=
            pulseUntil - pulseMilliseconds
        ) {
          continue;
        }

        filtered.push(log);
      }

      displayLogs = filtered;
    }

    /*
     * Finally limit the Mini Log display to five entries.
     */
    setLogs(displayLogs.slice(0, 5));

  } catch (error) {
    console.error(
      "Failed to load mini log",
      error
    );

    if (mounted) {
      setLogs([]);
    }
  } finally {
    if (mounted) {
      setLoading(false);
    }
  }
}

loadLogs();

return () => {
  mounted = false;
};


}, [
device.entityId,
device.miniLogMode,
device.miniLogPulseSeconds,
]);

return (
<div
className={`         bg-slate-900/70
        border
        border-slate-700
        rounded-xl
        p-5
        shadow-lg
        transition
        ${
          disabled
            ? "opacity-60"
            : "hover:shadow-blue-500/10"
        }
      `}
>
{/* HEADER */} <div className="flex items-center gap-3 mb-4">
{icon && ( <div className="text-blue-400">
{icon} </div>
)}

    <div className="min-w-0">
      <h3 className="font-semibold text-white truncate">
        {device.name}
      </h3>

      {device.description && (
        <p className="text-sm text-slate-400 truncate">
          {device.description}
        </p>
      )}
    </div>

    <div className="ml-auto flex items-center gap-1 text-slate-500">
      <Activity size={16} />

      <span className="text-xs uppercase tracking-wide">
        {device.miniLogMode === "pulse"
          ? "Pulse"
          : "Normal"}
      </span>
    </div>
  </div>

  {/* LOG */}
  <div className="space-y-1">
    {loading ? (
      <div className="text-xs text-slate-500">
        Chargement...
      </div>
    ) : logs.length === 0 ? (
      <div className="text-xs text-slate-500">
        Aucun événement récent
      </div>
    ) : (
logs.map((log) => {
  const time = new Date(
    log.timestamp
  ).toLocaleTimeString(
    "fr-FR",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );

  const displaySource =
    log.source === "HA"
      ? "HA"
      : log.source === "GhostAdmin"
        ? "Superadmin"
        : log.source;

  return (
    <div
      key={log.id}
      className="
        flex
        items-center
        gap-2
        rounded-lg
        bg-slate-800/50
        px-3
        py-2
        text-xs
      "
    >
      <Clock
        size={13}
        className="text-green-400 flex-shrink-0"
      />

      <span className="font-mono text-white">
        {time}
      </span>

      <span className="text-white font-medium">
        {log.state}
      </span>

      <span
        className={`ml-auto font-medium ${
          log.source === "HA"
            ? "text-purple-400"
            : "text-blue-400"
        }`}
      >
        {displaySource}
      </span>
    </div>
  );
})

    )}
  </div>

  {/* PULSE INFORMATION */}
  {device.miniLogMode === "pulse" && (
    <div className="mt-3 text-xs text-slate-500">
      Impulsion :{" "}
      {device.miniLogPulseSeconds ?? 2}s
    </div>
  )}
</div>
)}
