"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  Send,
  CheckCircle,
  UserCog,
  LogOut,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import { useToast } from "@/context/ToastContext";

type AuditLog = {
  event: string;
  actor?: string;
  time: string | number;
  severity?: string;
  target?: string;
  role?: string;
  ip?: string;
  details?: {
    deviceId?: number;
    entityId?: string;
    action?: string;
    result?: string;
    error?: string;
    [key: string]: any;
  } | string;
};

export default function AuditPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
const { showToast } = useToast();
const [showClearConfirm, setShowClearConfirm] =
  useState(false);

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.push("/login");
      return;
    }

if (user.role !== "superadmin") {
  router.push("/");
  return;
}

    async function loadLogs() {
      try {
        const data = await apiFetch("/admin/audit");

        setLogs(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Failed to load audit logs",
          error
        );
      }
    }

    loadLogs();
  }, [user, router]);

  if (user === undefined || !user) {
    return null;
  }

  /*
   * Only show the last 3 days.
   */
  const threeDaysAgo =
    Date.now() - 3 * 24 * 60 * 60 * 1000;

  const recentLogs = logs.filter(
    log =>
      new Date(log.time).getTime() >=
      threeDaysAgo
  );

  /*
   * Group logs by date.
   */
  const groupedLogs: Record<
    string,
    AuditLog[]
  > = {};

  recentLogs.forEach(log => {
    const date = new Date(log.time);

    const key = date.toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );

    if (!groupedLogs[key]) {
      groupedLogs[key] = [];
    }

    groupedLogs[key].push(log);
  });

const handleClearLog = async () => {
  try {
    await apiFetch("/admin/audit", {
      method: "DELETE",
    });

    setLogs([]);

    showToast(
      "Journal effacé",
      "success"
    );

  } catch (error) {
    console.error(
      "Failed to clear audit log",
      error
    );

    showToast(
      "Impossible d'effacer le journal",
      "error"
    );

  } finally {
    setShowClearConfirm(false);
  }
};




  /*
   * Get device details.
   */
  function getDetails(log: AuditLog) {
    if (
      log.details &&
      typeof log.details === "object"
    ) {
      return log.details;
    }

    return {};
  }

  /*
   * Determine colour and icon.
   *
   * Device events are checked before
   * generic warning/error handling.
   */
function getLogStyle(log: AuditLog) {
  const event = String(log.event || "")
    .trim()
    .toUpperCase();

  switch (event) {
    case "DEVICE_CONTROL":
      return {
        color: "text-yellow-300",
        icon: (
          <Send
            size={14}
            className="text-yellow-300"
          />
        ),
      };

   case "DEVICE_CONTROL_FAILED":
case "TEST_DEVICE_CONTROL_FAILED":
  return {
    color: "text-orange-400",
    icon: (
      <AlertTriangle
        size={14}
        className="text-orange-400"
      />
    ),
  };

    case "USER_DELETED":
    case "DEVICE_DELETED":
      return {
        color: "text-red-400",
        icon: (
          <AlertTriangle
            size={14}
            className="text-red-400"
          />
        ),
      };

    case "USER_DISABLED":
    case "DEVICE_DISABLED":
      return {
        color: "text-orange-400",
        icon: (
          <AlertTriangle
            size={14}
            className="text-orange-400"
          />
        ),
      };

    case "USER_CREATED":
    case "DEVICE_CREATED":
      return {
        color: "text-green-400",
        icon: (
          <CheckCircle
            size={14}
            className="text-green-400"
          />
        ),
      };

    case "USER_UPDATED":
    case "DEVICE_UPDATED":
      return {
        color: "text-yellow-300",
        icon: (
          <UserCog
            size={14}
            className="text-yellow-300"
          />
        ),
      };

case "LOGIN_SUCCESS":
case "SUPERADMIN_LOGIN":
  return {
    color: "text-green-400",
    icon: (
      <CheckCircle
        size={14}
        className="text-green-400"
      />
    ),
  };

  case "LOGIN_DISABLED_ACCOUNT":
  return {
    color: "text-orange-400",
    icon: (
      <AlertTriangle
        size={14}
        className="text-orange-400"
      />
    ),
  };


case "LOGOUT":
  return {
    color: "text-slate-300",
    icon: (
      <LogOut
        size={14}
        className="text-slate-300"
      />
    ),
  };

    default:
      if (
        event.includes("FAILED") ||
        event.includes("ÉCHEC") ||
        event.includes("UNSUCCESSFUL")
      ) {
        return {
          color: "text-red-400",
          icon: (
            <AlertTriangle
              size={14}
              className="text-red-400"
            />
          ),
        };
      }

      return {
        color: "text-green-400",
        icon: (
          <CheckCircle
            size={14}
            className="text-green-400"
          />
        ),
      };
  }
}

  /*
   * Friendly description.
   */
function getDescription(log: AuditLog) {
  const details = getDetails(log);
  const event = log.event?.toUpperCase() || "";
  const target = log.target || "Utilisateur";

  // Successful device control
  if (event === "DEVICE_CONTROL") {
    const device =
      log.target ||
      details.deviceId ||
      "Appareil";

    const action =
      details.action || "";

    return `${device}${action ? ` → ${action}` : ""}`;
  }

  // Failed device control
  if (event === "DEVICE_CONTROL_FAILED") {
    const device =
      log.target ||
      details.deviceId ||
      "Appareil";

    const action =
      details.action || "";

    /*
     * Use the friendly backend message where available.
     */
    if (
      typeof details.error === "string" &&
      details.error.length > 0
    ) {
      const error = details.error;

      if (
        error.includes("HA entity not found") ||
        error.includes("HTTP 404")
      ) {
        return `${device}${action ? ` → ${action}` : ""} — Appareil introuvable dans Home Assistant`;
      }

      return `${device}${action ? ` → ${action}` : ""} — ${error}`;
    }

    return `${device}${action ? ` → ${action}` : ""} — Commande échouée`;
  }

  // User created
  if (event === "USER_CREATED") {
    return `Utilisateur créé → ${target}`;
  }

  // User disabled
  if (event === "USER_DISABLED") {
    return `Utilisateur désactivé → ${target}`;
  }

  // User enabled
  if (event === "USER_ENABLED") {
    return `Utilisateur réactivé → ${target}`;
  }
  // Device disabled
  if (event === "DEVICE_DISABLED") {
    return `Appareil désactivé → ${target}`;
  }

  // Device enabled
  if (event === "DEVICE_ENABLED") {
    return `Appareil réactivé → ${target}`;
  }
  // User deleted
  if (event === "USER_DELETED") {
    return `Utilisateur supprimé → ${target}`;
  }

  // User modified
  if (event === "USER_UPDATED") {
    const changes = details.changes;

    if (
      changes &&
      typeof changes === "object"
    ) {
      const fields = Object.keys(changes);

      const friendlyFields = fields.map(field => {
        switch (field) {
          case "role":
            return "niveau";

          case "accessStart":
          case "accessEnd":
            return "horaires";

          case "remoteAccess":
            return "accès distant";

          case "permissions":
            return "permissions";

          case "disabled":
            return "statut";

          case "username":
            return "nom";

          case "password":
          return "mot de passe";

          default:
            return field;
        }
      });

      const uniqueFields =
        [...new Set(friendlyFields)];

      return uniqueFields.length > 0
        ? `Utilisateur modifié → ${target} (${uniqueFields.join(", ")})`
        : `Utilisateur modifié → ${target}`;
    }

    return `Utilisateur modifié → ${target}`;
  }

  // Superadmin login
  if (event === "SUPERADMIN_LOGIN") {
    return "Connexion Superadmin";
  }

  // Successful login
  if (event === "LOGIN_SUCCESS") {
    return "Connexion réussie";
  }

  // Failed login
  if (
    event === "LOGIN_FAILED" ||
    event === "LOGIN_FAILURE"
  ) {
    return "Échec de connexion";
  }

  // Logout
  if (
    event === "LOGOUT" ||
    event === "USER_LOGOUT"
  ) {
    return "Déconnexion";
  }

// Login with disabled account
if (event === "LOGIN_DISABLED_ACCOUNT") {
  return "Tentative de connexion — compte désactivé";
}

  // Other events
  return log.event;
}

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
  title="Journal"
  subtitle="Historique sécurité système"
  icon={<ShieldCheck size={28} />}
  action={
    <button
      onClick={() => setShowClearConfirm(true)}
      className="
        px-4
        py-2
        rounded-lg
        border
        border-red-500/30
        bg-red-500/10
        text-red-400
        hover:bg-red-500/20
        transition
        text-sm
        font-medium
      "
    >
      Effacer le journal
    </button>
  }
/>
      <div className="mt-6 space-y-6">

        {Object.entries(groupedLogs).length === 0 ? (
          <div className="text-slate-500 text-sm">
            Aucun événement durant les
            trois derniers jours.
          </div>
        ) : (
          Object.entries(groupedLogs).map(
            ([date, dateLogs]) => (

              <section key={date}>

                {/* DATE */}
                <div className="
                  text-xs
                  uppercase
                  tracking-wider
                  text-slate-400
                  font-semibold
                  mb-2
                  px-1
                ">
                  {date}
                </div>

                {/* LOG CONTAINER */}
                <div className="
                  bg-slate-900/60
                  border
                  border-slate-800
                  rounded-lg
                  overflow-hidden
                ">

                  {dateLogs.map(
                    (log, index) => {

                      const style =
                        getLogStyle(log);

                      const time =
                        new Date(
                          log.time
                        ).toLocaleTimeString(
                          "fr-FR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        );

                      return (
                        <div
                          key={`${log.time}-${index}`}
                          className="
                            flex
                            items-start
                            gap-2
                            min-h-[34px]
                            px-3
                            py-2
                            border-b
                            border-slate-800/70
                            last:border-b-0
                            text-xs
                          "
                        >

                          {/* ICON */}
                          <div className="
                            w-4
                            flex-shrink-0
                            pt-0.5
                          ">
                            {style.icon}
                          </div>

                          {/* TIME */}
                          <div className="
                            w-[42px]
                            flex-shrink-0
                            text-slate-500
                            font-mono
                          ">
                            {time}
                          </div>

                          {/* ACTOR */}
                          <div className="
                            w-[55px]
                            sm:w-[80px]
                            flex-shrink-0
                            text-slate-300
                            truncate
                            font-medium
                          ">
                            {log.actor === "GhostAdmin" ||
                            log.role === "superadmin"
                              ? "Superadmin"
                              : log.actor || "—"}
                          </div>

                          {/* DESCRIPTION */}
                          <div
                            className={`
                              flex-1
                              min-w-0
                              whitespace-normal
                              break-words
                              leading-tight
                              ${style.color}
                            `}
                          >
                            {getDescription(log)}
                          </div>

                        </div>
                      );

                    }
                  )}

                </div>

              </section>

            )
          )
        )}

      </div>
{showClearConfirm && (
  <div
    className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/60
      backdrop-blur-sm
      px-4
    "
  >
    <div
      className="
        w-full
        max-w-md
        bg-slate-900
        border
        border-slate-700
        rounded-xl
        shadow-2xl
        p-6
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex
            items-center
            justify-center
            w-10
            h-10
            rounded-lg
            bg-red-500/10
            text-red-400
            flex-shrink-0
          "
        >
          <AlertTriangle size={22} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">
            Effacer le journal ?
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Tous les événements enregistrés seront
            définitivement supprimés.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() =>
            setShowClearConfirm(false)
          }
          className="
            px-4
            py-2
            rounded-lg
            border
            border-slate-700
            bg-slate-800
            text-slate-300
            hover:bg-slate-700
            transition
            text-sm
            font-medium
          "
        >
          Annuler
        </button>

        <button
          onClick={handleClearLog}
          className="
            px-4
            py-2
            rounded-lg
            border
            border-red-500/30
            bg-red-500/10
            text-red-400
            hover:bg-red-500/20
            transition
            text-sm
            font-medium
          "
        >
          Effacer le journal
        </button>
      </div>
    </div>
  </div>
)}

    </main>
  );
}