
"use client";

import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types/user";
import { createUser } from "@/lib/userService";
import { safeUUID } from "@/lib/id";

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: (users: User[]) => void;
}

const availableZones = [
  { id: "epr2", name: "EPR2" },
  { id: "exterior", name: "Extérieur" },
  { id: "logement-du-lac", name: "Logement du Lac" },
  { id: "logement-du-tilt", name: "Logement du Tilt" },
  { id: "pecherie", name: "Pêcherie" },
  { id: "restaurant", name: "Restaurant" },
  { id: "salle-des-fetes", name: "Salle des Fêtes" },
  { id: "tilt", name: "Tilt" },
];

export default function CreateUserModal({
  onClose,
  onCreated,
}: CreateUserModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const isGhostAdmin =
    user?.id === "0" && user?.username === "GhostAdmin";

  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [manageUsers, setManageUsers] = useState(false);
  const [accessStart, setAccessStart] = useState("08:00");
  const [accessEnd, setAccessEnd] = useState("18:00");

  function toggleZone(zoneId: string) {
    setZones((current) =>
      current.includes(zoneId)
        ? current.filter((zone) => zone !== zoneId)
        : [...current, zoneId]
    );
  }

  async function handleCreate() {
    if (!username.trim() || !password.trim()) {
      showToast("Username and password required", "error");
      return;
    }

    setSaving(true);

    try {
      const newUser: User = {
        id: safeUUID(),
        username: username.trim(),
        password: password.trim(),
        zones,
        capabilities: {
          manageUsers: isGhostAdmin && manageUsers,
        },
        disabled: false,
        accessStart,
        accessEnd,
      };

      const updated = await createUser(newUser);

      onCreated(updated);
      showToast("Utilisateur créé avec succès", "success");
      onClose();
    } catch {
      showToast("Échec de la création de l'utilisateur", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="text-blue-400" size={24} />
            <h2 id="create-user-title" className="text-xl font-bold">
              Créer un utilisateur
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fermer"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4">
          <input
            autoFocus
            placeholder="Nom d'utilisateur"
            autoComplete="off"
            className="w-full rounded-lg bg-slate-800 p-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mot de passe"
            autoComplete="new-password"
            className="w-full rounded-lg bg-slate-800 p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-300">
              Zones accessibles
            </legend>

            <p className="mb-3 text-xs text-slate-500">
              Sélectionnez les zones que cet utilisateur pourra accéder.
              L'accès à Accueil est partagé entre les utilisateurs autorisés.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {availableZones.map((zone) => (
                <label
                  key={zone.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800 p-3 text-sm hover:bg-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={zones.includes(zone.id)}
                    onChange={() => toggleZone(zone.id)}
                    className="accent-blue-500"
                  />
                  {zone.name}
                </label>
              ))}
            </div>
          </fieldset>

          {isGhostAdmin && (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-500/40 bg-orange-500/10 p-3">
              <input
                type="checkbox"
                checked={manageUsers}
                onChange={(e) => setManageUsers(e.target.checked)}
                className="mt-1 accent-orange-500"
              />
              <span>
                <span className="block text-sm font-medium text-orange-300">
                  Administrateur
                </span>
                <span className="block text-xs text-slate-400">
                  Autoriser la gestion des utilisateurs et les fonctions
                  réservées aux administrateurs.
                </span>
              </span>
            </label>
          )}

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Horaires d'accès
            </label>

            <div className="flex gap-3">
              <input
                type="time"
                aria-label="Début de l'accès"
                className="w-full min-w-0 rounded-lg bg-slate-800 p-3"
                value={accessStart}
                onChange={(e) => setAccessStart(e.target.value)}
              />

              <input
                type="time"
                aria-label="Fin de l'accès"
                className="w-full min-w-0 rounded-lg bg-slate-800 p-3"
                value={accessEnd}
                onChange={(e) => setAccessEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg bg-slate-700 px-4 py-2 hover:bg-slate-600 disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="rounded-lg bg-green-600 px-5 py-2 font-medium hover:bg-green-500 disabled:opacity-50"
            >
              {saving ? "Création..." : "Créer l'utilisateur"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}