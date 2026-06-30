// lib/authService.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

import { getUsersStorage, saveUsersStorage } from "./storage";

/**
 * Safety guard so we NEVER hit undefined.endsWith() type crashes
 */
function getApiBase(): string {
  if (!API_BASE) {
    console.warn("⚠️ NEXT_PUBLIC_API_URL is missing, defaulting to /api");
    return "/api";
  }

  return API_BASE;
}

export function initUsers() {
  const existing = getUsersStorage();

  if (!existing || existing.length === 0) {
    saveUsersStorage([
      {
        id: "1",
        username: "admin",
        password: "admin",
        role: "admin",
        disabled: false,
        accessStart: "00:00",
        accessEnd: "23:59",
      },
    ]);
  }
}



/**
 * LOGIN
 */
export async function loginService(username: string, password: string) {
  const base = getApiBase();

  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  let data: any = {};

  try {
    data = await res.json();
  } catch {
    // ignore invalid JSON responses
  }

  if (!res.ok) {
    throw new Error(data?.message || "Échec de connexion");
  }

  return data;
}

/**
 * GET CURRENT USER
 */
export async function getMe(token?: string) {
  const base = getApiBase();

  const res = await fetch(`${base}/auth/me`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let data: any = {};

  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(data?.message || "Session invalide");
  }

  return data;
}
