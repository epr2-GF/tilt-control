"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccessZone, canUseControl } from "@/lib/permissions";
import { ArrowRightLeft,Warehouse, Lightbulb, LogOut, Users, Map } from "lucide-react";
import ControlCard from "@/components/ControlCard";
import BinaryControl from "@/components/BinaryControl";

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  /* -------------------------------------------------------------
      🛡️ STRICT AUTH GUARD SYSTEM
  ------------------------------------------------------------- */
  useEffect(() => {
    if (user === null) {
      window.location.href = "/login";
    }
  }, [user]);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
        <span className="text-sm text-slate-400">Vérification de la session...</span>
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
  const isAdmin = role === "admin";

  const allZones = [
    { id: "tilt", name: "Tilt", path: "/zone/tilt" },
    { id: "epr2", name: "EPR2", path: "/zone/epr2" },
    { id: "restaurant", name: "Restaurant", path: "/zone/restaurant" },
    { id: "salle-des-fetes", name: "Salle des Fêtes", path: "/zone/salle-des-fetes" },
    { id: "pecherie", name: "Pêcherie", path: "/zone/pecherie" },
    { id: "exterior", name: "Exterior", path: "/zone/exterior" },
    { id: "logement-du-lac", name: "Logement du Lac", path: "/zone/logement-du-lac" },
    { id: "logement-du-tilt", name: "Logement du Tilt", path: "/zone/logement-du-tilt" },
  ];

  const zones = allZones.filter((zone) => canAccessZone(role, zone.id));

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contrôle du Tilt</h1>
          <p className="text-slate-400 text-sm">
            Système de gestion des accès et équipements
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="text-sm text-slate-300">
            Connecté :{" "}
            <span className="text-white font-semibold">
              {user.username}
            </span>
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

      {/* ADMIN */}
      {isAdmin && (
        <div className="mb-6">
          <ControlCard
            title="Administration"
            description="Gestion des utilisateurs et permissions"
            icon={<Users size={20} />}
          >
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/admin")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
              >
                Utilisateurs
              </button>

              <button
                onClick={() => window.location.href = "reolink://"}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition"
              >
                Cameras
              </button>
            </div>
          </ControlCard>
        </div>
      )}

     {/* CONTROLS SECTION */}
<section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
  {canUseControl(role, "portail-principal") && (

<BinaryControl
  controlId="portail-principal"
  commandEntity="input_boolean.fakegate"
  statusEntity="input_boolean.fakegate"

  title="Portail Principal"
  description="Entrée principale"

  icon={<ArrowRightLeft size={20} />}

  onText="Ouvert"
  offText="Fermé"

  buttonText="Commander"
/>
  )}

{canUseControl(role, "porte-entrepot") && (
  <BinaryControl
  controlId="porte-entrepot"
  commandEntity="input_boolean.fakedoor"
  statusEntity="input_boolean.fakedoor"

  title="Porte Entrepôt"
  description="Accès principal"

  icon={<Warehouse size={20} />}

  onText="Ouverte"
  offText="Fermé"

  buttonText="Commander"
/>
)}

<BinaryControl
    controlId="eclairage-site"
    commandEntity="input_boolean.fakesitelights"
    statusEntity="input_boolean.fakesitelights"

    title="Éclairage Site"
    description="Éclairage extérieur"

    icon={<Lightbulb size={20} />}

    onText="Allumé"
    offText="Éteint"

    buttonText="Basculer"
/>

<BinaryControl
  controlId="eclairage-salle"
  commandEntity="input_boolean.fakesallelights"
  statusEntity="input_boolean.fakesallelights"

  title="Éclairage Salle"
  description="Salle principale"

  icon={<Lightbulb size={20} />}

  onText="Allumé"
  offText="Éteint"

  buttonText="Basculer"
/>
      </section>

      {/* ZONES */}
      {zones.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Map size={18} className="text-slate-400" />
            <h2 className="text-xl font-semibold">Zones</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => router.push(zone.path)}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 hover:bg-slate-800 transition text-left"
              >
                <div className="font-medium">{zone.name}</div>
                <div className="text-xs text-slate-400">
                  Accéder à la zone
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}