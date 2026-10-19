
"use client";

import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import type { User, Role } from "@/types/user";
import { createUser } from "@/lib/userService";
import { safeUUID } from "@/lib/id";

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: (users: User[]) => void;
}

export default function CreateUserModal({
  onClose,
  onCreated,
}: CreateUserModalProps) {
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "visiteur" as Role,
    accessStart: "08:00",
    accessEnd: "18:00",
  });

  async function handleCreate() {
    if (!form.username.trim() || !form.password.trim()) {
      showToast("Username and password required", "error");
      return;
    }

    setSaving(true);

    try {
      const newUser: User = {
        id: safeUUID(),
        username: form.username.trim(),
        password: form.password.trim(),
        role: form.role,
        disabled: false,
        accessStart: form.accessStart,
        accessEnd: form.accessEnd,
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
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
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

        <div className="grid gap-3">
          <input
            autoFocus
            placeholder="Nom d'utilisateur"
            autoComplete="off"
            className="w-full rounded-lg bg-slate-800 p-3"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Mot de passe"
            autoComplete="new-password"
            className="w-full rounded-lg bg-slate-800 p-3"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <select
            className="w-full rounded-lg bg-slate-800 p-3"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as Role })
            }
          >
            <option value="admin">admin</option>
            <option value="visiteur">visiteur</option>
            <option value="epr2">epr2</option>
            <option value="restaurant">restaurant</option>
            <option value="pecheur">pecheur</option>
          </select>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Horaires d'accès
            </label>
            <div className="flex gap-3">
              <input
                type="time"
                aria-label="Début de l'accès"
                className="w-full min-w-0 rounded-lg bg-slate-800 p-3"
                value={form.accessStart}
                onChange={(e) =>
                  setForm({ ...form, accessStart: e.target.value })
                }
              />

              <input
                type="time"
                aria-label="Fin de l'accès"
                className="w-full min-w-0 rounded-lg bg-slate-800 p-3"
                value={form.accessEnd}
                onChange={(e) =>
                  setForm({ ...form, accessEnd: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-3">
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
