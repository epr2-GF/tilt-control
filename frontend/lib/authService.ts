
import { getUsersStorage, saveUsersStorage } from "./storage";

/**
 * Seed default admin user
 */
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
 * LOGIN LOGIC
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function loginService(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({})); // ✅ REQUIRED

  const errorMap: Record<string, string> = {
    "Outside permitted hours":
      "⛔ Accès refusé : vous êtes en dehors des heures autorisées",
    "Account disabled": "❌ Compte désactivé",
    "Invalid token": "❌ Session invalide",
    "User not found": "❌ Utilisateur introuvable",
  };

  if (!res.ok) {
    const msg =
      data.message && errorMap[data.message]
        ? errorMap[data.message]
        : data.message || "Échec de connexion";

    throw new Error(msg);
  }

  return data;
}

