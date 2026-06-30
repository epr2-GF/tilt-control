// In lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
/* -----------------------------
   SAFE TOKEN GETTER
------------------------------ */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smart-site-token");
}

/* -----------------------------
   CORE FETCH WRAPPER
------------------------------ */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  tokenOverride?: string
) {
  const token = tokenOverride ?? getToken();

  console.log("TOKEN SENT:", token);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

/* -----------------------------
     CORE FETCH WRAPPER (WITH URL GUARD)
  ------------------------------ */
  
  // 🧼 Automatically strip trailing slashes from API_URL and add leading slashes to endpoint
  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const res = await fetch(`${baseUrl}${cleanEndpoint}`, {
    ...options,
    headers,
  });

/* -----------------------------
      AUTH HANDLING (FIXED origin loop check)
  ------------------------------ */
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined") {
      // CRITICAL GAP FIX: Only wipe the session and redirect if we aren't ALREADY sitting on the login route.
      // This protects your cold startup sequences from stepping on each other's toes.
      if (window.location.pathname !== "/login") {
        console.warn("Unauthorized API Handshake - Resetting access session.");
        localStorage.removeItem("smart-site-token");
        window.location.href = "/login";
      }
    }
    throw new Error("Session non autorisée ou expirée");
  }




  
  /* -----------------------------
     ERROR HANDLING
  ------------------------------ */
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "API Error");
  }

  return res.json();
}

/* -----------------------------
   AUTH
------------------------------ */
export async function getMe() {
  return apiFetch("/auth/me");
}

/* -----------------------------
   USERS
------------------------------ */
export async function getUsers() {
  return apiFetch("/users");
}

export async function createUser(user: any) {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export async function updateUser(id: string, user: any) {
  return apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(user),
  });
}

export async function deleteUser(id: string) {
  return apiFetch(`/users/${id}`, {
    method: "DELETE",
  });
}

export async function toggleUserDisabled(id: string) {
  return apiFetch(`/users/${id}/toggle`, {
    method: "PATCH",
  });
}

