"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import type { User, Role } from "@/types/user";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserDisabled,
} from "@/lib/userService";
import DeployButton from "@/components/DeployButton";
import { useAuth } from "@/context/AuthContext";
import { safeUUID } from "@/lib/id";

import {
  Shield,
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth(); 
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "visiteur" as Role,
    accessStart: "08:00",
    accessEnd: "18:00",
  });

// -----------------------------
  // AUTH GUARD
  // -----------------------------
  useEffect(() => {
    // 1. If state machine finishes and user is definitely not logged in
    if (user === null) {
      router.push("/login");
      return;
    }

    // 2. If user is logged in, but lacks the admin role
    if (user && user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);
  // -----------------------------
  // LOAD USERS
  // -----------------------------
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }

  // -----------------------------
  // CREATE USER
  // -----------------------------
async function handleCreate() {
  if (!form.username.trim() || !form.password.trim()) {
    showToast("Username and password required", "error");
    return;
  }

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
    setUsers(updated);

    setForm({
      username: "",
      password: "",
      role: "visiteur",
      accessStart: "08:00",
      accessEnd: "18:00",
    });

    showToast("Utilisateur créé avec succès", "success");
  } catch (err) {
    showToast("Échec de la création de l'utilisateur", "error");
  }
}

  // -----------------------------
  // DELETE USER
  // -----------------------------
async function handleDelete(id: string) {
  try {
    const updated = await deleteUser(id);
    setUsers(updated);

    showToast("User deleted", "success");
  } catch (err) {
    if (err instanceof Error) {
      showToast(err.message, "error");
    } else {
      showToast("Échec de la suppression de l'utilisateur", "error");
    }
  }
}

  // -----------------------------
  // TOGGLE ENABLE/DISABLE
  // -----------------------------
async function  handleToggleDisabled(id: string) {
  try {
    const updated = await toggleUserDisabled(id);
    setUsers(updated);

    showToast("Statut de l'utilisateur mis à jour", "success");
  } catch (err) {
    showToast("Échec de la mise à jour de l'utilisateur", "error");
  }
}

  // -----------------------------
  // SAVE EDIT USER
  // -----------------------------
async function handleSave() {
  if (!editingUser) return;

  try {
    const updated = await updateUser(editingUser.id, editingUser);

    setUsers(updated);
    setEditingUser(null);
    setShowPassword(false);

    showToast("Statut de l'utilisateur mis à jour", "success");
  } catch (err) {
    if (err instanceof Error) {
      showToast(err.message, "error");
    } else {
      showToast("Unexpected error", "error");
    }
  }
}
// -----------------------------
  // LOADING / INITIALIZATION
  // -----------------------------
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-slate-400">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Shield />
          <h1 className="text-2xl font-bold">Administration</h1>
        </div>

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded"
        >
          <ArrowLeft size={16} />
          Accueil
        </button>
      </div>

      {/* CREATE USER */}
      <div className="bg-slate-900 p-4 rounded mb-6">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus />
          <h2 className="font-bold">Créer un utilisateur</h2>
        </div>

        <div className="grid gap-2">
          <input
            placeholder="Utilisateur"
            className="p-2 bg-slate-800 rounded"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Mot de passe"
            className="p-2 bg-slate-800 rounded"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

<select
  className="p-2 bg-slate-800 rounded"
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

          <div className="flex gap-2">
            <input
              type="time"
              className="p-2 bg-slate-800 rounded w-full"
              value={form.accessStart}
              onChange={(e) =>
                setForm({ ...form, accessStart: e.target.value })
              }
            />
            <input
              type="time"
              className="p-2 bg-slate-800 rounded w-full"
              value={form.accessEnd}
              onChange={(e) =>
                setForm({ ...form, accessEnd: e.target.value })
              }
            />
          </div>

          <button
            onClick={handleCreate}
            className="bg-green-600 py-2 rounded"
          >
            Ajouter utilisateur
          </button>
        </div>
      </div>

      {/* USER LIST */}
      <div className="space-y-3">
        {users.map((u) => (
         <div
  key={u.id}
  className={`
    p-4 rounded-xl border transition-all duration-200
    flex justify-between items-center
    ${
      u.disabled
        ? "bg-red-950/20 border-red-800"
        : "bg-slate-800/60 border-slate-700 hover:bg-slate-800"
    }
  `}
>{confirmDeleteId && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-slate-900 p-6 rounded-xl w-[360px]">

      <h2 className="text-lg font-bold mb-2 text-red-400">
        Supprimer l'utilisateur
      </h2>

      <p className="text-slate-400 mb-5">
        Êtes-vous sûr de vouloir supprimer cet utilisateur ?
        Cette action est irréversible.
      </p>

      <div className="flex justify-end gap-2">

        <button
          onClick={() => setConfirmDeleteId(null)}
          className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
        >
          Annuler
        </button>

        <button
          onClick={() => {
            handleDelete(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          className="px-3 py-1 rounded bg-red-600 hover:bg-red-500"
        >
          Supprimer
        </button>

      </div>

    </div>
  </div>
)}
  {/* LEFT */}
  <div>
    <div className="flex items-center gap-2 font-semibold text-white">
      {u.username}

    </div>

    <div className="text-sm text-slate-400">
      <span className="px-2 py-1 text-xs rounded bg-slate-700 text-white">
  {u.role}
</span>
    </div>

<div className="text-xs text-slate-500 mt-1">
  <div className="font-medium text-slate-400">Access:</div>
  <div>
    {u.accessStart || "00:00"} → {u.accessEnd || "23:59"}
  </div>
</div>
  </div>

  {/* RIGHT ACTIONS */}
  <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
    <DeployButton user={u} />
    <button
      onClick={() => setEditingUser({ ...u })}
      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 transition"
    >
      Modifier
    </button>

    <button
      onClick={() => handleToggleDisabled(u.id)}
     disabled={user?.id === u.id}
className={`px-3 py-1 rounded-lg transition ${
  user?.id === u.id
    ? "opacity-40 cursor-not-allowed bg-gray-600"
    : "bg-yellow-600 hover:bg-yellow-500"
}`}
    >
      {u.disabled ? "Activer" : "Désactiver"}
    </button>

   <button
  onClick={() => setConfirmDeleteId(u.id)}
  disabled={user?.id === u.id}
  className={`px-3 py-1 rounded-lg transition ${
    user?.id === u.id
      ? "bg-gray-700 opacity-50 cursor-not-allowed"
      : "bg-red-600 hover:bg-red-500"
  }`}
>
  Supprimer
</button>
  </div>
</div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-slate-900 p-6 rounded w-[400px]">

            <h2 className="font-bold mb-4">Modifier l'utilisateur</h2>

            <input
              className="w-full p-2 mb-2 bg-slate-800"
              value={editingUser.username}
              onChange={(e) =>
                setEditingUser({
                  ...editingUser,
                  username: e.target.value,
                })
              }
            />

            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-2 mb-2 bg-slate-800"
              value={editingUser.password}
              onChange={(e) =>
                setEditingUser({
                  ...editingUser,
                  password: e.target.value,
                })
              }
            />

            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-blue-400 mb-2"
            >
              afficher le mot de passe
            </button>

<select
  className="w-full p-2 mb-2 bg-slate-800"
  value={editingUser.role}
  onChange={(e) =>
    setEditingUser({
      ...editingUser,
      role: e.target.value as Role,
    })
  }
>
  <option value="admin">admin</option>
  <option value="visiteur">visiteur</option>
  <option value="epr2">epr2</option>
  <option value="restaurant">restaurant</option>
  <option value="pecheur">pecheur</option>
</select>

            <div className="flex gap-2">
              <input
                type="time"
                className="w-full p-2 bg-slate-800"
                value={editingUser.accessStart || ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    accessStart: e.target.value,
                  })
                }
              />
              

              <input
                type="time"
                className="w-full p-2 bg-slate-800"
                value={editingUser.accessEnd || ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    accessEnd: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingUser(null)}
                className="bg-gray-700 px-3 py-1 rounded"
              >
                Annuler
              </button>

              <button
                onClick={handleSave}
                className="bg-green-600 px-3 py-1 rounded"
              >
                Enregistrer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}