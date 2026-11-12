
"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Shield } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function SecurityModeButton() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadState() {
    try {
      const data = await apiFetch("/security/state");
      setEnabled(data.state === "on");
    } catch (error) {
      console.error("Unable to load security mode:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadState();
  }, []);

  async function toggleSecurity() {
    setBusy(true);

    try {
      const data = await apiFetch("/security/toggle", {
        method: "POST",
      });

      setEnabled(data.state === "on");
    } catch (error) {
      console.error("Security mode error:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le mode sécurité."
      );

      await loadState();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <span className="text-xs text-amber-400">Sécurité...</span>;
  }
  return (
    <button
      type="button"
      onClick={toggleSecurity}
      disabled={busy}
      title={
        enabled
          ? "Désactiver le mode sécurité"
          : "Activer le mode sécurité"
      }
      aria-label={
        enabled
          ? "Désactiver le mode sécurité"
          : "Activer le mode sécurité"
      }
      className={`w-full min-w-0 aspect-square flex items-center justify-center rounded-xl transition disabled:opacity-50 ${
        enabled
          ? "bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse"
          : "bg-slate-800 hover:bg-slate-700 text-slate-400"
      }`}
    >
      {enabled ? (
        <ShieldCheck size={39} strokeWidth={2.5} />
      ) : (
        <Shield size={39} strokeWidth={2.5} />
      )}
    </button>
  );
}
