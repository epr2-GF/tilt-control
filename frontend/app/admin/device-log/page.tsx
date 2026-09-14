
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  RefreshCw,
  Shield,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

type DeviceStatusLogEntry = {
  id: number;
  entityId: string;
  state: string;
  timestamp: string;
  source: string;
};

export default function DeviceLogPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [logs, setLogs] = useState<DeviceStatusLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] =
    useState<number | null>(null);

  /* -------------------------------------------------------------
     AUTH GUARD
  ------------------------------------------------------------- */

  useEffect(() => {
    if (user === null) {
      router.push("/login");
      return;
    }

    if (user && user.role !== "superadmin") {
      router.push("/");
    }
  }, [user, router]);

  /* -------------------------------------------------------------
     LOAD DEVICE LOG
  ------------------------------------------------------------- */

  async function loadLogs() {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/admin/device-status-log");

      if (!Array.isArray(data)) {
        throw new Error(
          "Le serveur n'a pas retourné un journal valide."
        );
      }

      setLogs(data);
    } catch (err: any) {
      console.error("Failed to load device status log", err);

      setError(
        err?.message ||
          "Impossible de charger le journal des appareils."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.role === "superadmin") {
      loadLogs();
    }
  }, [user]);

  function requestDeleteLogEntry(id: number) {
    setDeleteConfirmId(id);
  }

  async function confirmDeleteLogEntry() {
    if (deleteConfirmId === null) {
      return;
    }

    const id = deleteConfirmId;

    setDeleteConfirmId(null);

    try {
      await apiFetch(`/devices/device-status-log/${id}`, {
        method: "DELETE",
      });

      setLogs((currentLogs) =>
        currentLogs.filter((log) => log.id !== id)
      );
    } catch (err: any) {
      console.error(
        "Failed to delete device status log entry",
        err
      );

      setError(
        err?.message ||
          "Impossible de supprimer cette entrée."
      );
    }
  }

  /* -------------------------------------------------------------
     LOADING AUTH
  ------------------------------------------------------------- */

  if (user === undefined) {
    return (
      <div className="
        min-h-screen
        bg-slate-950
        text-white
        flex
        items-center
        justify-center
      ">
        <div className="
          flex
          flex-col
          items-center
          gap-2
        ">
          <div className="
            h-6
            w-6
            animate-spin
            rounded-full
            border-2
            border-cyan-500
            border-t-transparent
          " />

          <span className="text-sm text-slate-400">
            Vérification de la session...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "superadmin") {
    return null;
  }

  /* -------------------------------------------------------------
     DATE FORMAT
  ------------------------------------------------------------- */

  function formatDate(timestamp: string) {
    try {
      return new Date(timestamp).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "medium",
      });
    } catch {
      return timestamp;
    }
  }

  /* -------------------------------------------------------------
     PAGE
  ------------------------------------------------------------- */

  return (
    <main className="
      min-h-screen
      bg-slate-950
      text-white
      p-6
    ">

      {/* HEADER */}

      <div className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        sm:justify-between
        gap-4
        mb-6
      ">

        <div className="
          flex
          items-center
          gap-3
        ">

          <ClipboardList
            className="text-cyan-400"
            size={28}
          />

          <div>

            <h1 className="
              text-2xl
              font-bold
            ">
              Journal des appareils
            </h1>

            <p className="
              text-sm
              text-slate-400
            ">
              Historique complet des changements d'état
            </p>

          </div>

        </div>

        <div className="
          flex
          gap-2
        ">

          <button
            onClick={loadLogs}
            disabled={loading}
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-lg
              bg-cyan-600
              hover:bg-cyan-500
              disabled:opacity-50
              transition
            "
          >

            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />

            Actualiser

          </button>

          <button
            onClick={() => router.push("/")}
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-lg
              bg-slate-800
              hover:bg-slate-700
              transition
            "
          >

            <ArrowLeft size={16} />

            Accueil

          </button>

        </div>

      </div>

      {/* SUPERADMIN INDICATOR */}

      <div className="
        flex
        items-center
        gap-2
        mb-6
        px-4
        py-3
        rounded-lg
        bg-slate-900
        border
        border-slate-700
        text-sm
        text-slate-400
      ">

        <Shield
          size={16}
          className="text-purple-400"
        />

        <span>
          Accès superadmin
        </span>

        <span className="text-slate-600">
          •
        </span>

        <span>
          {logs.length} événement
          {logs.length !== 1 ? "s" : ""}
        </span>

      </div>

      {/* ERROR */}

      {error && (
        <div className="
          mb-6
          p-4
          rounded-lg
          bg-red-950/50
          border
          border-red-800
          text-red-300
        ">
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading && logs.length === 0 && (
        <div className="
          flex
          items-center
          justify-center
          py-16
          text-slate-400
        ">

          <div className="
            flex
            items-center
            gap-3
          ">

            <div className="
              h-5
              w-5
              animate-spin
              rounded-full
              border-2
              border-cyan-500
              border-t-transparent
            " />

            Chargement du journal...

          </div>

        </div>
      )}

      {/* EMPTY */}

      {!loading && !error && logs.length === 0 && (
        <div className="
          bg-slate-900
          border
          border-slate-700
          rounded-xl
          p-10
          text-center
          text-slate-400
        ">
          Aucun événement enregistré.
        </div>
      )}

      {/* LOG TABLE */}

      {logs.length > 0 && (
        <div className="
          bg-slate-900/70
          border
          border-slate-700
          rounded-xl
          overflow-hidden
        ">

          {/* DESKTOP HEADER */}

          <div className="
            hidden
            md:grid
            md:grid-cols-[70px_1fr_160px_180px_100px_40px]
            gap-4
            px-4
            py-3
            bg-slate-800
            border-b
            border-slate-700
            text-xs
            uppercase
            tracking-wide
            text-slate-400
          ">

            <div>ID</div>
            <div>Entité</div>
            <div>État</div>
            <div>Date / heure</div>
            <div>Source</div>
            <div></div>

          </div>

          {/* LOG ENTRIES */}

          <div className="
            divide-y
            divide-slate-800
          ">

            {logs.map((log) => (
              <div
                key={log.id}
                className="
                  px-4
                  py-4
                  hover:bg-slate-800/50
                  transition
                "
              >

                {/* DESKTOP */}

                <div className="
                  hidden
                  md:grid
                  md:grid-cols-[70px_1fr_160px_180px_100px_40px]
                  gap-4
                  items-center
                  text-sm
                ">

                  {/* ID */}

                  <div className="
                    text-white
                    font-mono
                  ">
                    #{log.id}
                  </div>

                  {/* ENTITY */}

                  <div className="
                    font-mono
                    text-cyan-300
                    break-all
                  ">
                    {log.entityId}
                  </div>

                  {/* STATE */}

                  <div>
                    <span className={`
                      inline-flex
                      px-2
                      py-1
                      rounded-md
                      text-xs
                      font-semibold
                      ${
                        log.state === "on" ||
                        log.state === "open" ||
                        log.state === "unlocked"
                          ? "bg-green-900/50 text-green-300"
                          : log.state === "off" ||
                            log.state === "closed" ||
                            log.state === "locked"
                          ? "bg-red-900/50 text-red-300"
                          : "bg-slate-700 text-slate-300"
                      }
                    `}>
                      {log.state}
                    </span>
                  </div>

                  {/* DATE / TIME */}

                  <div className="
                    text-white
                    text-xs
                  ">
                    {formatDate(log.timestamp)}
                  </div>

                  {/* SOURCE */}

                  <div className="
                    text-xs
                    text-white
                  ">
                    {log.source === "GhostAdmin"
                      ? "Superadmin"
                      : log.source}
                  </div>

                  {/* DELETE */}

                  <button
                    onClick={() =>
                      requestDeleteLogEntry(log.id)
                    }
                    title="Supprimer cette entrée"
                    className="
                      flex
                      items-center
                      justify-center
                      w-8
                      h-8
                      rounded-md
                      text-white
                      hover:text-red-400
                      hover:bg-red-950/40
                      transition
                    "
                  >
                    <Trash2 size={16} />
                  </button>

                </div>

                {/* MOBILE */}

                <div className="
                  md:hidden
                  space-y-2
                ">

                  <div className="
                    flex
                    items-start
                    gap-3
                  ">

                    {/* ENTITY */}

                    <span className="
                      font-mono
                      text-cyan-300
                      text-sm
                      break-all
                      min-w-0
                      flex-1
                    ">
                      {log.entityId}
                    </span>

                    {/* ID + DELETE */}

                    <div className="
                      flex
                      items-center
                      gap-2
                      shrink-0
                    ">

                      <span className="
                        text-xs
                        text-white
                        font-mono
                      ">
                        #{log.id}
                      </span>

                      <button
                        onClick={() =>
                          requestDeleteLogEntry(log.id)
                        }
                        title="Supprimer cette entrée"
                        className="
                          flex
                          items-center
                          justify-center
                          w-8
                          h-8
                          rounded-md
                          text-white
                          hover:text-red-400
                          hover:bg-red-950/40
                          transition
                        "
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </div>

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                  ">

                    <span className={`
                      inline-flex
                      px-2
                      py-1
                      rounded-md
                      text-xs
                      font-semibold
                      ${
                        log.state === "on" ||
                        log.state === "open" ||
                        log.state === "unlocked"
                          ? "bg-green-900/50 text-green-300"
                          : log.state === "off" ||
                            log.state === "closed" ||
                            log.state === "locked"
                          ? "bg-red-900/50 text-red-300"
                          : "bg-slate-700 text-slate-300"
                      }
                    `}>
                      {log.state}
                    </span>

                    <span className="
                      text-xs
                      text-white
                    ">
                      {formatDate(log.timestamp)}
                    </span>

                  </div>

                  <div className="
                    text-xs
                    text-white
                  ">
                    Source :{" "}
                    {log.source === "GhostAdmin"
                      ? "Superadmin"
                      : log.source}
                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>
      )}

      {deleteConfirmId !== null && (
        <div className="
          fixed
          bottom-6
          left-1/2
          -translate-x-1/2
          z-50
          w-[calc(100%-2rem)]
          max-w-md
          bg-slate-900
          border
          border-slate-700
          rounded-xl
          shadow-2xl
          px-5
          py-4
        ">

          <div className="
            flex
            items-start
            gap-3
          ">

            <Trash2
              size={20}
              className="
                text-red-400
                flex-shrink-0
                mt-0.5
              "
            />

            <div className="flex-1">

              <div className="
                text-white
                font-semibold
              ">
                Supprimer cette entrée ?
              </div>

              <div className="
                text-sm
                text-slate-400
                mt-1
              ">
                Cette action supprimera définitivement
                cette entrée du journal.
              </div>

              <div className="
                flex
                justify-end
                gap-2
                mt-4
              ">

                <button
                  onClick={() =>
                    setDeleteConfirmId(null)
                  }
                  className="
                    px-4
                    py-2
                    rounded-lg
                    bg-slate-800
                    hover:bg-slate-700
                    text-white
                    text-sm
                    transition
                  "
                >
                  Annuler
                </button>

                <button
                  onClick={confirmDeleteLogEntry}
                  className="
                    px-4
                    py-2
                    rounded-lg
                    bg-red-600
                    hover:bg-red-500
                    text-white
                    text-sm
                    font-medium
                    transition
                  "
                >
                  Supprimer
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}


