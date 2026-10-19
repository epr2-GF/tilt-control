"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  Users,
  Map,
  Camera,
  Eye,
  ClipboardList,
  Settings,
  ListChecks,
  Activity,
  DatabaseBackup,
  MessageSquare,
} from "lucide-react";
import ControlCard from "@/components/ControlCard";
import {
  apiFetch,
  apiFetchRaw,
} from "@/lib/api";
import DeviceRenderer from "@/components/DeviceRenderer";


export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
const [siteMessage, setSiteMessage] = useState("");

const [gateImage, setGateImage] =
  useState<string | null>(null);

const [gateImageTime, setGateImageTime] =
  useState<string | null>(null);

const [gateImageLoading, setGateImageLoading] =
  useState(false);

const [gateImageError, setGateImageError] =
  useState<string | null>(null);


async function captureGateCamera() {

  try {

    setGateImageLoading(true);
    setGateImageError(null);

    const response =
      await apiFetchRaw(
        "/camera/gate"
      );

    const blob =
      await response.blob();

    const imageUrl =
      URL.createObjectURL(blob);

    setGateImage(imageUrl);

    setGateImageTime(
      new Date().toLocaleTimeString("fr-FR")
    );

  } catch (error) {

    console.error(
      "Failed capturing gate camera",
      error
    );

    setGateImageError(
      "Impossible de récupérer l'image du portail."
    );

  } finally {

    setGateImageLoading(false);

  }

}

  /* -------------------------------------------------------------
      🛡️ STRICT AUTH GUARD SYSTEM
  ------------------------------------------------------------- */

  useEffect(() => {
    if (user === null) {
      window.location.href = "/login";
    }
  }, [user]);


/* -------------------------------------------------------------
    LOAD HOME DEVICES
------------------------------------------------------------- */

useEffect(() => {

  async function loadDevices() {

    try {

      const data = await apiFetch("/devices");

      if (!Array.isArray(data)) {

        console.error(
          "Device API did not return an array:",
          data
        );

        return;
      }

      const homeDevices = data.filter(
        (device: any) =>
          device.zones?.includes("accueil")
      );

      setDevices(homeDevices);

    } catch (error) {

      console.error(
        "Failed loading home devices",
        error
      );

    }

  }

  if (user) {
    loadDevices();
  }

  const handleVisibilityChange = () => {

    if (
      document.visibilityState === "visible" &&
      user
    ) {
      loadDevices();
    }

  };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  return () => {

    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

  };

}, [user]);

  /* -------------------------------------------------------------
      LOAD IMPORTANT SITE MESSAGE
  ------------------------------------------------------------- */

  useEffect(() => {

    async function loadSiteMessage() {

      try {

        const data = await apiFetch(
          "/admin/site-message"
        );

        if (
          data?.message &&
          data.message.trim()
        ) {

          setSiteMessage(
            data.message
          );

        } else {

          setSiteMessage("");

        }

      } catch (error) {

        console.error(
          "Failed loading site message",
          error
        );

        setSiteMessage("");

      }

    }

    if (user) {
      loadSiteMessage();
    }

  }, [user]);


  /* -------------------------------------------------------------
      LOADING / AUTH INITIALIZATION
  ------------------------------------------------------------- */

  if (user === undefined) {

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-2">

        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>

        <span className="text-sm text-slate-400">
          Vérification de la session...
        </span>

      </div>
    );

  }


  if (user === null) {
    return null;
  }


  /* -------------------------------------------------------------
      APPLICATION DATA & PERMISSIONS
  ------------------------------------------------------------- */

  const role = user.role;

  const isAdmin =
    role === "admin" ||
    role === "superadmin";

  const isSuperAdmin =
    role === "superadmin";


  const allZones = [

    {
      id: "tilt",
      name: "Tilt",
      path: "/zone/tilt"
    },

    {
      id: "epr2",
      name: "EPR2",
      path: "/zone/epr2"
    },

    {
      id: "restaurant",
      name: "Restaurant",
      path: "/zone/restaurant"
    },

    {
      id: "salle-des-fetes",
      name: "Salle des Fêtes",
      path: "/zone/salle-des-fetes"
    },

    {
      id: "pecherie",
      name: "Pêcherie",
      path: "/zone/pecherie"
    },

    {
      id: "exterior",
      name: "Extérieur",
      path: "/zone/exterior"
    },

    {
      id: "logement-du-lac",
      name: "Logement du Lac",
      path: "/zone/logement-du-lac"
    },

    {
      id: "logement-du-tilt",
      name: "Logement du Tilt",
      path: "/zone/logement-du-tilt"
    },

  ];


  const zones = allZones.filter(
    (zone) =>
      user.permissions?.zones.includes(
        zone.id
      )
  );


  /* -------------------------------------------------------------
      PAGE
  ------------------------------------------------------------- */

  return (

    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">


      {/* ---------------------------------------------------------
          HEADER
      --------------------------------------------------------- */}

      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">

        <div>

          <h1 className="text-3xl font-bold">
            Contrôle du Tilt
          </h1>

          <p className="text-slate-400 text-sm">
            Système de gestion des accès et équipements
          </p>

        </div>


        <div className="flex items-center gap-4 mt-4 md:mt-0">


          <div className="flex flex-col text-sm text-slate-300">

            <div>

              Connecté :{" "}

              <span className="text-white font-semibold">
                {user.username === "GhostAdmin"
  ? "Superadmin"
  : user.username}
              </span>

            </div>


            {user.accessStart &&
              user.accessEnd && (

                <div className="text-xs text-slate-400 mt-1">

                  Accès autorisé :

                  <span className="text-emerald-400 font-semibold ml-1">

                    {user.accessStart}
                    {" - "}
                    {user.accessEnd}

                  </span>

                </div>

              )}


            {user.remoteAccess && (

              <div className="text-xs text-blue-400 mt-1">

                🌍 Accès distant activé

              </div>

            )}

          </div>


          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >

            <LogOut size={16} />

            Déconnexion

          </button>


        </div>

      </header>


      {/* ---------------------------------------------------------
          IMPORTANT SITE MESSAGE
      --------------------------------------------------------- */}

      {siteMessage && (

        <div className="mb-6">

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 shadow-lg">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 text-amber-400 text-xl">

                ⚠️

              </div>


              <div className="flex-1">

                <h2 className="font-semibold text-amber-300 mb-2">

                  Message Important

                </h2>


                <p className="text-slate-200 whitespace-pre-wrap">

                  {siteMessage}

                </p>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* ---------------------------------------------------------
          ADMINISTRATION
      --------------------------------------------------------- */}

      {isAdmin && (

        <div className="mb-6">

          <ControlCard
            title="Administration"
            description="Gestion des utilisateurs et permissions"
            icon={<Users size={20} />}
          >






<div className="grid grid-cols-6 sm:grid-cols-7 lg:grid-cols-8 gap-2">

  {/* USERS */}
  <button
    type="button"
    title="Utilisateurs"
    aria-label="Utilisateurs"
    onClick={() => router.push("/admin")}
    className="aspect-square w-full flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 transition"
  >
    <Users size={39} />
  </button>

  {/* CAMERAS */}
  <button
    type="button"
    title="Caméras"
    aria-label="Caméras"
    onClick={() => {
      window.location.href = "reolink://";
    }}
    className="aspect-square w-full flex items-center justify-center rounded-xl bg-green-600 hover:bg-green-500 transition"
  >
    <Camera size={39} />
  </button>

  {/* GATE CAMERA */}
  <button
    type="button"
    title="Vérifier le portail"
    aria-label="Vérifier le portail"
    onClick={captureGateCamera}
    disabled={gateImageLoading}
    className="aspect-square w-full flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 transition"
  >
    <Eye size={39} />
  </button>

  {/* AUDIT */}
  {isSuperAdmin && (
    <button
      type="button"
      title="Journal"
      aria-label="Journal"
      onClick={() => router.push("/admin/audit")}
      className="aspect-square w-full flex items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 transition"
    >
      <ClipboardList size={39} />
    </button>
  )}

  {/* DEVICES */}
  {isSuperAdmin && (
    <button
      type="button"
      title="Appareils"
      aria-label="Appareils"
      onClick={() => router.push("/admin/devices")}
      className="aspect-square w-full flex items-center justify-center rounded-xl bg-yellow-600 hover:bg-yellow-500 transition"
    >
      <Settings size={39} />
    </button>
  )}

  {/* DEVICE LOG */}
  {isSuperAdmin && (
    <button
      type="button"
      title="Journal appareils"
      aria-label="Journal appareils"
      onClick={() => router.push("/admin/device-log")}
      className="aspect-square w-full flex items-center justify-center rounded-xl bg-cyan-600 hover:bg-cyan-500 transition"
    >
      <ListChecks size={39} />
    </button>
  )}

  {/* STATUS */}
  <button
    type="button"
    title="Statut"
    aria-label="Statut"
    onClick={() => router.push("/admin/status")}
    className="aspect-square w-full flex items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-500 transition"
  >
    <Activity size={39} />
  </button>

  {/* BACKUP & RESTORE */}
  {isSuperAdmin && (
    <button
      type="button"
      title="Sauvegarde"
      aria-label="Sauvegarde"
      onClick={() => router.push("/admin/backup")}
      className="aspect-square w-full flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 transition"
    >
      <DatabaseBackup size={39} />
    </button>
  )}

  {/* IMPORTANT MESSAGE */}
  <button
    type="button"
    title="Message important"
    aria-label="Message important"
    onClick={() => router.push("/admin/site-message")}
    className="aspect-square w-full flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-500 transition"
  >
    <MessageSquare size={39} />
  </button>

</div>


          </ControlCard>

        </div>

      )}




      {/* ---------------------------------------------------------
          HOME DEVICES
      --------------------------------------------------------- */}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">

        {devices.map((device) => (

          <DeviceRenderer
            key={device.id}
            device={device}
          />

        ))}

      </section>

      {/* ---------------------------------------------------------
          ZONES
      --------------------------------------------------------- */}

      {zones.length > 0 && (

        <section>

          <div className="flex items-center gap-2 mb-4">

            <Map
              size={18}
              className="text-slate-400"
            />

            <h2 className="text-xl font-semibold">
              Zones
            </h2>

          </div>


          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

            {zones.map((zone) => (

              <button
                key={zone.id}
                onClick={() =>
                  router.push(zone.path)
                }
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 hover:bg-slate-800 transition text-left"
              >

                <div className="font-medium">
                  {zone.name}
                </div>

                <div className="text-xs text-slate-400">
                  Accéder à la zone
                </div>

              </button>

            ))}

          </div>

        </section>

      )}


{/* ---------------------------------------------------------
    FOOTER
--------------------------------------------------------- */}

<footer className="mt-12 text-center text-xs text-slate-500">

  <div>
    Created by Andy Hill 2026
  </div>

  <div className="mt-1">
    Version 1.6

    {gateImage && (

  <div
    className="
      fixed
      inset-0
      z-50
      bg-black/80
      flex
      items-center
      justify-center
      p-4
    "
    onClick={() => {
      URL.revokeObjectURL(gateImage);
      setGateImage(null);
    }}
  >

    <div
      className="
        relative
        max-w-6xl
        max-h-[90vh]
        w-full
        flex
        flex-col
        items-center
        gap-3
      "
      onClick={(event) =>
        event.stopPropagation()
      }
    >

      <img
        src={gateImage}
        alt="Vue du portail"
        className="
          max-w-full
          max-h-[80vh]
          object-contain
          rounded-lg
          shadow-2xl
        "
      />

      <div
        className="
          flex
          items-center
          gap-4
          text-white
          text-sm
        "
      >

        <span>
          Portail — {gateImageTime}
        </span>

        <button
          onClick={() => {
            URL.revokeObjectURL(gateImage);
            setGateImage(null);
          }}
          className="
            px-4
            py-2
            bg-red-600
            hover:bg-red-500
            rounded-lg
            transition
          "
        >
          Quitter
        </button>

      </div>

    </div>

  </div>

)}
{gateImageError && (

  <div
    className="
      fixed
      bottom-6
      left-1/2
      -translate-x-1/2
      z-[60]
      bg-red-700
      text-white
      px-5
      py-3
      rounded-lg
      shadow-xl
    "
  >
    {gateImageError}
  </div>

)}
  </div>

</footer>


    </main>

  );

}