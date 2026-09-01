// frontend/lib/api.ts

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

/* ---------------------------------------------------------
   SAFE TOKEN GETTER
--------------------------------------------------------- */

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    "smart-site-token"
  );
}


/* ---------------------------------------------------------
   CORE FETCH WRAPPER
--------------------------------------------------------- */

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  tokenOverride?: string
) {
  const token =
    tokenOverride ?? getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  /* -------------------------------------------------------
     CLEAN API URL
  ------------------------------------------------------- */

  const baseUrl =
    API_URL.endsWith("/")
      ? API_URL.slice(0, -1)
      : API_URL;

  const cleanEndpoint =
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;


  /* -------------------------------------------------------
     REQUEST
  ------------------------------------------------------- */

  const res = await fetch(
    `${baseUrl}${cleanEndpoint}`,
    {
      ...options,
      headers,
      cache: "no-store",
    }
  );


  /* -------------------------------------------------------
     401 = SESSION UNAUTHORIZED
     
     Only 401 logs the user out.
  ------------------------------------------------------- */

  if (res.status === 401) {

    const error =
      await res.json()
        .catch(() => ({}));

    const message =
      error.message ||
      "Session non autorisée ou expirée";


    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {

      console.warn(
        "Unauthorized API response - resetting session."
      );

      localStorage.removeItem(
        "smart-site-token"
      );

      sessionStorage.setItem(
        "logout-message",
        message
      );

      window.location.href =
        "/login";
    }


    throw new Error(message);
  }


  /* -------------------------------------------------------
     ERROR HANDLING
     
     IMPORTANT:
     
     403 is NOT a logout.
     
     It can mean:
       - outside time window
       - outside permitted area
       - insufficient permissions
       - protected user deletion
       - device disabled
       - etc.
     
     The calling page/component receives the error so it
     can display its toast.
  ------------------------------------------------------- */

  if (!res.ok) {

    const error =
      await res.json()
        .catch(() => ({}));

    const message =
      error.message ||
      error.error ||
      "API Error";

    throw new Error(message);
  }


  /* -------------------------------------------------------
     SUCCESS
  ------------------------------------------------------- */

  return res.json();
}


/* ---------------------------------------------------------
   AUTH
--------------------------------------------------------- */

export async function getMe() {
  return apiFetch(
    "/auth/me"
  );
}


/* ---------------------------------------------------------
   USERS
--------------------------------------------------------- */

export async function getUsers() {
  return apiFetch(
    "/users"
  );
}


export async function createUser(
  user: any
) {
  return apiFetch(
    "/users",
    {
      method: "POST",
      body: JSON.stringify(user),
    }
  );
}


export async function updateUser(
  id: string,
  user: any
) {
  return apiFetch(
    `/users/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(user),
    }
  );
}


export async function deleteUser(
  id: string
) {
  return apiFetch(
    `/users/${id}`,
    {
      method: "DELETE",
    }
  );
}


export async function toggleUserDisabled(
  id: string
) {
  return apiFetch(
    `/users/${id}/toggle`,
    {
      method: "PATCH",
    }
  );
}