"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiFetch } from "@/lib/api";

export default function SiteMessagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [message, setMessage] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      router.push("/");
    }
  }, [user, router]);

  // -----------------------------
  // LOAD MESSAGE
  // -----------------------------

  useEffect(() => {
    if (!user) return;

    async function loadMessage() {
      try {
        const data = await apiFetch("/admin/site-message");

        setMessage(data.message || "");
        setUpdatedAt(data.updatedAt || null);
        setUpdatedBy(data.updatedBy || null);
      } catch (error) {
        console.error(
          "Failed to load site message",
          error
        );

        showToast(
          "Impossible de charger le message",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    loadMessage();
  }, [user, showToast]);

  // -----------------------------
  // SAVE MESSAGE
  // -----------------------------

  async function handleSave() {
    if (saving || deleting) return;

    setSaving(true);

    try {
      const data = await apiFetch(
        "/admin/site-message",
        {
          method: "PUT",
          body: JSON.stringify({
            message,
          }),
        }
      );

      setMessage(data.message || "");
      setUpdatedAt(data.updatedAt || null);
      setUpdatedBy(data.updatedBy || null);

      showToast(
        "Message enregistré",
        "success"
      );
    } catch (error: any) {
      console.error(
        "Failed to save site message",
        error
      );

      showToast(
        error.message ||
          "Impossible d'enregistrer le message",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------
  // DELETE MESSAGE
  // -----------------------------

  async function handleDelete() {
    if (saving || deleting) return;

    setDeleting(true);

    try {
      const data = await apiFetch(
        "/admin/site-message",
        {
          method: "PUT",
          body: JSON.stringify({
            message: "",
          }),
        }
      );

      // Clear editor
      setMessage("");

      // Clear modification information
      setUpdatedAt(data.updatedAt || null);
      setUpdatedBy(data.updatedBy || null);

      showToast(
        "Message supprimé",
        "success"
      );
    } catch (error: any) {
      console.error(
        "Failed deleting site message",
        error
      );

      showToast(
        error.message ||
          "Échec de la suppression du message",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  }

  // -----------------------------
  // LOADING
  // -----------------------------

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">

          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />

          <span className="text-sm text-slate-400">
            Chargement...
          </span>

        </div>
      </div>
    );
  }

  if (!user) return null;

  // -----------------------------
  // PAGE
  // -----------------------------

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">

        <div className="flex items-center gap-3">

          <MessageSquare className="text-blue-400" />

          <h1 className="text-2xl font-bold">
            Message important
          </h1>

        </div>

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700 transition"
        >
          <ArrowLeft size={16} />
          Accueil
        </button>

      </div>


      {/* MESSAGE EDITOR */}

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">

        <div className="mb-4">

          <h2 className="font-bold text-lg">
            Message affiché sur l'accueil
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Ce message sera visible par tous les utilisateurs
            lorsqu'ils se connectent.
          </p>

        </div>


        <textarea
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Entrez le message important..."
          rows={8}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-y"
        />


        {/* FOOTER */}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">

          {/* LAST UPDATE */}

          <div className="text-xs text-slate-500">

           {user?.role === "superadmin" && (
  <div className="text-xs text-slate-500">

    {updatedAt && (
      <div>
        Dernière modification :
        {" "}
        {new Date(updatedAt).toLocaleString("fr-FR")}
      </div>
    )}

    {updatedBy && (
      <div>
        Par : {updatedBy}
      </div>
    )}

  </div>
)}

          </div>


          {/* ACTIONS */}

          <div className="flex gap-2">

            <button
              onClick={handleDelete}
              disabled={saving || deleting}
              className={`px-4 py-2 rounded-lg transition ${
                saving || deleting
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
            >
              {deleting
                ? "Suppression..."
                : "Supprimer"}
            </button>


            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className={`px-5 py-2.5 rounded-lg font-medium transition ${
                saving || deleting
                  ? "bg-slate-700 text-slate-400 cursor-wait"
                  : "bg-green-600 hover:bg-green-500 text-white"
              }`}
            >
              {saving
                ? "Enregistrement..."
                : "Enregistrer"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}