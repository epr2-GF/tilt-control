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

      {/* LIST */}

      <div className="
        mt-6
        grid
        gap-4
        md:grid-cols-2
      ">

        {loading && (
          <div className="
            md:col-span-2
            bg-slate-900/70
            border border-slate-700
            rounded-xl
            p-6
            text-slate-400
          ">
            Chargement des appareils...
          </div>
        )}

        {!loading &&
          devices.length === 0 && (
            <div className="
              md:col-span-2
              bg-slate-900/70
              border border-slate-700
              rounded-xl
              p-6
              text-slate-400
            ">
              Aucun appareil configuré.
            </div>
          )}

        {!loading &&
          devices.map((device) => (
            <div
              key={device.id}
              className="
                bg-slate-900/70
                border border-slate-700
                rounded-xl
                p-5
              "
            >

              {/* HEADER */}

              <div className="
                flex
                justify-between
                gap-4
              ">

                <div className="min-w-0">

                  <h3 className="font-semibold text-lg">
                    {device.name}
                  </h3>

                  {device.description && (
                    <p className="
                      text-sm
                      text-slate-400
                      mt-1
                    ">
                      {device.description}
                    </p>
                  )}

                </div>

                <div className="
                  text-xs
                  text-blue-400
                  whitespace-nowrap
                ">
                  {device.cardType}
                </div>

              </div>

              {/* DETAILS */}

              <div className="
                mt-5
                space-y-2
                text-sm
              ">

                <p>
                  <span className="text-slate-500">
                    Entité :
                  </span>{" "}
                  <span className="
                    text-slate-300
                    font-mono
                    text-xs
                  ">
                    {device.entityId}
                  </span>
                </p>

                {device.statusEntity && (
                  <p>
                    <span className="text-slate-500">
                      État :
                    </span>{" "}
                    <span className="
                      text-slate-300
                      font-mono
                      text-xs
                    ">
                      {device.statusEntity}
                    </span>
                  </p>
                )}

                {device.cardType === "onOff" && (
                  <>
                    <p>
                      <span className="text-slate-500">
                        ON :
                      </span>{" "}
                      <span className="
                        text-green-400
                        font-mono
                        text-xs
                      ">
                        {device.button1Entity ||
                          "Non configuré"}
                      </span>
                    </p>

                    <p>
                      <span className="text-slate-500">
                        OFF :
                      </span>{" "}
                      <span className="
                        text-red-400
                        font-mono
                        text-xs
                      ">
                        {device.button2Entity ||
                          "Non configuré"}
                      </span>
                    </p>
                  </>
                )}

                <p>
                  <span className="text-slate-500">
                    Zones :
                  </span>{" "}
                  <span className="text-slate-300">
                    {device.zones?.join(", ") ||
                      "Aucune"}
                  </span>
                </p>

                <p>
                  <span className="text-slate-500">
                    État :
                  </span>{" "}
                  <span
                    className={
                      device.enabled
                        ? "text-green-400"
                        : "text-orange-400"
                    }
                  >
                    {device.enabled
                      ? "Activé"
                      : "Désactivé"}
                  </span>
                </p>

              </div>

              {/* ACTIONS */}

              <div className="
                flex
                flex-wrap
                gap-3
                mt-6
              ">

                <button
                  onClick={() =>
                    router.push(
                      `/admin/devices/${device.id}/edit`
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
                    text-sm
                  "
                >
                  <Edit size={16} />
                  Modifier
                </button>

                <button
                  onClick={() =>
                    toggleDevice(device)
                  }
                  className={`
                    flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-lg
                    text-sm
                    ${
                      device.enabled
                        ? "bg-orange-600 hover:bg-orange-500"
                        : "bg-green-600 hover:bg-green-500"
                    }
                  `}
                >
                  <Power size={16} />

                  {device.enabled
                    ? "Désactiver"
                    : "Activer"}
                </button>

                <button
                  onClick={() =>
                    setDeleteDeviceId(
                      device.id
                    )
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    bg-red-600
                    hover:bg-red-500
                    rounded-lg
                    text-sm
                  "
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>

              </div>

            </div>
          ))}

      </div>

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