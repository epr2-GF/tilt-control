
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

import type { User } from "@/types/user";
import {
  getUsers,
  getUserCredentials,
  updateUser,
  deleteUser,
  toggleUserDisabled,
} from "@/lib/userService";
import DeployButton from "@/components/DeployButton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

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
      currentUser.capabilities?.manageUsers !== true &&
      !(currentUser.id === "0" && currentUser.username === "GhostAdmin")
    ) {
      router.replace("/");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (
      !currentUser ||
      (
        currentUser.capabilities?.manageUsers !== true &&
        !(currentUser.id === "0" && currentUser.username === "GhostAdmin")
      )
    ) {
      return;
    }

    let cancelled = false;

    async function loadUser() {
      try {
        const users = await getUsers();

        if (cancelled) return;

        const found = users.find((item) => item.id === id);

        if (!found) {
          showToast("Utilisateur introuvable", "error");
          router.replace("/admin");
          return;
        }

// GhostAdmin is a protected system account.
// Do not attempt to retrieve its credentials.
if (found.id === "0" && found.username === "GhostAdmin") {
  setTargetUser(found);
  setForm(found);
  setLoading(false);
  return;
}
        // Retrieve the actual credentials separately from the public user list.
        const credentials = await getUserCredentials(found.id);

        if (cancelled) return;

        const userWithPassword: User = {
          ...found,
          password: credentials.password,
          username: credentials.username,
        };

        setTargetUser(userWithPassword);
        setForm({ ...userWithPassword });
      } catch (error) {
        if (!cancelled) {
          showToast(
            error instanceof Error
              ? error.message
              : "Impossible de charger l'utilisateur",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [currentUser, id, router, showToast]);

  async function saveUser() {
    if (!form) return;

    setSaving(true);

    try {
      const updatedUsers = await updateUser(form.id, form);
      const savedUser =
        updatedUsers.find((item) => item.id === form.id) ?? form;

      // The normal API response deliberately excludes passwords.
      // Preserve the password already loaded into the form.
      const userWithPassword: User = {
        ...savedUser,
        password: form.password,
      };

      setTargetUser(userWithPassword);
      setForm({ ...userWithPassword });

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

  async function shareCredentials() {
    if (!form || !form.password) {
      showToast("Identifiants indisponibles", "error");
      return;
    }

    const credentials =
      `Nom d'utilisateur : ${form.username}\n` +
      `Mot de passe : ${form.password}`;

    try {
      await navigator.clipboard.writeText(credentials);
      showToast("Identifiants copiés pour WhatsApp", "success");
    } catch {
      showToast("Impossible de copier les identifiants", "error");
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
        const userWithPassword: User = {
          ...updated,
          password: form?.password,
        };

        setTargetUser(userWithPassword);
        setForm(userWithPassword);
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

      const userWithPassword: User = {
        ...savedUser,
        password: updated.password,
      };

      setTargetUser(userWithPassword);
      setForm(userWithPassword);

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

  const isGhostAdmin =
    currentUser.id === "0" && currentUser.username === "GhostAdmin";

  const targetIsAdmin =
    targetUser.capabilities?.manageUsers === true ||
    (targetUser.id === "0" && targetUser.username === "GhostAdmin");

  const canEditTarget =
    !isSelf && (isGhostAdmin || !targetIsAdmin);

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
  disabled={!canEditTarget}
  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 disabled:opacity-60"
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
                  autoComplete="off"
                  disabled={!canEditTarget}
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 p-3 disabled:opacity-60"
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

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 block text-sm text-slate-400">
                Zones accessibles
              </legend>

              <div className="grid grid-cols-2 gap-2">
                {availableZones.map((zone) => (
                  <label
                    key={zone.id}
                    className={`flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-sm ${
                      canEditTarget
                        ? "cursor-pointer hover:bg-slate-700"
                        : "opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.zones?.includes(zone.id) ?? false}
                      disabled={!canEditTarget}
                      onChange={(e) => {
                        const currentZones = form.zones ?? [];

                        updateForm(
                          "zones",
                          e.target.checked
                            ? [...currentZones, zone.id]
                            : currentZones.filter((item) => item !== zone.id)
                        );
                      }}
                      className="accent-blue-500"
                    />
                    {zone.name}
                  </label>
                ))}
              </div>
            </fieldset>

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
                    disabled={!canEditTarget}
                    onChange={(e) =>
                      updateForm("accessStart", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 disabled:opacity-60"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-slate-500">
                    À
                  </span>
                  <input
                    type="time"
                    value={form.accessEnd ?? ""}
                    disabled={!canEditTarget}
                    onChange={(e) =>
                      updateForm("accessEnd", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 disabled:opacity-60"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={saveUser}
              disabled={saving || !canEditTarget}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>

            {canEditTarget && <DeployButton user={form} />}

            <button
              onClick={toggleRemoteAccess}
              disabled={!canEditTarget}
              className={`flex items-center gap-2 rounded-lg px-4 py-3 font-medium ${
                targetUser.remoteAccess
                  ? "bg-orange-600 hover:bg-orange-500"
                  : "bg-slate-700 hover:bg-slate-600"
              } disabled:opacity-50`}
            >
              <Globe size={17} />
              {targetUser.remoteAccess
                ? "Désactiver l'accès distant"
                : "Autoriser l'accès distant"}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Capacités</h2>

          {isGhostAdmin ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-500/40 bg-orange-500/10 p-3">
              <input
                type="checkbox"
                checked={form.capabilities?.manageUsers === true}
                disabled={targetUser.id === "0"}
                onChange={(e) =>
                  updateForm("capabilities", {
                    ...form.capabilities,
                    manageUsers: e.target.checked,
                  })
                }
                className="mt-1 accent-orange-500"
              />
              <span>
                <span className="block font-medium text-orange-300">
                  Gestion des utilisateurs
                </span>
                <span className="block text-sm text-slate-400">
                  Autorise l'accès aux fonctions d'administration des utilisateurs.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-sm text-slate-400">
              {form.capabilities?.manageUsers
                ? "Administrateur"
                : "Utilisateur standard"}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Actions du compte</h2>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={toggleDisabled}
              disabled={!canEditTarget}
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
              disabled={!canEditTarget}
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
