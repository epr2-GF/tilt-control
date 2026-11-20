
"use client";

import { useEffect } from "react";
import { initUsers } from "../lib/authService";

export default function AppInit({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initUsers();

    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers are not supported.");
      return;
    }


navigator.serviceWorker
  .register("/sw.js", { scope: "/" })
  .then(async (registration) => {
    console.log("Tilt44 service worker registered:", registration.scope);

    // Check whether a newer service worker is available.
    await registration.update();

    if (registration.waiting) {
      console.log("A new service worker is waiting.");
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;

      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "activated") {
          console.log("Tilt44 service worker updated and activated.");
        }
      });
    });
  })
  .catch((error) => {
    console.error("Tilt44 service worker registration failed:", error);
  });

  }, []);

  return <>{children}</>;
}
