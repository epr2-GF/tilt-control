
"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import {
  enablePushNotifications,
  disablePushNotifications,
  getPushNotificationStatus,
} from "@/lib/pushService";

export default function NotificationBell() {
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const status = await getPushNotificationStatus();

        if (active) {
          setSupported(status.supported);
          setSubscribed(status.subscribed);
        }
      } catch (error) {
        console.error("Unable to load notification status:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, []);

  async function toggleNotifications() {
    setBusy(true);

    try {
      if (subscribed) {
        await disablePushNotifications();
        setSubscribed(false);
      } else {
        await enablePushNotifications();

        const status = await getPushNotificationStatus();
        setSubscribed(status.subscribed);
      }
    } catch (error) {
      console.error("Notification settings error:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Impossible de modifier les notifications."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
  return <span className="text-xs text-amber-400">Notifications...</span>;
}

if (!supported) {
  return <span className="text-xs text-red-400">Push non disponible</span>;
}

  return (
    <button
      type="button"
      onClick={toggleNotifications}
      disabled={busy}
      title={
        subscribed
          ? "Désactiver les notifications sur cet appareil"
          : "Activer les notifications sur cet appareil"
      }
      aria-label={
        subscribed
          ? "Désactiver les notifications"
          : "Activer les notifications"
      }
      className={`p-2 rounded-lg transition disabled:opacity-50 ${
        subscribed
          ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
      }`}
    >
      {subscribed ? <Bell size={20} /> : <BellOff size={20} />}
    </button>
  );
}
