
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import type { User } from "@/types/user";
import { getUsers } from "@/lib/userService";
import { apiFetch } from "@/lib/api";
import CreateUserModal from "@/components/CreateUserModal";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  UserPlus,
  Pencil,
  ArrowLeft,
  Bell,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);

  const [notificationSecret, setNotificationSecret] = useState("");
  const [showNotificationSecret, setShowNotificationSecret] = useState(false);
  const [loadingSecret, setLoadingSecret] = useState(false);

  // -----------------------------
  // AUTH GUARD
  // -----------------------------
  useEffect(() => {
    if (user === null) {
      router.push("/login");
      return;
    }

    if (
      user &&
      user.capabilities?.manageUsers !== true &&
      !(user.id === "0" && user.username === "GhostAdmin")
    ) {
      router.push("/");
    }
  }, [user, router]);

  // -----------------------------
  // LOAD USERS
  // -----------------------------
  useEffect(() => {
    if (
      !user ||
      (
        user.capabilities?.manageUsers !== true &&
        !(user.id === "0" && user.username === "GhostAdmin")
      )
    ) {
      return;
    }

    let cancelled = false;

    async function loadUsers() {
      try {
        const data = await getUsers();

        if (!cancelled) {
          setUsers(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load users:", err);
          showToast("Impossible de charger les utilisateurs", "error");
        }
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [user, showToast]);

  // -----------------------------
  // LOAD HOME ASSISTANT SECRET
  // -----------------------------
  async function toggleNotificationSecret() {
    if (showNotificationSecret) {
      setShowNotificationSecret(false);
      return;
    }

    if (notificationSecret) {
      setShowNotificationSecret(true);
      return;
    }

    setLoadingSecret(true);

    try {
      const result = await apiFetch(
        "/notifications/home-assistant-secret"
      );

      if (!result?.secret) {
        throw new Error("Secret de notification indisponible");
      }

      setNotificationSecret(result.secret);
      setShowNotificationSecret(true);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Impossible de récupérer le secret",
        "error"
      );
    } finally {
      setLoadingSecret(false);
    }
  }

  // -----------------------------
  // COPY HOME ASSISTANT SECRET
  // -----------------------------
  async function copyNotificationSecret() {
    if (!notificationSecret) return;

    try {
      await navigator.clipboard.writeText(notificationSecret);
      showToast("Secret copié dans le presse-papiers", "success");
    } catch {
      showToast("Impossible de copier le secret", "error");
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

  const isGhostAdmin =
    user.id === "0" && user.username === "GhostAdmin";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Shield />
          <h1 className="text-2xl font-bold">
            Administration
          </h1>
        </div>

        <button
          onClick={() => router.push("/")}
          className="
            flex items-center gap-2
            bg-slate-800 hover:bg-slate-700
            px-4 py-2 rounded-lg transition
          "
        >
          <ArrowLeft size={16} />
          Accueil
        </button>
      </div>

      {/* CREATE USER */}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreateUser(true)}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-medium transition hover:bg-green-500"
        >
          <UserPlus size={18} />
          Ajouter un utilisateur
        </button>
      </div>

      {/* USER LIST */}
      <div className="space-y-2">
        {[...users]
          .sort((a, b) =>
            a.username.localeCompare(b.username, undefined, {
              sensitivity: "base",
              numeric: true,
            })
          )
          .map((u) => (
            <div
              key={u.id}
              className={`
                flex items-center justify-between gap-4
                rounded-lg border px-4 py-2.5 transition-colors
                ${
                  u.disabled
                    ? "border-orange-600/70 bg-orange-950/40 hover:bg-orange-950/60"
                    : "border-slate-700 bg-slate-800/60 hover:bg-slate-800"
                }
              `}
            >
              <div
                className={`min-w-0 truncate font-semibold ${
                  u.disabled ? "text-orange-400" : "text-white"
                }`}
              >
                {u.username}
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(`/admin/users/${encodeURIComponent(u.id)}`)
                }
                disabled={
                  !isGhostAdmin &&
                  (
                    u.capabilities?.manageUsers === true ||
                    (u.id === "0" && u.username === "GhostAdmin")
                  )
                }
                aria-label={`Modifier ${u.username}`}
                title={
                  !isGhostAdmin &&
                  (
                    u.capabilities?.manageUsers === true ||
                    (u.id === "0" && u.username === "GhostAdmin")
                  )
                    ? "Modification réservée au superadministrateur"
                    : `Modifier ${u.username}`
                }
                className="
                  flex shrink-0 items-center justify-center
                  rounded-lg border border-slate-600
                  bg-slate-700 p-2 transition
                  hover:bg-blue-600
                  disabled:cursor-not-allowed
                  disabled:opacity-30
                  disabled:hover:bg-slate-700
                "
              >
                <Pencil size={18} />
              </button>
            </div>
          ))}
      </div>

      {/* HOME ASSISTANT NOTIFICATIONS - GHOSTADMIN ONLY */}
      {isGhostAdmin && (
        <section className="mt-8 rounded-xl border border-blue-500/30 bg-slate-900 p-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Bell size={20} className="text-blue-400" />
            Notifications Home Assistant
          </h2>

          <p className="mb-4 text-sm text-slate-400">
            Secret utilisé par Home Assistant pour envoyer des notifications
            push à Tilt44.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={toggleNotificationSecret}
              disabled={loadingSecret}
              className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-3 font-medium hover:bg-slate-600 disabled:opacity-50"
            >
              {showNotificationSecret ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
              {loadingSecret
                ? "Chargement..."
                : showNotificationSecret
                  ? "Masquer le secret"
                  : "Afficher le secret"}
            </button>

            {showNotificationSecret && (
              <button
                type="button"
                onClick={copyNotificationSecret}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium hover:bg-blue-500"
              >
                <Copy size={17} />
                Copier
              </button>
            )}
          </div>

          {showNotificationSecret && notificationSecret && (
            <div className="mt-4 break-all rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-green-400 select-all">
              {notificationSecret}
            </div>
          )}

          <p className="mt-4 text-xs text-orange-400">
            Attention : ce secret donne accès à l'envoi de notifications.
            Ne le partagez pas et ne l'inscrivez jamais dans un fichier public.
          </p>
        </section>
      )}

      {/* CREATE USER DIALOGUE */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onCreated={setUsers}
        />
      )}
    </div>
  );
}
