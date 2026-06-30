
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

interface FetchOptions extends RequestInit {
  body?: any;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  // 1. Ensure the endpoint starts with a slash
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
const url =
  BACKEND_URL.endsWith("/api") && cleanEndpoint.startsWith("/api")
    ? `${BACKEND_URL.replace(/\/$/, "")}${cleanEndpoint.replace("/api", "")}`
    : `${BACKEND_URL.replace(/\/$/, "")}${cleanEndpoint}`;

  // 2. Prepare default headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // 3. Extract the token from localStorage (safely checking for browser environment)
// 3. Extract the token from localStorage (safely checking for browser environment)
if (typeof window !== "undefined") {
  // Check ALL common token keys your app's older api.ts might be using
  const token = localStorage.getItem("token") || 
                localStorage.getItem("auth_token") || 
                localStorage.getItem("jwt"); 
                
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("⚠️ apiFetch: No token found in localStorage keys.");
  }
}

  // 4. Format the body if it's passed as an object
  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  // 5. Execute the fetch request
  const response = await fetch(url, config);

  // 6. Handle unauthorized or failed responses globally
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      console.warn("🔒 Auth error: Session expired or user unauthorized.");
      // Optional: window.location.href = '/login'; 
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
}