"use client";

import { useEffect, useState } from "react";

import {
  DatabaseBackup,
  RefreshCw,
} from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import { apiFetch } from "@/lib/api";

type Backup = {
  name: string;
  timestamp?: string;
  hostname?: string;
  valid: boolean;
};

export default function BackupAdminPage() {

  const [backups, setBackups] =
    useState<Backup[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

const [backupRunning, setBackupRunning] =
  useState(false);

const [backupMessage, setBackupMessage] =
  useState<string | null>(null);

const [selectedBackup, setSelectedBackup] =
  useState<string | null>(null);

const [restoreConfirmOpen, setRestoreConfirmOpen] =
  useState(false);

const [restoreStatus, setRestoreStatus] =
  useState<any>(null);


async function requestRestore() {

  if (!selectedBackup) {
    return;
  }

  try {

    setRestoreConfirmOpen(false);

    const result = await apiFetch(
      "/admin/backup/restore",
      {
        method: "POST",
        body: JSON.stringify({
          backup: selectedBackup,
        }),
      }
    );

    setRestoreStatus(result);

  } catch (err) {

    console.error(
      "Restore request failed",
      err
    );

    setRestoreStatus({
      status: "failed",
      message:
        "Impossible de lancer la restauration.",
    });

  }

}

useEffect(() => {

  if (
    !restoreStatus ||
    (
      restoreStatus.status !== "queued" &&
      restoreStatus.status !== "running"
    )
  ) {
    return;
  }

  let cancelled = false;

  const poll = async () => {

    try {

      const status =
        await apiFetch(
          "/admin/backup/restore/status"
        );

      if (cancelled) {
        return;
      }

      setRestoreStatus(status);

      if (
        status.status === "success" ||
        status.status === "failed"
      ) {

        await loadBackups();

        return;
      }

    } catch (err) {

      /*
       * The backend is deliberately restarted
       * after the restore completes, so a temporary
       * connection failure is expected.
       *
       * Keep polling rather than treating it as
       * a restore failure.
       */

      console.log(
        "Restore status temporarily unavailable; retrying..."
      );

    }

    if (!cancelled) {
      setTimeout(poll, 2000);
    }

  };

  const timer =
    setTimeout(poll, 1000);

  return () => {

    cancelled = true;
    clearTimeout(timer);

  };

}, [restoreStatus?.status]);


async function runBackup() {

  try {

    setBackupRunning(true);
    setBackupMessage(null);

    await apiFetch(
      "/admin/backup/run",
      {
        method: "POST",
      }
    );

    setBackupMessage(
      "Sauvegarde terminée avec succès."
    );

    await loadBackups();

  } catch (err) {

    console.error(
      "Backup failed",
      err
    );

    setBackupMessage(
      "La sauvegarde a échoué."
    );

  } finally {

    setBackupRunning(false);

  }

}

  async function loadBackups() {

    try {

      setLoading(true);
      setError(null);

      const data = await apiFetch(
        "/admin/backup/list"
      );

      setBackups(
        Array.isArray(data)
          ? data
          : data.backups || []
      );

    } catch (err) {

      console.error(
        "Failed to load backups",
        err
      );

      setError(
        "Impossible de charger les sauvegardes."
      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    loadBackups();

  }, []);


  const latestBackup =
    backups.length > 0
      ? backups[0]
      : null;


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

      {/* BACK */}

      <div className="mb-6">
        <BackButton />
      </div>


      {/* HEADER */}

      <ZoneHeader
        title="Sauvegarde & restauration"
        subtitle="Gestion des données du serveur"
        icon={
          <DatabaseBackup size={28} />
        }
      />


     {/* STATUS */}

<div className="
  mt-6
  bg-slate-900/70
  border border-slate-700
  rounded-xl
  p-5
">

  <div className="
    flex
    flex-col
    md:flex-row
    md:items-center
    md:justify-between
    gap-4
  ">

    <div>

      <h2 className="
        text-lg
        font-semibold
      ">
        Dernière sauvegarde
      </h2>

      {latestBackup ? (

        <p className="
          text-sm
          text-slate-400
          mt-1
        ">
          {latestBackup.name}
        </p>

      ) : (

        <p className="
          text-sm
          text-slate-500
          mt-1
        ">
          Aucune sauvegarde disponible
        </p>

      )}

    </div>


    <div className="
      flex
      flex-wrap
      gap-3
    ">

      {/* BACKUP NOW */}

      <button
        onClick={runBackup}
        disabled={backupRunning}
        className="
          flex
          items-center
          gap-2
          px-4
          py-2
          bg-blue-600
          hover:bg-blue-500
          disabled:bg-slate-700
          disabled:text-slate-500
          rounded-lg
          transition
          text-sm
          font-medium
        "
      >

        <DatabaseBackup
          size={16}
        />

        {backupRunning
          ? "Sauvegarde..."
          : "Sauvegarder maintenant"}

      </button>



      {/* REFRESH */}

      <button
        onClick={loadBackups}
        disabled={loading}
        className="
          flex
          items-center
          gap-2
          px-4
          py-2
          bg-slate-700
          hover:bg-slate-600
          disabled:bg-slate-800
          rounded-lg
          transition
          text-sm
        "
      >

        <RefreshCw
          size={16}
          className={
            loading
              ? "animate-spin"
              : ""
          }
        />

        Actualiser

      </button>

    </div>

  </div>


  {backupMessage && (

    <div className={`
      mt-4
      text-sm
      ${
        backupMessage.includes("succès")
          ? "text-green-400"
          : "text-red-400"
      }
    `}>

      {backupMessage}

    </div>

  )}

</div>



      {/* BACKUP LIST */}

      <div className="
        mt-6
        bg-slate-900/70
        border border-slate-700
        rounded-xl
        p-5
      ">

        <div className="mb-5">

          <h2 className="
            text-lg
            font-semibold
          ">
            Sauvegardes disponibles
          </h2>

          <p className="
            text-sm
            text-slate-400
            mt-1
          ">
            {backups.length} sauvegarde
            {backups.length !== 1
              ? "s"
              : ""}
          </p>

        </div>


        {loading && (

          <div className="
            text-slate-400
            text-sm
            py-4
          ">
            Chargement des sauvegardes...
          </div>

        )}


        {!loading && error && (

          <div className="
            text-red-400
            text-sm
            py-4
          ">
            {error}
          </div>

        )}


        {!loading &&
          !error &&
          backups.length === 0 && (

          <div className="
            text-slate-500
            text-sm
            py-4
          ">
            Aucune sauvegarde disponible.
          </div>

        )}


        {!loading &&
          !error &&
          backups.length > 0 && (

          <div className="
            space-y-3
          ">

            {backups.map((backup) => (

              <div
                key={backup.name}
                className="
                  flex
                  flex-col
                  md:flex-row
                  md:items-center
                  md:justify-between
                  gap-4
                  bg-slate-950/60
                  border border-slate-800
                  rounded-lg
                  p-4
                "
              >

                <div>

                  <div className="
                    font-mono
                    text-sm
                    text-slate-200
                  ">
                    {backup.name}
                  </div>

                  {backup.hostname && (

                    <div className="
                      text-xs
                      text-slate-500
                      mt-1
                    ">
                      Serveur :{" "}
                      {backup.hostname}
                    </div>

                  )}

                </div>


                <div
                  className={
                    backup.valid
                      ? "text-green-400 text-sm"
                      : "text-red-400 text-sm"
                  }
                >

                  {backup.valid
                    ? "✓ Valide"
                    : "✕ Invalide"}

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

{/* RESTORE */}

<div className="
  mt-6
  bg-slate-900/70
  border border-slate-700
  rounded-xl
  p-5
">

  <h2 className="
    text-lg
    font-semibold
  ">
    Restauration
  </h2>

  <p className="
    text-sm
    text-slate-400
    mt-1
  ">
    Sélectionnez une sauvegarde à restaurer.
  </p>


  <div className="
    mt-4
    flex
    flex-col
    gap-2
  ">

    {backups.map((backup) => (

      <button
        key={backup.name}
        onClick={() =>
          setSelectedBackup(backup.name)
        }
        disabled={!backup.valid}
        className={`
          text-left
          px-4
          py-3
          rounded-lg
          border
          transition
          ${
            selectedBackup === backup.name
              ? "border-blue-500 bg-blue-500/10"
              : "border-slate-800 bg-slate-950/60 hover:bg-slate-900"
          }
          ${
            !backup.valid
              ? "opacity-40 cursor-not-allowed"
              : ""
          }
        `}
      >

        <div className="
          flex
          justify-between
          gap-4
        ">

          <span className="
            font-mono
            text-sm
          ">
            {backup.name}
          </span>

          <span className="
            text-xs
            text-green-400
          ">
            {backup.valid
              ? "Valide"
              : "Invalide"}
          </span>

        </div>

      </button>

    ))}

  </div>


  <button
    onClick={() =>
      setRestoreConfirmOpen(true)
    }
    disabled={
      !selectedBackup ||
      !!restoreStatus &&
      (
        restoreStatus.status === "queued" ||
        restoreStatus.status === "running"
      )
    }
    className="
      mt-5
      px-4
      py-2
      bg-red-600
      hover:bg-red-500
      disabled:bg-slate-800
      disabled:text-slate-500
      rounded-lg
      transition
      text-sm
      font-medium
    "
  >

    Restaurer la sauvegarde sélectionnée

  </button>


  {/* STATUS */}

  {restoreStatus && (

    <div className="
      mt-5
      border-t
      border-slate-800
      pt-4
    ">

      <p className="
        text-sm
        text-slate-400
      ">
        Statut de la restauration :
      </p>

      <p className="
        mt-1
        font-medium
      ">

        {restoreStatus.status === "queued" &&
          "Restauration en attente..."}

        {restoreStatus.status === "running" &&
          "Restauration en cours..."}

        {restoreStatus.status === "success" &&
          "✓ Restauration terminée avec succès."}

        {restoreStatus.status === "failed" &&
          "✕ Échec de la restauration."}

      </p>

      {restoreStatus.message && (

        <p className="
          text-sm
          text-slate-500
          mt-1
        ">
          {restoreStatus.message}
        </p>

      )}

    </div>

  )}

</div>

<ConfirmDialog
  open={restoreConfirmOpen}

  title="Restaurer cette sauvegarde ?"

  message={
    selectedBackup
      ? `La sauvegarde "${selectedBackup}" va remplacer les données actuelles de l'application. Une copie de sécurité des données actuelles sera créée avant la restauration.`
      : ""
  }

  confirmText="Restaurer"
  cancelText="Annuler"

  onCancel={() =>
    setRestoreConfirmOpen(false)
  }

  onConfirm={requestRestore}
/>

    </main>

  );

}