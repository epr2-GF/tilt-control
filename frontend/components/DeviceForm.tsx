"use client";

import {
  ArrowRightLeft,
  Camera,
  CircleHelp,
  DoorOpen,
  Droplets,
  Fan,
  Gauge,
  Home,
  Lightbulb,
  Lock,
  Power,
  Settings,
  Sun,
  Thermometer,
  ToggleLeft,
  Unlock,
  Warehouse,
  ShieldCheck,
  ShieldOff,
  CloudSun,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

type DeviceFormData = {
  name: string;
  description: string;
  entityId: string;
  statusEntity: string;
  button1Entity: string;
  button2Entity: string;
  humidityEntity: string;
  setpointEntity: string;
  cardType:
    | "device"
    | "binary"
    | "rollerShutter"
    | "sensor"
    | "onOff"
    | "lock"
    | "minilog"
    | "dimmer"
    | "runScript"
    | "thermostat"
    | "weather";

  statusTrue: string;
  statusFalse: string;
  zones: string[];
  icon: string;
  enabled: boolean;
  miniLogMode: "normal" | "pulse";
  miniLogPulseSeconds: number;
  weatherHumidityEntity: string;
  weatherPrecipitationEntity: string;
  weatherWindSpeedEntity: string;
  weatherWindGustEntity: string;
  weatherLightEntity: string;
};

type Props = {
  initialData?: Partial<DeviceFormData>;
  deviceId?: number;
  mode: "add" | "edit";
};

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
  {
    value: "gateslide",
    label: "Portail coulisse",
    icon: ArrowRightLeft,
  },
    {
    value: "shield-check",
    label: "Alarme armée",
    icon: ShieldCheck,
  },
  {
    value: "shield-off",
    label: "Alarme désarmée",
    icon: ShieldOff,
  },
  {
  value: "weather",
  label: "Station météo",
  icon: CloudSun,
},
];

const defaultForm: DeviceFormData = {
  name: "",
  description: "",
  entityId: "",
  statusEntity: "",
  humidityEntity: "",
  setpointEntity: "",
  button1Entity: "",
  button2Entity: "",
  cardType: "binary",
  statusTrue: "ON",
  statusFalse: "OFF",
  zones: ["tilt"],
  icon: "device",
  enabled: true,
  miniLogMode: "normal",
  miniLogPulseSeconds: 2,
  weatherHumidityEntity: "",
  weatherPrecipitationEntity: "",
  weatherWindSpeedEntity: "",
  weatherWindGustEntity: "",
  weatherLightEntity: "",
};

export default function DeviceForm({
  initialData,
  deviceId,
  mode,
}: Props) {
  const router = useRouter();

const [form, setForm] = useState<DeviceFormData>({
  ...defaultForm,
  ...initialData,
  humidityEntity: initialData?.humidityEntity ?? "",
  setpointEntity: initialData?.setpointEntity ?? "",
  weatherHumidityEntity: initialData?.weatherHumidityEntity ?? "",
  weatherPrecipitationEntity: initialData?.weatherPrecipitationEntity ?? "",
  weatherWindSpeedEntity: initialData?.weatherWindSpeedEntity ?? "",
  weatherWindGustEntity: initialData?.weatherWindGustEntity ?? "",
  weatherLightEntity: initialData?.weatherLightEntity ?? "",
});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof DeviceFormData>(
    field: K,
    value: DeviceFormData[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleZone(zoneId: string) {
    setForm((current) => {
      const exists = current.zones.includes(zoneId);

      return {
        ...current,
        zones: exists
          ? current.zones.filter((zone) => zone !== zoneId)
          : [...current.zones, zoneId],
      };
    });
  }

  async function handleSubmit() {
    setError("");

    if (!form.name.trim()) {
      setError("Le nom de l'appareil est obligatoire.");
      return;
    }

if (
  form.cardType !== "onOff" &&
  !form.entityId.trim()
) {
  setError(
    "L'entité Home Assistant est obligatoire."
  );
  return;
}

    if (
      form.cardType === "onOff" &&
      !form.button1Entity.trim()
    ) {
      setError(
        "L'entité du bouton ON est obligatoire pour une carte ON/OFF."
      );
      return;
    }

    if (
      form.cardType === "onOff" &&
      !form.button2Entity.trim()
    ) {
      setError(
        "L'entité du bouton OFF est obligatoire pour une carte ON/OFF."
      );
      return;
    }

    if (
  form.cardType === "thermostat" &&
  !form.setpointEntity.trim()
) {
  setError(
    "L'entité de consigne du thermostat est obligatoire."
  );
  return;
}

if (
  form.cardType === "thermostat" &&
  !form.setpointEntity.startsWith("input_number.")
) {
  setError(
    "L'entité de consigne doit être une entité input_number."
  );
  return;
}

if (form.cardType === "weather") {
  const weatherEntities = [
    form.entityId,
    form.weatherHumidityEntity,
    form.weatherPrecipitationEntity,
    form.weatherWindSpeedEntity,
    form.weatherWindGustEntity,
    form.weatherLightEntity,
  ];

  if (weatherEntities.some((entity) => !entity.trim())) {
    setError(
      "Les six entités Home Assistant sont obligatoires pour la station météo."
    );
    return;
  }
}

    setSaving(true);

    try {
      if (mode === "add") {
        await apiFetch("/admin/devices", {
          method: "POST",
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch(
          `/admin/devices/${deviceId}`,
          {
            method: "PUT",
            body: JSON.stringify(form),
          }
        );
      }

      router.push("/admin/devices");
      router.refresh();

    } catch (err: any) {
      console.error(
        "Failed to save device",
        err
      );

      setError(
        err?.message ||
          "Impossible d'enregistrer l'appareil."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedIcon = iconOptions.find(
    (option) => option.value === form.icon
  );

  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-6">

      <div className="grid gap-5">

        {/* CARD TYPE */}

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Type de carte
          </label>

          <select
            className="
              w-full
              bg-slate-800
              border border-slate-700
              rounded-lg
              p-3
              outline-none
              focus:border-blue-500
            "
            value={form.cardType}
           onChange={(e) => {
  const cardType =
    e.target.value as DeviceFormData["cardType"];

  setForm((current) => ({
    ...current,
    cardType,

    // ON/OFF cards don't use the main entity
    ...(cardType === "onOff"
      ? {
          entityId: "",
        }
      : {
          // Other card types don't use ON/OFF command entities
          button1Entity: "",
          button2Entity: "",
        }),
  }));
}}
          >
            <option value="device">
              Device
            </option>

            <option value="binary">
              Binary
            </option>

            <option value="onOff">
              ON / OFF
            </option>

            <option value="rollerShutter">
              Roller shutter
            </option>

            <option value="lock">
              Lock
            </option>

            <option value="minilog">
             Mini status
            </option>

            <option value="sensor">
              Sensor
            </option>

            <option value="thermostat">
              Thermostat
            </option>

            <option value="weather">
               Weather Station
            </option>

<option value="dimmer">
  Dimmer éclairage 0-10v
</option>

<option value="runScript">
  Run Script
</option>

                      </select>
        </div>

{form.cardType === "minilog" && (
  <div className="
    border
    border-slate-700
    rounded-xl
    p-4
    bg-slate-950/40
  ">
    <h3 className="font-semibold mb-4">
      Configuration Mini Status
    </h3>

    <label className="block mb-2 text-sm text-slate-300">
      Mode d'enregistrement
    </label>

    <select
      className="
        w-full
        bg-slate-800
        border border-slate-700
        rounded-lg
        p-3
        outline-none
        focus:border-blue-500
      "
      value={form.miniLogMode}
      onChange={(e) =>
        updateField(
          "miniLogMode",
          e.target.value as "normal" | "pulse"
        )
      }
    >
      <option value="normal">
        Normal — chaque changement d'état
      </option>

      <option value="pulse">
        Pulse — ON/OFF rapprochés = une seule entrée
      </option>
    </select>

    {form.miniLogMode === "pulse" && (
      <div className="mt-4">
        <label className="block mb-2 text-sm text-slate-300">
          Durée maximale de l'impulsion
        </label>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            className="
              w-full
              bg-slate-800
              border border-slate-700
              rounded-lg
              p-3
              outline-none
              focus:border-blue-500
            "
            value={form.miniLogPulseSeconds}
            onChange={(e) =>
              updateField(
                "miniLogPulseSeconds",
                Number(e.target.value)
              )
            }
          />

          <span className="text-sm text-slate-400">
            secondes
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Un changement ON suivi d'un changement OFF dans ce délai
          sera enregistré comme un seul événement.
        </p>
      </div>
    )}

    <p className="mt-3 text-xs text-slate-500">
      Le mode Pulse regroupe les changements ON/OFF très rapprochés
      en un seul événement pour les équipements à impulsion.
    </p>
  </div>
)}
        {/* ON / OFF ENTITIES */}

        {form.cardType === "onOff" && (
          <div className="
            border
            border-slate-700
            rounded-xl
            p-4
            bg-slate-950/40
          ">

            <h3 className="font-semibold mb-4">
              Configuration ON / OFF
            </h3>

            <div className="grid gap-4">

              <div>
                <label className="block mb-2 text-sm text-green-400">
                  Bouton ON
                </label>

                <input
                  className="
                    w-full
                    bg-slate-800
                    border border-slate-700
                    rounded-lg
                    p-3
                    font-mono
                    text-sm
                  "
                  placeholder="Ex : input_button.portail_on"
                  value={form.button1Entity}
                  onChange={(e) =>
                    updateField(
                      "button1Entity",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-red-400">
                  Bouton OFF
                </label>

                <input
                  className="
                    w-full
                    bg-slate-800
                    border border-slate-700
                    rounded-lg
                    p-3
                    font-mono
                    text-sm
                  "
                  placeholder="Ex : input_button.portail_off"
                  value={form.button2Entity}
                  onChange={(e) =>
                    updateField(
                      "button2Entity",
                      e.target.value
                    )
                  }
                />
              </div>

            </div>

          </div>
        )}



        {/* NAME */}

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Nom
          </label>

          <input
            className="
              w-full
              bg-slate-800
              border border-slate-700
              rounded-lg
              p-3
              outline-none
              focus:border-blue-500
            "
            placeholder="Nom de l'appareil"
            value={form.name}
            onChange={(e) =>
              updateField(
                "name",
                e.target.value
              )
            }
          />
        </div>

        {/* DESCRIPTION */}

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Description
          </label>

          <input
            className="
              w-full
              bg-slate-800
              border border-slate-700
              rounded-lg
              p-3
              outline-none
              focus:border-blue-500
            "
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              updateField(
                "description",
                e.target.value
              )
            }
          />
        </div>

{/* ENTITY */}

{form.cardType !== "onOff" && form.cardType !== "thermostat" && (
  <div>
    <label className="block mb-2 text-sm text-slate-300">
      Entité Home Assistant
    </label>

    <input
      className="
        w-full
        bg-slate-800
        border border-slate-700
        rounded-lg
        p-3
        font-mono
        text-sm
        outline-none
        focus:border-blue-500
      "
      placeholder="Ex : switch.portail"
      value={form.entityId}
      onChange={(e) =>
        updateField(
          "entityId",
          e.target.value
        )
      }
    />
  </div>
)}

{/* THERMOSTAT ENTITIES */}

{form.cardType === "thermostat" && (
  <div className="
    border
    border-slate-700
    rounded-xl
    p-4
    bg-slate-950/40
  ">
    <h3 className="font-semibold mb-4">
      Configuration Thermostat
    </h3>

    <div className="grid gap-4">

      <div>
        <label className="block mb-2 text-sm text-slate-300">
          Capteur de température actuelle
        </label>

        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 font-mono text-sm"
          placeholder="sensor.pecherie_temperature"
          value={form.entityId}
          onChange={(e) =>
            updateField("entityId", e.target.value)
          }
        />
      </div>

      <div>
        <label className="block mb-2 text-sm text-slate-300">
          Capteur d'humidité
        </label>

        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 font-mono text-sm"
          placeholder="sensor.pecherie_humidity"
          value={form.humidityEntity}
          onChange={(e) =>
            updateField("humidityEntity", e.target.value)
          }
        />
      </div>

      <div>
        <label className="block mb-2 text-sm text-slate-300">
          Entité de consigne (input_number)
        </label>

        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 font-mono text-sm"
          placeholder="input_number.pecherie_temperature_target"
          value={form.setpointEntity}
          onChange={(e) =>
            updateField("setpointEntity", e.target.value)
          }
        />
      </div>

      <p className="text-xs text-slate-500">
        La valeur 0 désactive le chauffage. Une valeur
        comprise entre 5 et 30 °C active la régulation
        dans Home Assistant.
      </p>

    </div>
  </div>
)}

{/* WEATHER STATION ENTITIES */}

{form.cardType === "weather" && (
  <div className="border border-slate-700 rounded-xl p-4 bg-slate-950/40">
    <h3 className="font-semibold mb-4">
      Configuration Station Météo
    </h3>

    <div className="grid gap-4">
      {[
        {
          field: "entityId",
          label: "Température",
          placeholder: "sensor.tilt_meteo_tilt_temperature",
        },
        {
          field: "weatherHumidityEntity",
          label: "Humidité",
          placeholder: "sensor.tilt_meteo_tilt_humidite",
        },
        {
          field: "weatherPrecipitationEntity",
          label: "Précipitations",
          placeholder: "sensor.tilt_meteo_tilt_precipitation",
        },
        {
          field: "weatherWindSpeedEntity",
          label: "Vitesse du vent",
          placeholder: "sensor.tilt_meteo_tilt_vitesse",
        },
        {
          field: "weatherWindGustEntity",
          label: "Rafales",
          placeholder: "sensor.tilt_meteo_tilt_vitesse_2",
        },
        {
          field: "weatherLightEntity",
          label: "Luminosité",
          placeholder: "sensor.tilt_meteo_tilt_eclairement",
        },
      ].map((item) => (
        <div key={item.field}>
          <label className="block mb-2 text-sm text-slate-300">
            {item.label}
          </label>

          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 font-mono text-sm"
            placeholder={item.placeholder}
            value={form[item.field as keyof DeviceFormData] as string}
            onChange={(e) =>
              updateField(
                item.field as keyof DeviceFormData,
                e.target.value as never
              )
            }
          />
        </div>
      ))}
    </div>
  </div>
)}

        {/* STATUS ENTITY */}
{(
  form.cardType === "device" ||
  form.cardType === "binary" ||
  form.cardType === "sensor" ||
  form.cardType === "onOff"
) && (
        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Entité d'état
          </label>

          <input
            className="
              w-full
              bg-slate-800
              border border-slate-700
              rounded-lg
              p-3
              font-mono
              text-sm
              outline-none
              focus:border-blue-500
            "
            placeholder="Optionnel — utilise l'entité principale si vide"
            value={form.statusEntity}
            onChange={(e) =>
              updateField(
                "statusEntity",
                e.target.value
              )
            }
          />

          <p className="mt-2 text-xs text-slate-500">
            Utilisé pour déterminer l'état affiché sur la carte.
          </p>
        </div>
)}


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
              updateField(
                "icon",
                e.target.value
              )
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

          {selectedIcon && (
            <div className="
              mt-3
              flex
              items-center
              gap-3
              text-slate-300
            ">
              <div className="
                p-2
                rounded-lg
                bg-slate-800
                border
                border-slate-700
              ">
                <selectedIcon.icon size={22} />
              </div>

              <span className="text-sm">
                Aperçu : {selectedIcon.label}
              </span>
            </div>
          )}
        </div>

        {/* STATUS TEXT */}

        {form.cardType !== "sensor" &&
        form.cardType !== "thermostat" &&
        form.cardType !== "weather" && (
          <div className="
            border
            border-slate-700
            rounded-xl
            p-4
            bg-slate-950/40
          ">

            <p className="mb-4 font-semibold">
              Valeurs d'état
            </p>

            <div className="grid gap-4">

              <div>
                <label className="block mb-2 text-sm text-green-400">
                  Valeur verte — état actif
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
                    updateField(
                      "statusTrue",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-red-400">
                  Valeur rouge — état inactif
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
                    updateField(
                      "statusFalse",
                      e.target.value
                    )
                  }
                />
              </div>

            </div>

          </div>
        )}

        {/* ZONES */}

        <div>
          <p className="mb-3 text-sm font-medium text-slate-300">
            Zones
          </p>

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            gap-2
          ">

            {zones.map((zone) => (
              <label
                key={zone.id}
                className="
                  flex
                  items-center
                  gap-3
                  bg-slate-800
                  border border-slate-700
                  p-3
                  rounded-lg
                  cursor-pointer
                  hover:bg-slate-750
                "
              >
                <input
                  type="checkbox"
                  checked={form.zones.includes(
                    zone.id
                  )}
                  onChange={() =>
                    toggleZone(zone.id)
                  }
                  className="w-4 h-4"
                />

                <span>
                  {zone.label}
                </span>
              </label>
            ))}

          </div>
        </div>

        {/* ENABLED */}

        <div className="
          flex
          items-center
          justify-between
          bg-slate-800
          border border-slate-700
          rounded-lg
          p-4
        ">

          <div>
            <p className="font-medium">
              Appareil activé
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Un appareil désactivé ne peut pas être commandé.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              updateField(
                "enabled",
                !form.enabled
              )
            }
            className={`
              px-4
              py-2
              rounded-lg
              text-sm
              font-medium
              ${
                form.enabled
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-orange-600 hover:bg-orange-500"
              }
            `}
          >
            {form.enabled
              ? "Activé"
              : "Désactivé"}
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="
            bg-red-950/50
            border border-red-700/60
            text-red-300
            rounded-lg
            p-4
            text-sm
          ">
            {error}
          </div>
        )}

        {/* ACTIONS */}

        <div className="
          flex
          flex-col
          sm:flex-row
          gap-3
          mt-2
        ">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/devices"
              )
            }
            disabled={saving}
            className="
              px-5
              py-3
              bg-slate-700
              hover:bg-slate-600
              rounded-lg
              font-medium
              transition
            "
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="
              px-5
              py-3
              bg-green-600
              hover:bg-green-500
              disabled:bg-slate-700
              disabled:text-slate-500
              rounded-lg
              font-semibold
              transition
            "
          >
            {saving
              ? "Enregistrement..."
              : mode === "add"
                ? "Ajouter l'appareil"
                : "Enregistrer les modifications"}
          </button>

        </div>

      </div>
    </div>
  );
}