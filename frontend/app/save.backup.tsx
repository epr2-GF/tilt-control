"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

const ZONES = [
  { id: "tilt", label: "Tilt" },
  { id: "salle_des_fetes", label: "Salle des Fêtes" },
  { id: "logement_de_lac", label: "Logement de Lac" },
  { id: "restaurant", label: "Restaurant" },
  { id: "epr2", label: "EPR2" },
  { id: "logement_du_tilt", label: "Logement du Tilt" },
  { id: "pecherie", label: "Pêcherie" },
]

export default function SmartSiteControlMockup() {
  const router = useRouter()
  
  // 🧼 Removed the 'loading' property since your AuthContext tracks loading via an undefined user
  const { user, logout } = useAuth()

  useEffect(() => {
    // If the auth check is finished and no user exists, bounce to login
    if (user === null) {
      router.push("/login")
    }
  }, [user, router])

  // ⏳ Handle the loading state cleanly using the undefined check signature
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
        <span className="text-sm text-slate-400">Loading Session...</span>
      </div>
    )
  }

  if (user === null) return null

  const isAdmin = user.role === "admin"

  function confirmAction(message: string) {
    return window.confirm(message)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-md space-y-4">

        {/* HEADER */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Contrôle du Tilt</h1>
              <p className="text-slate-300 text-sm mt-1">
                Accès Sécurisé au Site
              </p>
            </div>
            <div className="bg-green-500 rounded-full h-3 w-3 animate-pulse" />
          </div>
        </div>

        {/* USER */}
        <div className="bg-white rounded-3xl p-4 shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">{user.username}</h2>
              <p className="text-gray-500 text-sm capitalize">
                {user.role}
              </p>
            </div>

            <button
              onClick={() => {
                // ✨ FIX: Invoke the correct function signature here
                logout() 
                router.push("/login")
              }}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* CONTROL SECTION */}
        <section className="space-y-4">
          <h3 className="font-bold text-gray-700">
            Contrôle du Site
          </h3>

          {/* PORTAIL */}
          <button
            onClick={() => {
              if (!confirmAction("Confirmer action Portail Principal ?")) return
              console.log("Portail Principal toggle")
            }}
            className="w-full rounded-2xl p-4 bg-white shadow-md border"
          >
            <div className="flex justify-between items-center">
              <div className="text-left">
                <div className="font-semibold text-lg">Portail Principal</div>
                <div className="text-sm text-gray-500">Entrée Véhicules</div>
              </div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                OUVERT
              </div>
            </div>
          </button>

          {/* ENTREPOT */}
          <button
            onClick={() => {
              if (!confirmAction("Confirmer action Porte Entrepôt ?")) return
              console.log("Porte Entrepôt toggle")
            }}
            className="w-full rounded-2xl p-4 bg-white shadow-md border"
          >
            <div className="flex justify-between items-center">
              <div className="text-left">
                <div className="font-semibold text-lg">Porte Entrepôt</div>
                <div className="text-sm text-gray-500">Zone Commerciale</div>
              </div>
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                FERMÉ
              </div>
            </div>
          </button>

          {/* LIGHTS EXTERIOR */}
          <button
            onClick={() => console.log("Lights exterior")}
            className="w-full rounded-2xl p-4 bg-white shadow-md border"
          >
            <div className="flex justify-between items-center">
              <div className="text-left">
                <div className="font-semibold text-lg">Éclairage Extérieur</div>
                <div className="text-sm text-gray-500">Allume Tout</div>
              </div>
              <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                OFF
              </div>
            </div>
          </button>

          {/* LIGHTS SALLE DES FETES */}
          <button
            onClick={() => console.log("Lights hall")}
            className="w-full rounded-2xl p-4 bg-white shadow-md border"
          >
            <div className="flex justify-between items-center">
              <div className="text-left">
                <div className="font-semibold text-lg">Salle des Fêtes</div>
                <div className="text-sm text-gray-500">Éclairage</div>
              </div>
              <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                OFF
              </div>
            </div>
          </button>
        </section>
        
        {/* ZONE SECTION */}
        <section className="space-y-3">
          <h3 className="font-bold text-gray-700">Zones</h3>

          <div className="grid grid-cols-2 gap-3">
            {ZONES.map((zone) => (
              <Link
                key={zone.id}
                href={`/zone/${zone.id}`}
                className="rounded-2xl bg-white border border-gray-200 p-4 shadow-md active:scale-[0.98] transition block"
              >
                <div className="text-lg font-semibold">{zone.label}</div>
                <div className="text-sm text-gray-500">Ouvrir zone</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ADMIN */}
        {isAdmin && (
          <section className="space-y-3 pb-8">
            <h3 className="font-bold text-gray-700">
              Administration Générale
            </h3>

            <Link
              href="/admin"
              className="block w-full bg-slate-900 text-white rounded-2xl p-4 shadow-xl text-center font-medium"
            >
              Gestion des Utilisateurs
            </Link>
          </section>
        )}

      </div>
    </div>
  )
}