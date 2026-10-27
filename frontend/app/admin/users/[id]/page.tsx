
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Globe,
  UserRound,
} from "lucide-react";

import type { User, Role } from "@/types/user";
import {
  getUsers,
  updateUser,
  deleteUser,
  toggleUserDisabled,
} from "@/lib/userService";
import DeployButton from "@/components/DeployButton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const roles: Role[] = [
  "superadmin",
  "admin",
  "visiteur",
  "epr2",
  "restaurant",
  "pecheur",
];

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);

  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [form, setForm] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser === null) {
      router.replace("/login");
      return;
    }

    if (
      currentUser &&
      currentUser.role !== "admin" &&
      currentUser.role !== "superadmin"
    ) {
      router.replace("/");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (
      !currentUser ||
      (currentUser.role !== "admin" &&
        currentUser.role !== "superadmin")
    ) {
      return;
    }

    async function loadUser() {
      try {
        const users = await getUsers();
        const found = users.find((item) => item.id === id);

        if (!found) {
          showToast("Utilisateur introuvable", "error");
          router.replace("/admin");
          return;
        }

        setTargetUser(found);
        setForm({ ...found });
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Impossible de charger l'utilisateur",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, [currentUser, id, router, showToast]);

  async function saveUser() {
    if (!form) return;

    setSaving(true);

    try {
      const updatedUsers = await updateUser(form.id, form);
      const savedUser =
        updatedUsers.find((item) => item.id === form.id) ?? form;

      setTargetUser(savedUser);
      setForm({ ...savedUser });
      showToast("Utilisateur mis à jour", "success");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Échec de la mise à jour",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleDisabled() {
    if (!targetUser || targetUser.id === currentUser?.id) return;

    try {
      const updatedUsers = await toggleUserDisabled(targetUser.id);
      const updated = updatedUsers.find(
        (item) => item.id === targetUser.id
      );

      if (updated) {
        setTargetUser(updated);
        setForm({ ...updated });
      }

      showToast("Statut de l'utilisateur mis à jour", "success");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Échec de la mise à jour du statut",
        "error"
      );
    }
  }

  async function toggleRemoteAccess() {
    if (!form || !targetUser) return;

    const updated = {
      ...form,
      remoteAccess: !form.remoteAccess,
    };

    try {
      const updatedUsers = await updateUser(updated.id, updated);
      const savedUser =
        updatedUsers.find((item) => item.id === updated.id) ?? updated;

      setTargetUser(savedUser);
      setForm({ ...savedUser });
      showToast("Accès distant modifié", "success");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Échec de la modification de l'accès distant",
        "error"
      );
    }
  }

  async function removeUser() {
    if (!targetUser || targetUser.id === currentUser?.id) return;

    if (
      !window.confirm(
        `Supprimer définitivement l'utilisateur « ${targetUser.username} » ?`
      )
    ) {
      return;
    }

    try {
      await deleteUser(targetUser.id);
      showToast("Utilisateur supprimé", "success");
      router.replace("/admin");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Échec de la suppression",
        "error"
      );
    }
  }

  if (currentUser === undefined || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!currentUser || !targetUser || !form) return null;

  const isSelf = targetUser.id === currentUser.id;

  function updateForm<K extends keyof User>(key: K, value: User[K]) {
    setForm((previous) =>
      previous ? { ...previous, [key]: value } : previous
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <UserRound className="shrink-0 text-blue-400" size={28} />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">Utilisateur</h1>
              <p className="truncate text-sm text-slate-400">
                {targetUser.username}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/admin")}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 hover:bg-slate-700"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Retour</span>
          </button>
        </header>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Shield size={19} />
              Informations du compte
            </h2>

            <span
              className={`rounded-lg px-3 py-1 text-sm ${
                targetUser.disabled
                  ? "bg-orange-950 text-orange-400"
                  : "bg-green-950 text-green-400"
              }`}
            >
              {targetUser.disabled ? "Désactivé" : "Actif"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-slate-400">
                Nom d'utilisateur
              </span>
              <input
                value={form.username}
                onChange={(e) => updateForm("username", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3"
              />
            </label>

            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Mot de passe
              </label>
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password ?? ""}
                  onChange={(e) => updateForm("password", e.target.value)}
                  autoComplete="new-password"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 p-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="rounded-lg bg-slate-700 px-3 hover:bg-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm text-slate-400">Rôle</span>
              <select
                value={form.role}
                onChange={(e) =>
                  updateForm("role", e.target.value as Role)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="mb-1 block text-sm text-slate-400">
                Accès autorisé
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="mb-1 block text-xs text-slate-500">
                    De
                  </span>
                  <input
                    type="time"
                    value={form.accessStart ?? ""}
                    onChange={(e) =>
                      updateForm("accessStart", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-slate-500">
                    À
                  </span>
                  <input
                    type="time"
                    value={form.accessEnd ?? ""}
                    onChange={(e) =>
                      updateForm("accessEnd", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={saveUser}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>

            <DeployButton user={form} />

            <button
              onClick={toggleRemoteAccess}
              className={`flex items-center gap-2 rounded-lg px-4 py-3 font-medium ${
                targetUser.remoteAccess
                  ? "bg-orange-600 hover:bg-orange-500"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              <Globe size={17} />
              {targetUser.remoteAccess
                ? "Désactiver l'accès distant"
                : "Autoriser l'accès distant"}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Permissions</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm text-slate-400">Zones</h3>
              {targetUser.permissions?.zones?.length ? (
                <div className="flex flex-wrap gap-2">
                  {targetUser.permissions.zones.map((zone) => (
                    <span
                      key={zone}
                      className="rounded bg-slate-800 px-3 py-1 text-sm"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Aucune zone définie</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm text-slate-400">Commandes</h3>
              {targetUser.permissions?.controls?.length ? (
                <div className="flex flex-wrap gap-2">
                  {targetUser.permissions.controls.map((control) => (
                    <span
                      key={control}
                      className="rounded bg-slate-800 px-3 py-1 text-sm"
                    >
                      {control}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Aucune commande définie
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Les permissions sont affichées ici en lecture seule pour préserver
            le fonctionnement actuel.
          </p>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Actions du compte</h2>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={toggleDisabled}
              disabled={isSelf}
              className={`rounded-lg px-4 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                targetUser.disabled
                  ? "bg-green-700 hover:bg-green-600"
                  : "bg-yellow-600 hover:bg-yellow-500"
              }`}
            >
              {targetUser.disabled
                ? "Réactiver l'utilisateur"
                : "Désactiver l'utilisateur"}
            </button>

            <button
              onClick={removeUser}
              disabled={isSelf}
              className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-3 font-medium hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={17} />
              Supprimer l'utilisateur
            </button>
          </div>

          {isSelf && (
            <p className="mt-3 text-sm text-slate-400">
              Vous ne pouvez pas désactiver ni supprimer votre propre compte.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
