"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    console.log("SW REGISTER COMPONENT MOUNTED");

    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("✔ SW REGISTERED:", reg.scope);
      })
      .catch((err) => {
        console.error("❌ SW FAILED:", err);
      });
  }, []);

  return null;
}