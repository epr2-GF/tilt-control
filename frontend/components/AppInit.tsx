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
  }, []);

  return <>{children}</>;
}