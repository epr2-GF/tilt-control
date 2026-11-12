
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
      .then((registration) => {
        console.log("Tilt44 service worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("Tilt44 service worker registration failed:", error);
      });
  }, []);

  return <>{children}</>;
}
