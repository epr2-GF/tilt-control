"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import BackButton from "@/components/BackButton";
import ZoneHeader from "@/components/ZoneHeader";

import {
  Activity,
  Plus,
  DoorOpen,
  Lightbulb,
  Warehouse,
  Power,
  Fan,
  Thermometer,
  Camera,
  Lock,
  Unlock,
  Droplets,
  Sun,
  Settings,
  Home,
  ToggleLeft,
  Gauge,
  CircleHelp,
  ArrowRightLeft,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

export default function DevicesAdminPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDeviceId, setDeleteDeviceId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    entityId: "",
    statusEntity: "",
    cardType: "binary",

    statusTrue: "ON",
    statusFalse: "OFF",

    zones: ["tilt"],
    icon: "device",
    enabled: true,
  });

  const zones = [
    { id: "accueil", label: "Accueil" },
    { id: "tilt", label: "Tilt" },
    { id: "salle-des-fetes", label: "Salle des Fêtes" },
    { id: "epr2", label: "EPR2" },
    { id: "restaurant", label: "Restaurant" },
    { id: "exterior", label: "Extérieur" },
    { id: "pecherie", label: "Pêcherie" },
    { id: "logement-du-lac", label: "Logement du Lac" },
    { id: "logement-du-tilt", label: "Logement du Tilt" },
  ];

  const iconOptions = [
    { value: "device", label: "Appareil", icon: CircleHelp },
    { value: "door", label: "Porte", icon: DoorOpen },
    { value: "light", label: "Éclairage", icon: Lightbulb },
    { value: "warehouse", label: "Entrepôt", icon: Warehouse },
    { value: "power", label: "Alimentation", icon: Power },
    { value: "fan", label: "Ventilateur", icon: Fan },
    { value: "thermometer", label: "Température", icon: Thermometer },
    { value: "camera", label: "Caméra", icon: Camera },
    { value: "lock", label: "Verrouillé", icon: Lock },
    { value: "unlock", label: "Déverrouillé", icon: Unlock },
    { value: "water", label: "Eau", icon: Droplets },
    { value: "sun", label: "Solaire", icon: Sun },
    { value: "home", label: "Maison", icon: Home },
    { value: "switch", label: "Interrupteur", icon: ToggleLeft },
    { value: "gauge", label: "Mesure", icon: Gauge },
    { value: "settings", label: "Réglages", icon: Settings },
    { value: "gateslide", label: "Portail coulisse", icon: ArrowRightLeft },
  ];

  async function deleteDevice(id: number) {
    try {
      await apiFetch(`/admin/devices/${id}`, {
        method: "DELETE",
      });

      loadDevices();
    } catch (error) {
      console.error("Delete failed", error);
    }
  }

  function editDevice(device: any) {
    setEditingId(device.id);

    setForm({
      name: device.name,
      description: device.description || "",
      entityId: device.entityId,
      statusEntity: device.statusEntity || "",
      cardType: device.cardType,

      statusTrue: device.statusTrue || "ON",
      statusFalse: device.statusFalse || "OFF",

      zones: device.zones,
      icon: device.icon || "device",
      enabled: device.enabled ?? true,
    });

    setShowForm(true);
  }

  async function loadDevices() {
    try {
      const data = await apiFetch("/admin/devices");

      setDevices(data);
    } catch (error) {
      console.error("Failed to load devices", error);
    }
  }

  useEffect(() => {
    loadDevices();
  }, []);

  async function saveDevice() {
    try {
      if (editingId) {
        await apiFetch(`/admin/devices/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch("/admin/devices", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }

      setForm({
        name: "",
        description: "",
        entityId: "",
        statusEntity: "",
        cardType: "binary",

        statusTrue: "ON",
        statusFalse: "OFF",

        zones: ["tilt"],
        icon: "device",
        enabled: true,
      });

      setEditingId(null);
      setShowForm(false);

      loadDevices();
    } catch (error) {
      console.error("Save failed", error);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">

      <div className="mb-6">
        <BackButton />
      </div>

      <ZoneHeader
        title="Gestion des appareils"
        subtitle="Configuration Home Assistant"
        icon={<Activity size={28} />}
      />

      <div className="mt-6">

        <button
          onClick={() => setShowForm(!showForm)}
          className="
            flex items-center gap-2
            px-4 py-2
            bg-blue-600
            hover:bg-blue-500
            rounded-lg
            transition
          "
        >
          <Plus size={18} />
          Ajouter appareil
        </button>

        {showForm && (
          <div
            className="
              mt-6
              bg-slate-900/70
              border border-slate-700
              rounded-xl
              p-5
            "
          >

            <h3 className="font-semibold mb-4">
              {editingId ? "Modifier appareil" : "Nouvel appareil"}
            </h3>

            <div className="grid gap-4">

              {/* NAME */}

              <input
                className="
                  bg-slate-800
                  border border-slate-700
                  rounded-lg
                  p-3
                "
                placeholder="Nom"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />

              {/* DESCRIPTION */}

              <input
                className="
                  bg-slate-800
                  border border-slate-700
                  rounded-lg
                  p-3
                "
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />

              {/* ENTITY */}

              <input
                className="
                  bg-slate-800
                  border border-slate-700
                  rounded-lg
                  p-3
                "
                placeholder="Entity ID Home Assistant"
                value={form.entityId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    entityId: e.target.value,
                  })
                }
              />

              {/* STATUS ENTITY */}

              <input
                className="
                  bg-slate-800
                  border border-slate-700
                  rounded-lg
                  p-3
                "
                placeholder="Status Entity ID (optional)"
                value={form.statusEntity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    statusEntity: e.target.value,
                  })
                }
              />

              {/* CARD TYPE */}

              <select
                className="
                  bg-slate-800
                  border border-slate-700
                  rounded-lg
                  p-3
                "
                value={form.cardType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cardType: e.target.value,
                  })
                }
              >
                <option value="device">Device</option>
                <option value="binary">Binary</option>
                <option value="rollerShutter">Roller shutter</option>
                <option value="sensor">Sensor</option>
              </select>

              {/* ICON */}

              <div>

                <label className="block mb-2 text-sm text-slate-300">
                  Icône
                </label>

                <select
                  className="
                    w-full
                    bg-slate-800
                    border border-slate-700
                    rounded-lg
                    p-3
                  "
                  value={form.icon}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      icon: e.target.value,
                    })
                  }
                >
                  {iconOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                {(() => {
                  const selected = iconOptions.find(
                    (option) => option.value === form.icon
                  );

                  if (!selected) {
                    return null;
                  }

                  const Icon = selected.icon;

                  return (
                    <div
                      className="
                        mt-3
                        flex
                        items-center
                        gap-3
                        text-slate-300
                      "
                    >
                      <div
                        className="
                          p-2
                          rounded-lg
                          bg-slate-800
                          border
                          border-slate-700
                        "
                      >
                        <Icon size={22} />
                      </div>

                      <span className="text-sm">
                        Aperçu : {selected.label}
                      </span>
                    </div>
                  );
                })()}

              </div>

              {/* STATUS VALUES */}

              <div className="mt-2">

                <p className="mb-3 text-sm font-medium text-slate-300">
                  Valeurs d'état
                </p>

                <div className="grid gap-4">

                  <div>

                    <label className="block mb-2 text-sm text-green-400">
                      Valeur verte (état actif)
                    </label>

                    <input
                      className="
                        w-full
                        bg-slate-800
                        border border-slate-700
                        rounded-lg
                        p-3
                      "
                      placeholder="Ex : Ouvert"
                      value={form.statusTrue}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          statusTrue: e.target.value,
                        })
                      }
                    />

                  </div>

                  <div>

                    <label className="block mb-2 text-sm text-red-400">
                      Valeur rouge (état inactif)
                    </label>

                    <input
                      className="
                        w-full
                        bg-slate-800
                        border border-slate-700
                        rounded-lg
                        p-3
                      "
                      placeholder="Ex : Fermé"
                      value={form.statusFalse}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          statusFalse: e.target.value,
                        })
                      }
                    />

                  </div>

                </div>

              </div>

              {/* ZONES */}

              <div>

                <p className="mb-2 text-sm text-slate-400">
                  Zones
                </p>

                <div className="grid grid-cols-2 gap-2">

                  {zones.map((zone) => (

                    <label
                      key={zone.id}
                      className="
                        flex
                        items-center
                        gap-2
                        bg-slate-800
                        p-2
                        rounded-lg
                      "
                    >

                      <input
                        type="checkbox"
                        checked={form.zones.includes(zone.id)}
                        onChange={(e) => {

                          if (e.target.checked) {

                            setForm({
                              ...form,
                              zones: [
                                ...form.zones,
                                zone.id,
                              ],
                            });

                          } else {

                            setForm({
                              ...form,
                              zones: form.zones.filter(
                                (z) => z !== zone.id
                              ),
                            });

                          }

                        }}
                      />

                      {zone.label}

                    </label>

                  ))}

                </div>

              </div>

              {/* SAVE */}

              <button
                onClick={saveDevice}
                className="
                  mt-5
                  px-5
                  py-3
                  bg-green-600
                  hover:bg-green-500
                  rounded-lg
                  font-semibold
                "
              >
                {editingId
                  ? "Enregistrer modifications"
                  : "Enregistrer"}
              </button>

            </div>

          </div>
        )}

      </div>

      {/* DEVICE LIST */}

      <div className="mt-6 grid gap-4 md:grid-cols-2">

        {devices.length === 0 && (
          <div
            className="
              bg-slate-900/70
              border border-slate-700
              rounded-xl
              p-5
              text-slate-400
            "
          >
            Aucun appareil configuré
          </div>
        )}

        {devices.map((device) => (

          <div
            key={device.id}
            className="
              bg-slate-900/70
              border border-slate-700
              rounded-xl
              p-5
            "
          >

            <div className="flex justify-between">

              <div>

                <h3 className="font-semibold text-lg">
                  {device.name}
                </h3>

                <p className="text-sm text-slate-400">
                  {device.description}
                </p>

              </div>

              <div className="text-xs text-blue-400">
                {device.cardType}
              </div>

            </div>

            <div className="mt-4 space-y-1 text-sm">

              <p>
                📍 Zones:{" "}
                <span className="text-slate-300">
                  {device.zones.join(", ")}
                </span>
              </p>

              <p>
                ⚙️ Enabled:{" "}
                <span
                  className={
                    device.enabled
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {device.enabled ? "Yes" : "No"}
                </span>
              </p>

            </div>

            {/* ACTIONS */}

            <div className="flex gap-3 mt-5">

              <button
                onClick={() => editDevice(device)}
                className="
                  px-4
                  py-2
                  bg-blue-600
                  hover:bg-blue-500
                  rounded-lg
                  text-sm
                "
              >
                Modifier
              </button>
<button
  onClick={async () => {
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

      loadDevices();

    } catch (error) {
      console.error(
        "Failed to change device status",
        error
      );
    }
  }}
  className={`
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
  {device.enabled
    ? "Désactiver"
    : "Activer"}
</button>
              <button
                onClick={() => setDeleteDeviceId(device.id)}
                className="
                  px-4
                  py-2
                  bg-red-600
                  hover:bg-red-500
                  rounded-lg
                  text-sm
                "
              >
                Supprimer
              </button>

            </div>

          </div>

        ))}

      </div>

      <ConfirmDialog
        open={deleteDeviceId !== null}
        title="Supprimer l'appareil ?"
        message={
          devices.find((d) => d.id === deleteDeviceId)
            ? `"${devices.find((d) => d.id === deleteDeviceId)?.name}" sera supprimé définitivement.`
            : ""
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        onCancel={() => setDeleteDeviceId(null)}
        onConfirm={async () => {
          if (deleteDeviceId !== null) {
            await deleteDevice(deleteDeviceId);
            setDeleteDeviceId(null);
          }
        }}
      />

    </main>
  );
}