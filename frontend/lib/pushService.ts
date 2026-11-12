
import { apiFetch } from "./api";

function urlBase64ToUint8Array(
  base64String: string
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const bytes = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }

  return bytes;
}

function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function registerSubscription(
  subscription: PushSubscription
): Promise<void> {
  await apiFetch("/notifications/subscribe", {
    method: "POST",
    body: JSON.stringify({
      subscription: subscription.toJSON(),
    }),
  });
}

export async function enablePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    throw new Error(
      "Les notifications ne sont pas prises en charge par ce navigateur."
    );
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      "L'autorisation de notification a été refusée."
    );
  }

  const registration = await navigator.serviceWorker.ready;
  const config = await apiFetch("/notifications/vapid-public-key");

  if (!config?.publicKey) {
    throw new Error("Clé publique de notification indisponible.");
  }

  let subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    });
  }

  await registerSubscription(subscription);
}

export async function disablePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  // Remove the backend record first.
  await apiFetch("/notifications/subscribe", {
    method: "DELETE",
    body: JSON.stringify({
      endpoint: subscription.endpoint,
    }),
  });

  // Then remove the browser subscription.
  await subscription.unsubscribe();
}

export async function getPushNotificationStatus(): Promise<{
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
}> {
  if (!isPushSupported()) {
    return {
      supported: false,
      permission: "unsupported",
      subscribed: false,
    };
  }

  const permission = Notification.permission;

  const registration = await navigator.serviceWorker.ready;

  const subscription =
    await registration.pushManager.getSubscription();

  if (!subscription || permission !== "granted") {
    return {
      supported: true,
      permission,
      subscribed: false,
    };
  }

  // Synchronise an existing browser subscription with Tilt44.
  await registerSubscription(subscription);

  return {
    supported: true,
    permission,
    subscribed: true,
  };
}

