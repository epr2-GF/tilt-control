"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Activity,
  Plus,
  Edit,
  Power,
  Trash2,
} from "lucide-react";

import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";
import ConfirmDialog from "@/components/ConfirmDialog";

import { apiFetch } from "@/lib/api";

export default function DevicesAdminPage() {
  const router = useRouter();

  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDeviceId, setDeleteDeviceId] =
    useState<number | null>(null);

  async function loadDevices() {
    try {
      setLoading(true);

      const data = await apiFetch(
        "/admin/devices"
      );

      setDevices(data);
    } catch (error) {
      console.error(
        "Failed to load devices",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
  }, []);

  async function deleteDevice(id: number) {
    try {
      await apiFetch(
        `/admin/devices/${id}`,
        {
          method: "DELETE",
        }
      );

      await loadDevices();

    } catch (error) {
      console.error(
        "Delete failed",
        error
      );
    }
  }

  async function toggleDevice(
    device: any
  ) {
    try {
      await apiFetch(
        `/admin/devices/${device.id}/enabled`,
        {
          method: "PATCH",
          body: JSON.stringify({
            enabled: !device.enabled,
          }),
        }
      );

      await loadDevices();

    } catch (error) {
      console.error(
        "Failed to change device status",
        error
      );
    }
  }

  const selectedDeleteDevice =
    devices.find(
      (device) =>
        device.id === deleteDeviceId
    );

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
        title="Gestion des appareils"
        subtitle="Configuration Home Assistant"
        icon={<Activity size={28} />}
      />

      {/* ADD BUTTON */}

      <div className="
        mt-6
        flex
        justify-between
        items-center
      ">

        <div>
          <h2 className="text-lg font-semibold">
            Appareils configurés
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            {devices.length} appareil
            {devices.length !== 1
              ? "s"
              : ""}
          </p>
        </div>

        <button
          onClick={() =>
            router.push(
              "/admin/devices/add"
            )
          }
          className="
            flex
            items-center
            gap-2
            px-4
            py-2
            bg-blue-600
            hover:bg-blue-500
            rounded-lg
            transition
            font-medium
          "
        >
          <Plus size={18} />
          Ajouter appareil
        </button>

      </div>

 
      {/* LIST — GROUPED BY CARD TYPE */}

      {!loading && devices.length > 0 && (
        <div className="mt-4 space-y-5">

          {Object.entries(
            devices.reduce(
              (groups: Record<string, any[]>, device: any) => {
                const type = device.cardType || "other";

                if (!groups[type]) {
                  groups[type] = [];
                }

                groups[type].push(device);
                return groups;
              },
              {}
            )
          )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cardType, groupDevices]) => {
              const typeLabels: Record<string, string> = {
                onOff: "Interrupteurs",
                binary: "Capteurs binaires",
                sensor: "Capteurs",
                rollerShutter: "Volets roulants",
                script: "Scripts",
                other: "Autres appareils",
              };

              return (
                <section key={cardType}>

                  {/* TYPE HEADING */}

                  <h2 className="mb-2 border-b border-slate-700 pb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    {typeLabels[cardType] || cardType}
                    <span className="ml-2 text-slate-500">
                      ({groupDevices.length})
                    </span>
                  </h2>

                  {/* DEVICES */}

                  <div className="grid gap-2 md:grid-cols-2">

                    {groupDevices.map((device: any) => (
                      <div
                        key={device.id}
                        className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/70 p-3"
                      >

                        {/* NAME AND ACTIONS */}

                        <div className="flex items-center justify-between gap-2">

                          <div className="min-w-0 flex-1">

                            <h3 className="truncate text-sm font-semibold text-white">
                              {device.name}
                            </h3>

                            {device.description && (
                              <p className="mt-0.5 truncate text-xs text-slate-400">
                                {device.description}
                              </p>
                            )}

                          </div>

                          {/* ICON-ONLY ACTIONS */}

                          <div className="flex shrink-0 items-center gap-1">

                            {/* EDIT */}

                            <button
                              type="button"
                              title="Modifier"
                              aria-label={`Modifier ${device.name}`}
                              onClick={() =>
                                router.push(
                                  `/admin/devices/${device.id}/edit`
                                )
                              }
                              className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 transition"
                            >
                              <Edit size={22} />
                            </button>

                            {/* ACTIVATE / DEACTIVATE */}

                            <button
                              type="button"
                              title={device.enabled ? "Désactiver" : "Activer"}
                              aria-label={`${device.enabled ? "Désactiver" : "Activer"} ${device.name}`}
                              onClick={() => toggleDevice(device)}
                              className={`flex h-11 w-11 items-center justify-center rounded-lg transition ${
                                device.enabled
                                  ? "bg-orange-600 hover:bg-orange-500"
                                  : "bg-green-600 hover:bg-green-500"
                              }`}
                            >
                              <Power size={22} />
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              title="Supprimer"
                              aria-label={`Supprimer ${device.name}`}
                              onClick={() =>
                                setDeleteDeviceId(device.id)
                              }
                              className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-600 hover:bg-red-500 transition"
                            >
                              <Trash2 size={22} />
                            </button>

                          </div>
                        </div>

                        {/* COMPACT DETAILS */}

                        <div className="mt-2 space-y-1 text-xs leading-tight">

                          <p className="break-all text-slate-400">
                            <span className="text-slate-500">Entité : </span>
                            <span className="font-mono text-slate-300">
                              {device.entityId}
                            </span>
                          </p>

                          {device.statusEntity && (
                            <p className="break-all text-slate-400">
                              <span className="text-slate-500">État : </span>
                              <span className="font-mono text-slate-300">
                                {device.statusEntity}
                              </span>
                            </p>
                          )}

                          {device.cardType === "onOff" && (
                            <>
                              <p className="break-all text-slate-400">
                                <span className="text-slate-500">ON : </span>
                                <span className="font-mono text-green-400">
                                  {device.button1Entity || "Non configuré"}
                                </span>
                              </p>

                              <p className="break-all text-slate-400">
                                <span className="text-slate-500">OFF : </span>
                                <span className="font-mono text-red-400">
                                  {device.button2Entity || "Non configuré"}
                                </span>
                              </p>
                            </>
                          )}

                          <p className="text-slate-400">
                            <span className="text-slate-500">Zones : </span>
                            <span className="text-slate-300">
                              {device.zones?.join(", ") || "Aucune"}
                            </span>
                          </p>

                          <p>
                            <span className="text-slate-500">Statut : </span>
                            <span
                              className={
                                device.enabled
                                  ? "text-green-400"
                                  : "text-orange-400"
                              }
                            >
                              {device.enabled ? "Activé" : "Désactivé"}
                            </span>
                          </p>

                        </div>

                      </div>
                    ))}

                  </div>
                </section>
              );
            })}

        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400">
          Chargement des appareils...
        </div>
      )}

      {/* EMPTY STATE */}

      {!loading && devices.length === 0 && (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400">
          Aucun appareil configuré.
        </div>
      )}


      {/* DELETE CONFIRMATION */}

      <ConfirmDialog
        open={
          deleteDeviceId !== null
        }

        title="Supprimer l'appareil ?"

        message={
          selectedDeleteDevice
            ? `"${selectedDeleteDevice.name}" sera supprimé définitivement.`
            : ""
        }

        confirmText="Supprimer"
        cancelText="Annuler"

        onCancel={() =>
          setDeleteDeviceId(null)
        }

        onConfirm={async () => {
          if (
            deleteDeviceId !== null
          ) {
            await deleteDevice(
              deleteDeviceId
            );

            setDeleteDeviceId(null);
          }
        }}
      />

    </main>
  );
}